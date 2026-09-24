import { Ticket } from "../models/Ticket.js";
import { processSlaBreachesInstitutionWide } from "../services/sla.breach.service.js";

const ACTIVE_STATUSES = ["OPEN", "IN_PROGRESS", "PENDING_STUDENT_ACTION", "REOPENED"];

function getStartOfToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
}

export async function getAnalyticsKpis(req, res) {
    try {
        if (req.user.role !== "ADMIN") {
            return res.status(403).json({ message: "You do not have permission to view global analytics" });
        }

        await processSlaBreachesInstitutionWide(req.user._id);

        const todayStart = getStartOfToday();

        const [
            totalTickets,
            totalActive,
            open,
            inProgress,
            pendingStudentAction,
            resolved,
            closed,
            breached,
            criticalPriority,
            resolvedToday,
            departmentBreakdown,
            departments,
        ] = await Promise.all([
            Ticket.countDocuments({}),
            Ticket.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
            Ticket.countDocuments({ status: "OPEN" }),
            Ticket.countDocuments({ status: { $in: ["IN_PROGRESS", "REOPENED"] } }),
            Ticket.countDocuments({ status: "PENDING_STUDENT_ACTION" }),
            Ticket.countDocuments({ status: "RESOLVED" }),
            Ticket.countDocuments({ status: "CLOSED" }),
            Ticket.countDocuments({
                isBreached: true,
                status: { $in: ACTIVE_STATUSES },
            }),
            Ticket.countDocuments({
                priority: "CRITICAL",
                status: { $in: ACTIVE_STATUSES },
            }),
            Ticket.countDocuments({
                status: "RESOLVED",
                resolvedAt: { $gte: todayStart },
            }),
            Ticket.aggregate([
                { $match: { status: { $in: ACTIVE_STATUSES } } },
                { $group: { _id: "$department", activeCount: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            Ticket.distinct("department"),
        ]);

        return res.status(200).json({
            totalTickets,
            totalActive,
            open,
            inProgress,
            pendingStudentAction,
            pendingAction: pendingStudentAction,
            resolved,
            closed,
            breached,
            breachedCount: breached,
            criticalPriority,
            resolvedToday,
            departmentBreakdown: departmentBreakdown.map((row) => ({
                department: row._id,
                activeCount: row.activeCount,
            })),
            departments: departments.sort(),
        });
    } catch (error) {
        console.error("Analytics KPI error:", error);
        return res.status(500).json({ message: "Unable to load analytics" });
    }
}
