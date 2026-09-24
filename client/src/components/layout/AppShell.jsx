import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import ThemeToggle from "../ThemeToggle.jsx";

const STUDENT_NAV = [{ id: "dashboard", label: "My Dashboard" }];

function getNavItems(role) {
    if (role === "STUDENT") {
        return STUDENT_NAV;
    }
    return [{ id: "dashboard", label: "Dashboard" }];
}

export default function AppShell({ activeNav = "dashboard", onNavChange, children }) {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState("");
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    if (!user) {
        return null;
    }

    const navItems = getNavItems(user.role);

    const handleLogout = async () => {
        setLogoutError("");
        setIsLoggingOut(true);
        try {
            await logout();
        } catch (error) {
            setLogoutError(error.message || "Unable to log out");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleNavClick = (id) => {
        setMobileNavOpen(false);
        if (onNavChange) {
            onNavChange(id);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
            <div className="flex min-h-screen">
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${
                        mobileNavOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex h-full flex-col px-4 py-6">
                        <div className="mb-8">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                                TicketManager
                            </p>
                            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-50">Support Portal</p>
                        </div>

                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNavClick(item.id)}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                                        activeNav === item.id
                                            ? "bg-blue-600 text-white"
                                            : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                            <div className="text-sm">
                                <p className="font-semibold text-slate-900 dark:text-slate-50">{user.name}</p>
                                <p className="text-slate-600 dark:text-slate-300">{user.role.replaceAll("_", " ")}</p>
                                {user.department && user.role !== "STUDENT" ? (
                                    <p className="text-slate-500 dark:text-slate-400">{user.department}</p>
                                ) : null}
                                {user.rollNo ? (
                                    <p className="text-slate-500 dark:text-slate-400">Roll: {user.rollNo}</p>
                                ) : null}
                            </div>
                            <ThemeToggle className="w-full justify-center" />
                            {logoutError ? (
                                <p className="text-xs text-red-600 dark:text-red-400">{logoutError}</p>
                            ) : null}
                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                            >
                                {isLoggingOut ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </div>
                </aside>

                {mobileNavOpen ? (
                    <button
                        type="button"
                        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                        aria-label="Close navigation"
                        onClick={() => setMobileNavOpen(false)}
                    />
                ) : null}

                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(true)}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600"
                        >
                            Menu
                        </button>
                        <ThemeToggle />
                    </header>

                    <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
                </div>
            </div>
        </div>
    );
}
