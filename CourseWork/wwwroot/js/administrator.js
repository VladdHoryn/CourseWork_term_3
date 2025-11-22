import { authFetch, getToken, getUserRole } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {

    // ------------------------
    // 1) AUTHORIZATION CHECK
    // ------------------------
    const token = getToken();
    const role = getUserRole();

    if (!token) {
        alert("Ви не авторизовані!");
        window.location.href = "/login.html";
        return;
    }

    if (role !== "Administrator") {
        alert("Доступ заборонено! Тільки адміністратор.");
        window.location.href = "/unauthorized.html";
        return;
    }

    // Відображаємо ім'я адміністратора
    const payload = JSON.parse(atob(token.split(".")[1]));
    const fullName = payload["name"] || "Administrator";
    document.getElementById("admin-name").innerText = `👤 ${fullName}`;

    // =====================================================================
    //                         TAB SWITCHING
    // =====================================================================
    document.querySelectorAll("[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-tab");

            document.querySelectorAll(".tab").forEach(t => t.classList.add("d-none"));
            document.getElementById(tab).classList.remove("d-none");

            document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            switch (tab) {
                case "dashboard":
                    loadDashboard();
                    break;
                case "users":
                    loadUsers();
                    break;
                case "visits":
                    loadVisits();
                    break;
                case "payments":
                    loadPayments();
                    break;
                case "requests":
                    loadRequests();
                    break;
                case "statistics":
                    loadStatistics();
                    break;
                case "sql":
                    // SQL tab is disabled
                    break;
            }
        });
    });

    // Активуємо дефолтну вкладку
    document.querySelector("[data-tab].active")?.click();

    // =====================================================================
    // 2) LOGOUT
    // =====================================================================
    document.getElementById("btn-logout").addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
    });

    // =====================================================================
    // 3) FUNCTIONS TO LOAD DATA
    // =====================================================================

    async function loadDashboard() {
        try {
            const res = await authFetch("/administrator/dashboard");
            if (!res.ok) throw new Error("Failed to load dashboard");
            const data = await res.json();

            document.getElementById("quick-users").innerText = data.users;
            document.getElementById("quick-visits").innerText = data.visits;
            document.getElementById("quick-payments").innerText = data.payments;
            document.getElementById("quick-requests").innerText = data.requests;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні Dashboard.");
        }
    }

    async function loadUsers() {
        try {
            const roleFilter = document.getElementById("filter-role")?.value || "";
            const res = await authFetch("/administrator/users");
            if (!res.ok) throw new Error("Failed to load users");
            let users = await res.json();

            if (roleFilter) users = users.filter(u => u.role === roleFilter);

            const container = document.getElementById("users-table-container");
            let html = `<table class="table table-bordered table-striped">
                <thead>
                    <tr><th>ID</th><th>UserName</th><th>Full Name</th><th>Role</th></tr>
                </thead><tbody>`;

            users.forEach(u => {
                html += `<tr>
                    <td>${u.id}</td>
                    <td>${u.userName}</td>
                    <td>${u.fullName}</td>
                    <td>${u.role}</td>
                </tr>`;
            });

            html += `</tbody></table>`;
            container.innerHTML = html;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні користувачів.");
        }
    }

    async function loadVisits() {
        try {
            const res = await authFetch("/administrator/visits");
            if (!res.ok) throw new Error("Failed to load visits");
            const visits = await res.json();

            const container = document.getElementById("visits-table-container");
            let html = `<table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th>ID</th><th>Patient</th><th>Specialist</th>
                        <th>Date</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>`;

            visits.forEach(v => {
                html += `<tr>
                    <td>${v.id}</td>
                    <td>${v.patientMedicalRecord}</td>
                    <td>${v.specialistId}</td>
                    <td>${v.visitDate}</td>
                    <td>${v.status}</td>
                </tr>`;
            });

            html += `</tbody></table>`;
            container.innerHTML = html;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні візитів.");
        }
    }

    async function loadPayments() {
        try {
            const res = await authFetch("/administrator/payments");
            if (!res.ok) throw new Error("Failed to load payments");
            const payments = await res.json();

            const container = document.getElementById("payments-table-container");
            let html = `<table class="table table-bordered table-striped">
                <thead>
                    <tr>
                        <th>ID</th><th>Visit</th><th>Patient</th>
                        <th>Total</th><th>Paid</th><th>Remaining</th>
                    </tr>
                </thead>
                <tbody>`;

            payments.forEach(p => {
                html += `<tr>
                    <td>${p.id}</td>
                    <td>${p.visitId}</td>
                    <td>${p.patientMedicalRecord}</td>
                    <td>${p.totalAmount}</td>
                    <td>${p.paidAmount}</td>
                    <td>${p.remainingAmount}</td>
                </tr>`;
            });

            html += `</tbody></table>`;
            container.innerHTML = html;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні платежів.");
        }
    }

    async function loadRequests() {
        try {
            const res = await authFetch("/administrator/requests");
            if (!res.ok) throw new Error("Failed to load requests");
            const requests = await res.json();

            const container = document.getElementById("requests-table-container");
            let html = `<table class="table table-bordered">
                <thead><tr><th>ID</th><th>User</th><th>Status</th></tr></thead>
                <tbody>`;

            requests.forEach(r => {
                html += `<tr>
                    <td>${r.id}</td>
                    <td>${r.userName}</td>
                    <td>${r.status}</td>
                </tr>`;
            });

            html += `</tbody></table>`;
            container.innerHTML = html;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні запитів.");
        }
    }

    async function loadStatistics() {
        try {
            const res = await authFetch("/administrator/statistics");
            if (!res.ok) throw new Error("Failed to load statistics");
            const stats = await res.json();

            document.getElementById("statistics-container").innerHTML = `
                <div class="alert alert-info">
                    Total revenue: ${stats.totalRevenue}<br>
                    Visits this month: ${stats.visitsThisMonth}<br>
                    Active users: ${stats.activeUsers}
                </div>
            `;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні статистики.");
        }
    }

    // -------------------------
    // 4) FILTER CHANGE
    // -------------------------
    document.getElementById("filter-role")?.addEventListener("change", loadUsers);

    // =====================================================================
//                            USERS CRUD
// =====================================================================

    let users = [];

    async function loadUsers() {
        try {
            const res = await authFetch("/administrator/users");
            users = res.ok ? await res.json() : [];
            renderUsersTable();
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні користувачів.");
        }
    }

    function renderUsersTable() {
        const container = document.getElementById("users-table-container");

        if (!users.length) {
            container.innerHTML = "<p class='text-muted'>No users found</p>";
            return;
        }

        let html = `
        <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#modalAddUser">Add User</button>
        <table class="table table-hover table-bordered">
        <thead>
            <tr><th>ID</th><th>Username</th><th>Full Name</th><th>Role</th><th>Actions</th></tr>
        </thead><tbody>`;

        users.forEach(u => {
            html += `<tr>
            <td>${u.id}</td>
            <td>${u.userName}</td>
            <td>${u.fullName}</td>
            <td>${u.role}</td>
            <td>
                <button class="btn btn-sm btn-warning btn-edit-user" data-id="${u.id}">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete-user" data-id="${u.id}">Delete</button>
            </td>
        </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        bindEditUserButtons();
        bindDeleteUserButtons();
    }

// ---------------- CREATE USER ----------------
    document.getElementById("formAddUser").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const dto = {
            userName: form.userName.value,
            fullName: form.fullName.value,
            password: form.password.value,
            role: form.role.value
        };

        const res = await authFetch("/administrator/users", {
            method: "POST",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalAddUser")).hide();
            loadUsers();
        } else alert("Failed to create user");
    });

// ---------------- EDIT USER ----------------
    function bindEditUserButtons() {
        document.querySelectorAll(".btn-edit-user").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const user = users.find(u => u.id == id);
                if (!user) return;

                const form = document.getElementById("formEditUser");
                form.id.value = user.id;
                form.fullName.value = user.fullName;
                form.role.value = user.role;

                const modal = new bootstrap.Modal(document.getElementById("modalEditUser"));
                modal.show();
            });
        });
    }

    document.getElementById("formEditUser").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const dto = {
            fullName: form.fullName.value,
            role: form.role.value
        };

        const res = await authFetch(`/administrator/users/${form.id.value}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalEditUser")).hide();
            loadUsers();
        } else alert("Failed to update user");
    });

// ---------------- DELETE USER ----------------
    let deleteUserId = null;
    function bindDeleteUserButtons() {
        document.querySelectorAll(".btn-delete-user").forEach(btn => {
            btn.addEventListener("click", () => {
                deleteUserId = btn.dataset.id;
                const modal = new bootstrap.Modal(document.getElementById("modalConfirmUser"));
                modal.show();
            });
        });
    }

    document.getElementById("confirm-yes-user").addEventListener("click", async () => {
        if (!deleteUserId) return;

        const res = await authFetch(`/administrator/users/${deleteUserId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalConfirmUser")).hide();
            loadUsers();
        } else alert("Failed to delete user");
    });
});
