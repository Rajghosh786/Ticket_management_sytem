import { useState } from "react";
import { registerStudentAccount } from "../services/authService.js";
import ThemeToggle from "../components/ThemeToggle.jsx";

function validateRegistrationForm(values) {
    const errors = {};

    if (!values.email.trim()) {
        errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        errors.email = "Enter a valid email address";
    }

    if (!values.password) {
        errors.password = "Password is required";
    }

    if (!values.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
    } else if (values.password !== values.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
    }

    if (!values.rollNo.trim()) {
        errors.rollNo = "Roll number is required";
    }

    return errors;
}

function EyeIcon({ visible }) {
    return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {visible ? <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /> : <path d="m3 3 18 18M10.6 5.2A10.8 10.8 0 0 1 12 5c6 0 9.5 7 9.5 7a17.5 17.5 0 0 1-3 3.8M6.2 6.3C3.8 8.1 2.5 12 2.5 12s3.5 7 9.5 7c1.4 0 2.6-.3 3.7-.8" />}
            {visible ? <circle cx="12" cy="12" r="2.5" /> : null}
        </svg>
    );
}

export default function Register({ onLogin }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rollNo, setRollNo] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitError("");

        const errors = validateRegistrationForm({ email, password, confirmPassword, rollNo });
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setIsSubmitting(true);
        try {
            await registerStudentAccount({ email: email.trim(), password, rollNo: rollNo.trim() });
            setIsRegistered(true);
            setTimeout(() => onLogin(), 900);
        } catch (error) {
            setSubmitError(error.message || "Unable to create student account");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="app-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl dark:bg-pink-500/10" />
            <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/10" />
            <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
                <ThemeToggle />
            </div>

            <div className="surface relative w-full max-w-lg rounded-[28px] p-8 sm:p-10">
                <div className="mb-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-(--magenta-600)">TicketManager</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-50">Create Student Account</h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Join the college support portal</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label htmlFor="register-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                        <input id="register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field-control w-full rounded-xl px-3 py-2.5" placeholder="student@ticketmanager.com" disabled={isSubmitting} />
                        {fieldErrors.email ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="register-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                        <div className="relative">
                            <input id="register-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-control w-full rounded-xl px-3 py-2.5 pr-12" placeholder="Create a password" disabled={isSubmitting} />
                            <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-(--magenta-600) dark:text-slate-400" aria-label={showPassword ? "Hide password" : "Show password"}><EyeIcon visible={showPassword} /></button>
                        </div>
                        {fieldErrors.password ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="register-confirm-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm Password</label>
                        <div className="relative">
                            <input id="register-confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="field-control w-full rounded-xl px-3 py-2.5 pr-12" placeholder="Repeat your password" disabled={isSubmitting} />
                            <button type="button" onClick={() => setShowConfirmPassword((current) => !current)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-(--magenta-600) dark:text-slate-400" aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}><EyeIcon visible={showConfirmPassword} /></button>
                        </div>
                        {fieldErrors.confirmPassword ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.confirmPassword}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="register-roll-no" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Roll No</label>
                        <input id="register-roll-no" type="text" autoComplete="off" value={rollNo} onChange={(event) => setRollNo(event.target.value)} className="field-control w-full rounded-xl px-3 py-2.5" placeholder="Your student roll number" disabled={isSubmitting} />
                        {fieldErrors.rollNo ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.rollNo}</p> : null}
                    </div>

                    {submitError ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{submitError}</p> : null}
                    {isRegistered ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">Account created. Redirecting to login...</p> : null}

                    <button type="submit" disabled={isSubmitting || isRegistered} className="primary-button w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-70">{isSubmitting ? "Creating account..." : "Create Account"}</button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
                    Already have an account? <button type="button" onClick={onLogin} className="font-semibold text-(--magenta-600) hover:underline">Login</button>
                </p>
            </div>
        </div>
    );
}
