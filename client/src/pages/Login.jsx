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

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 dark:bg-slate-950">
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
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
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
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
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50"
                            placeholder="Enter your password"
                            disabled={isSubmitting}
                        />
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
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? "Signing in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}
