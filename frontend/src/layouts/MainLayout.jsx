import React from "react";
import { Outlet } from "react-router-dom";
import ConnectionStatus from "../components/system/ConnectionStatus";
import ThemeToggle from "../components/system/ThemeToggle";
import LogoutButton from "../components/system/LogoutButton";

export default function MainLayout() {
    return (
        <div className="min-h-screen bg-white text-black dark:bg-[#0b0b12] dark:text-white">

            {/* NAVBAR */}
            <header className="border-b border-black/10 bg-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

                    {/* LEFT */}
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold">
                            W
                        </div>
                        <h1 className="text-xl font-semibold">Whiteboard</h1>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-4">
                        <ConnectionStatus />
                        <ThemeToggle />
                        <LogoutButton />
                    </div>

                </div>
            </header>

            {/* PAGE CONTENT */}
            <main>
                <Outlet />
            </main>
        </div>
    );
}