import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

function validateLoginForm(email, password) {
    const errors = {};

    if (!email.trim()) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = "Enter a valid email address";
    }

    if (!password) {
        errors.password = "Password is required";
    }

    return errors;
}

export default function Login({ onRegister }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitError("");

        const errors = validateLoginForm(email, password);
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email.trim(), password);
        } catch (error) {
            setSubmitError(error.message || "Unable to sign in");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="app-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl dark:bg-pink-500/10" />
            <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            <div className="surface relative w-full max-w-md rounded-[28px] p-8 sm:p-10">
                <div className="mb-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--magenta-600)">
                        TicketManager
                    </p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">
                        Sign in to your account
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        College support portal for students and staff
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="field-control w-full rounded-xl px-3 py-2.5"
                            placeholder="student@ticketmanager.com"
                            disabled={isSubmitting}
                        />
                        {fieldErrors.email ? (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                        ) : null}
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="field-control w-full rounded-xl px-3 py-2.5 pr-12"
                            placeholder="Enter your password"
                            disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((current) => !current)}
                                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-(--magenta-600) dark:text-slate-400"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                    {showPassword ? <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /> : <path d="m3 3 18 18M10.6 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17.5 17.5 0 0 1-3 3.8M6.2 6.3C3.8 8.1 2.5 12 2.5 12s3.5 7 9.5 7c1.4 0 2.6-.3 3.7-.8" />}
                                    {showPassword ? <circle cx="12" cy="12" r="2.5" /> : null}
                                </svg>
                            </button>
                        </div>
                        {fieldErrors.password ? (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                        ) : null}
                    </div>

                    {submitError ? (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                            {submitError}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="primary-button w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-70"
                    >
                        {isSubmitting ? "Signing in..." : "Login"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                    New to TicketManager? <button type="button" onClick={onRegister} className="font-semibold text-(--magenta-600) hover:underline">Create Student Account</button>
                </p>
            </div>
        </div>
    );
}
