import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "ticketmanager-theme";

const ThemeContext = createContext(null);

function readStoredTheme() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "LIGHT" || stored === "DARK") {
            return stored;
        }
    } catch {
        // ignore storage errors
    }
    return "LIGHT";
}

function applyThemeClass(theme) {
    const root = document.documentElement;
    if (theme === "DARK") {
        root.classList.add("dark");
    } else {
        root.classList.remove("dark");
    }
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(readStoredTheme);

    useEffect(() => {
        applyThemeClass(theme);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // ignore storage errors
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme((current) => (current === "LIGHT" ? "DARK" : "LIGHT"));
    };

    const value = useMemo(
        () => ({
            theme,
            isDark: theme === "DARK",
            setTheme,
            toggleTheme,
        }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return context;
}
