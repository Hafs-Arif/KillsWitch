// Cookie-based sessions handled server-side. Keep no-op helpers to avoid breaking imports.
export const getToken = () => null;

export const decodeJwt = () => null;

export const getCurrentUser = () => ({ isLoggedIn: false, role: "", email: "" });
