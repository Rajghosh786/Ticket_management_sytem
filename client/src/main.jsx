import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const storedTheme = localStorage.getItem("ticketmanager-theme");
if (storedTheme === "DARK") {
    document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")).render(<App />);
