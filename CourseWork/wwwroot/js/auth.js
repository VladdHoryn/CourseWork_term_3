export function getToken() {
    return localStorage.getItem("token");
}

export function getUserRole() {
    const token = getToken();
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    } catch (e) {
        return null;
    }
}

export async function authFetch(url, options = {}) {
    const token = getToken();

    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    });
}
