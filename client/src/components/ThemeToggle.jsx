import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeToggle({ className = "" }) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-black shadow-sm transition hover:bg-white/15 ${className}`}
            aria-label={`Switch to ${theme === "LIGHT" ? "dark" : "light"} mode`}
        >
            <span aria-hidden="true">{theme === "LIGHT" ? "🌙" : "☀️"}</span>
            <span>{theme === "LIGHT" ? "Dark" : "Light"}</span>
        </button>
    );
}
