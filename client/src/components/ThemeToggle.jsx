import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${className}`}
            aria-label={`Switch to ${theme === "LIGHT" ? "dark" : "light"} mode`}
        >
            <span aria-hidden="true">{theme === "LIGHT" ? "🌙" : "☀️"}</span>
            <span>{theme === "LIGHT" ? "Dark" : "Light"}</span>
        </button>
    );
}
