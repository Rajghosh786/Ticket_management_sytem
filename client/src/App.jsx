import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Login from "./pages/Login.jsx";
import AuthenticatedHome from "./pages/AuthenticatedHome.jsx";

function AppContent() {
    const { loading, isAuthenticated, authError } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
                <p className="text-sm text-slate-600 dark:text-slate-300">Loading session...</p>
            </div>
        );
    }

    if (authError && !isAuthenticated) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4 dark:bg-slate-950">
                <p className="text-sm text-red-600 dark:text-red-400">{authError}</p>
                <Login />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login />;
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
