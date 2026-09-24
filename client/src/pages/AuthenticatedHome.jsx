import { useAuth } from "../context/AuthContext.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import StudentDashboard from "./StudentDashboard.jsx";

function RolePlaceholder() {
    const { user } = useAuth();

    return (
        <AppShell activeNav="dashboard">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900">
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {user?.role?.replaceAll("_", " ")} dashboard
                </h1>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    This role&apos;s workspace will be available in a later implementation step. Authentication and
                    theme are active — please sign in with a student account to test ticket workflows.
                </p>
            </div>
        </AppShell>
    );
}

export default function AuthenticatedHome() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    if (user.role === "STUDENT") {
        return <StudentDashboard />;
    }

    return <RolePlaceholder />;
}
