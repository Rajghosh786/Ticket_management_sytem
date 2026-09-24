import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import ThemeToggle from "../ThemeToggle.jsx";

const STUDENT_NAV = [{ id: "dashboard", label: "My Dashboard" }];
const STAFF_NAV = [{ id: "dashboard", label: "Ticket Queue" }];
const DEPARTMENT_ADMIN_NAV = [{ id: "dashboard", label: "Department Queue" }];
const ADMIN_NAV = [{ id: "dashboard", label: "Management Dashboard" }];

function getNavItems(role) {
    if (role === "STUDENT") {
        return STUDENT_NAV;
    }
    if (role === "STAFF") {
        return STAFF_NAV;
    }
    if (role === "DEPARTMENT_ADMIN") {
        return DEPARTMENT_ADMIN_NAV;
    }
    if (role === "ADMIN") {
        return ADMIN_NAV;
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
        <div className="app-background min-h-screen">
            <div className="flex min-h-screen">
                <aside
                    className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-[var(--plum-950)] text-white transition-transform lg:static lg:translate-x-0 ${
                        mobileNavOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="flex h-full flex-col px-4 py-6">
                        <div className="mb-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-300">
                                TicketManager
                            </p>
                            <p className="mt-1 text-lg font-bold text-white">Support Portal</p>
                        </div>

                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNavClick(item.id)}
                                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                                        activeNav === item.id
                                            ? "bg-[var(--magenta-600)] text-white shadow-lg shadow-pink-950/20"
                                            : "text-white/65 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
                            <div className="text-sm">
                                <p className="font-semibold text-white">{user.name}</p>
                                <p className="text-white/60">{user.role.replaceAll("_", " ")}</p>
                                {user.department && user.role !== "STUDENT" ? (
                                    <p className="text-white/45">{user.department}</p>
                                ) : null}
                                {user.rollNo ? (
                                    <p className="text-white/45">Roll: {user.rollNo}</p>
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
                                className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-70"
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
                    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--line)] bg-white/75 px-4 py-3 backdrop-blur dark:bg-[#24182b]/80 lg:hidden">
                        <button
                            type="button"
                            onClick={() => setMobileNavOpen(true)}
                            className="rounded-xl border border-[var(--line)] bg-white/70 px-3 py-1.5 text-sm dark:bg-white/10"
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
