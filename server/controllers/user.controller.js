import { User } from "../models/User.js";

export async function getDepartmentStaff(req, res) {
    try {
        const staff = await User.find({
            role: "STAFF",
            department: req.user.department,
        })
            .select("name email role department")
            .sort({ name: 1 })
            .lean();

        return res.status(200).json({ staff });
    } catch (error) {
        console.error("Get department staff error:", error);
        return res.status(500).json({ message: "Unable to load department staff" });
    }
}
