import React from "react";
import { logout } from "../../auth/auth";

export default function LogoutButton() {
    return (
        <button
            onClick={logout}
            style={{
                padding: "6px 12px",
                background: "#e53935",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginLeft: "10px"
            }}
        >
            Logout
        </button>
    );
}