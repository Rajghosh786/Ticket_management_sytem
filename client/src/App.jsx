import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AuthenticatedHome from "./pages/AuthenticatedHome.jsx";
import { useState } from "react";

function AppContent() {
    const { loading, isAuthenticated, authError } = useAuth();
    const [showRegister, setShowRegister] = useState(false);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
                <p className="text-sm text-slate-600 dark:text-slate-300">Loading session...</p>
            </div>
        );
    }

    if (authError && !isAuthenticated) {
        if (showRegister) {
            return <Register onLogin={() => setShowRegister(false)} />;
        }
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 dark:bg-slate-950">
                <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                <Login onRegister={() => setShowRegister(true)} />
            </div>
        );
    }

    if (!isAuthenticated) {
        return showRegister ? (
            <Register onLogin={() => setShowRegister(false)} />
        ) : (
            <Login onRegister={() => setShowRegister(true)} />
        );
    }

    return <AuthenticatedHome />;
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
