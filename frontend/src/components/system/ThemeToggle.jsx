import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [theme, setTheme] = useState("dark");

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme") || "dark";
        setTheme(savedTheme);
        document.body.className = savedTheme;
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.body.className = newTheme;
    };

    return (
        <button onClick={toggleTheme} style={{ marginLeft: "10px" }}>
            {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
    );
}