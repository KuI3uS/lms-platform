export function getWorkspaceTheme(pathname = "") {
    const path = String(pathname).replace(/\/+$/, "");
    return ["/dashboard", "/courses", "/admin/courses"].includes(path)
        || /^\/modules\/[^/]+$/.test(path) ? "light" : "dark";
}

// A real background color is required: gradients must never be used as a
// background-color value or let the shell show through a transparent main.
export const WORKSPACE_BACKGROUNDS = { light: "#f6f8fa", dark: "#05070d" };
