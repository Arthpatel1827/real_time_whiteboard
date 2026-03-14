export function getToken() {
    return localStorage.getItem("whiteboard_token");
}

export function setToken(token) {
    localStorage.setItem("whiteboard_token", token);
}

export function logout() {
    localStorage.removeItem("whiteboard_token");
    localStorage.removeItem("whiteboard_user");
    window.location.href = "/";
}