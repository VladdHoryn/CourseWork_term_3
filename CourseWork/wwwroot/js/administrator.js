import {authFetch, getToken, getUserRole} from "./auth.js";

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
        window.location.href = "/guest.html";
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
        
        const columns = new Set();
        users.forEach(u => Object.keys(u).forEach(k => columns.add(k)));
        
        columns.delete("passwordHash");

        const colArray = Array.from(columns);

        let html = `
        <button class="btn btn-success mb-3" data-bs-toggle="modal" data-bs-target="#modalAddUser">
            Add User
        </button>

        <table class="table table-hover table-bordered">
            <thead>
                <tr>
    `;

        colArray.forEach(c => {
            html += `<th>${c}</th>`;
        });

        html += `<th>Actions</th></tr></thead><tbody>`;

        users.forEach(user => {
            html += `<tr>`;

            colArray.forEach(c => {
                let val = user[c];

                // Форматування дат
                if (c.toLowerCase().includes("date") && val)
                    val = new Date(val).toISOString().split("T")[0];

                html += `<td>${val ?? "-"}</td>`;
            });

            html += `
            <td>
                <button class="btn btn-sm btn-warning btn-edit-user" data-id="${user.id}">
                    Edit
                </button>
                <button class="btn btn-sm btn-danger btn-delete-user" data-id="${user.id}">
                    Delete
                </button>
            </td>
        </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        bindEditUserButtons();
        bindDeleteUserButtons();
    }

// ---------------- CREATE USER ----------------
    const roleMap = {
        "Patient": 1,
        "Specialist": 2,
        "Operator": 3,
        "Administrator": 4
    };
    
    const roleSelect = document.getElementById("addUserRole");
    const roleFieldsContainer = document.getElementById("roleSpecificFields");

    roleSelect.addEventListener("change", () => {
        const role = roleSelect.value;
        roleFieldsContainer.innerHTML = ""; // очищаємо попередні поля

        if (role === "Patient") {
            roleFieldsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>Medical Record Number</label>
                    <input name="medicalRecordNumber" class="form-control" type="number" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Date of Birth</label>
                    <input name="dateOfBirth" class="form-control" type="date">
                </div>
            </div>
        `;
        } else if (role === "Specialist") {
            roleFieldsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>Speciality</label>
                    <input name="speciality" class="form-control" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Date of Birth</label>
                    <input name="dateOfBirth" class="form-control" type="date">
                </div>
            </div>
        `;
        }
    });

    document.getElementById("formAddUser").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;

        const dto = {
            userName: form.userName.value,
            fullName: form.fullName.value,
            passwordHash: form.password.value,
            userRole: roleMap[form.role.value]  // <-- перетворюємо на число
        };

        if (form.medicalRecordNumber) dto.medicalRecordNumber = parseInt(form.medicalRecordNumber.value);
        if (form.speciality) dto.speciality = form.speciality.value;
        if (form.dateOfBirth) dto.dateOfBirth = form.dateOfBirth.value || null;

        try {
            const res = await authFetch("/administrator/users", {
                method: "POST",
                body: JSON.stringify(dto)
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById("modalAddUser")).hide();
                loadUsers();
            } else {
                const errorText = await res.text();
                alert("Failed to create user: " + errorText);
            }
        } catch (err) {
            console.error(err);
            alert("Помилка при створенні користувача");
        }
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
                form.userName.value = user.userName;

                form.role.value = Object.keys(roleMap).find(k => roleMap[k] === user.userRole);

                const roleFieldsContainer = document.getElementById("editRoleSpecificFields");
                roleFieldsContainer.innerHTML = "";

                // Додаємо fullName тільки для Patient та Specialist
                if (user.userRole === 1 || user.userRole === 2) {
                    roleFieldsContainer.innerHTML += `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label>Full Name</label>
                            <input name="fullName" class="form-control" value="${user.fullName ?? ''}" required>
                        </div>
                    </div>
                `;
                }

                if (user.userRole === 1) { // Patient
                    roleFieldsContainer.innerHTML += `
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label>Medical Record Number</label>
                            <input name="medicalRecordNumber" class="form-control" type="number" value="${user.medicalRecordNumber ?? ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label>Date of Birth</label>
                            <input name="dateOfBirth" class="form-control" type="date" value="${user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''}">
                        </div>
                    </div>
                `;
                } else if (user.userRole === 2) { // Specialist
                    roleFieldsContainer.innerHTML += `
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label>Speciality</label>
                            <input name="speciality" class="form-control" value="${user.speciality ?? ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label>Date of Birth</label>
                            <input name="dateOfBirth" class="form-control" type="date" value="${user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : ''}">
                        </div>
                    </div>
                `;
                }

                const modal = new bootstrap.Modal(document.getElementById("modalEditUser"));
                modal.show();
            });
        });
    }
    
    document.getElementById("formEditUser").role.addEventListener("change", (e) => {
        const role = e.target.value;
        const roleFieldsContainer = document.getElementById("editRoleSpecificFields");
        roleFieldsContainer.innerHTML = "";

        if (role === "Patient" || role === "Specialist") {
            roleFieldsContainer.innerHTML += `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label>Full Name</label>
                    <input name="fullName" class="form-control" required>
                </div>
            </div>
        `;
        }

        if (role === "Patient") {
            roleFieldsContainer.innerHTML += `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>Medical Record Number</label>
                    <input name="medicalRecordNumber" class="form-control" type="number">
                </div>
                <div class="col-md-6 mb-3">
                    <label>Date of Birth</label>
                    <input name="dateOfBirth" class="form-control" type="date">
                </div>
            </div>
        `;
        } else if (role === "Specialist") {
            roleFieldsContainer.innerHTML += `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>Speciality</label>
                    <input name="speciality" class="form-control">
                </div>
                <div class="col-md-6 mb-3">
                    <label>Date of Birth</label>
                    <input name="dateOfBirth" class="form-control" type="date">
                </div>
            </div>
        `;
        }
    });

    document.getElementById("formEditUser").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const user = users.find(u => u.id == form.id.value);
        if (!user) return alert("User not found");

        const dto = {
            userName: form.userName.value,
            fullName: form.fullName ? form.fullName.value : null,
            userRole: roleMap[form.role.value],
            PasswordHash: user.passwordHash // додаємо існуючий хеш пароля
        };

        if (form.medicalRecordNumber) dto.medicalRecordNumber = parseInt(form.medicalRecordNumber.value);
        if (form.speciality) dto.speciality = form.speciality.value;
        if (form.dateOfBirth) dto.dateOfBirth = form.dateOfBirth.value || null;

        const res = await authFetch(`/administrator/users/${form.id.value}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalEditUser")).hide();
            loadUsers();
        } else {
            const text = await res.text();
            alert("Failed to update user: " + text);
        }
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

// =====================================================================
//                               VISITS (ADMIN)
// =====================================================================

let adminVisits = [];
let adminPatients = [];
let adminSpecialists = [];
let deleteVisitId = null;

// -------------------- Load Visits --------------------
async function loadVisits() {
    try {
        const res = await authFetch("/administrator/visits");
        adminVisits = res.ok ? await res.json() : [];
        renderVisitsTable();
    } catch (err) {
        console.error(err);
        alert("Помилка при завантаженні візитів.");
    }
}

// -------------------- Render Table --------------------
function renderVisitsTable() {
    const container = document.getElementById("visits-table-container");

    if (!adminVisits.length) {
        container.innerHTML = "<p class='text-muted'>No visits found</p>";
        return;
    }

    let html = `
    <table class="table table-bordered table-hover">
        <thead>
            <tr>
                <th>ID</th>
                <th>Patient MRN</th>
                <th>Specialist</th>
                <th>Date</th>
                <th>Status</th>
                <th>First Visit</th>
                <th>Anamnesis</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Recommendations</th>
                <th>Service Cost</th>
                <th>Medication Cost</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;

    adminVisits.forEach(v => {
        html += `
            <tr>
                <td>${v.id}</td>
                <td>${v.patientMedicalRecord}</td>
                <td>${v.specialistId}</td>
                <td>${v.visitDate ?? "-"}</td>
                <td>${v.status}</td>
                <td>${v.isFirstVisit ? "Yes" : "No"}</td>
                <td>${v.anamnesis ?? "-"}</td>
                <td>${v.diagnosis ?? "-"}</td>
                <td>${v.treatment ?? "-"}</td>
                <td>${v.recommendations ?? "-"}</td>
                <td>${v.serviceCost}</td>
                <td>${v.medicationCost}</td>
                <td>
                    <button class="btn btn-warning btn-sm" data-edit="${v.id}">Edit</button>
                    <button class="btn btn-danger btn-sm" data-delete="${v.id}">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;

    // Edit buttons
    document.querySelectorAll("[data-edit]").forEach(btn =>
        btn.addEventListener("click", () => {
            const visit = adminVisits.find(v => v.id == btn.dataset.edit);
            openVisitModal(visit);
        })
    );

    // Delete buttons
    document.querySelectorAll("[data-delete]").forEach(btn =>
        btn.addEventListener("click", () => {
            deleteVisitId = btn.dataset.delete;
            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("modalDeleteVisit")
            ).show();
        })
    );
}

// -------------------- Load Patients + Specialists --------------------
async function loadPatientsAndSpecialists() {
    const [resPatients, resSpecialists] = await Promise.all([
        authFetch("/administrator/patients"),
        authFetch("/administrator/specialists")
    ]);

    adminPatients = resPatients.ok ? await resPatients.json() : [];
    adminSpecialists = resSpecialists.ok ? await resSpecialists.json() : [];
}

// ======================== OPEN EDIT VISIT MODAL ========================
async function openVisitModal(visit = null) {
    await loadPatientsAndSpecialists();

    const modalId = visit ? "modalEditVisit" : "modalAddVisit";
    const modalElement = document.getElementById(modalId);
    const form = modalElement.querySelector("form");

    if (!form) {
        console.error("Form not found inside modal:", modalId);
        return;
    }

    const patientSelect = form.querySelector("[name='patientId']");
    const specialistSelect = form.querySelector("[name='specialistId']");

    // CREATE: populate dropdowns
    if (!visit) {
        if (patientSelect) {
            patientSelect.innerHTML = adminPatients
                .map(p => `<option value="${p.id}">${p.fullName} (MRN: ${p.medicalRecordNumber})</option>`)
                .join("");
        }

        if (specialistSelect) {
            specialistSelect.innerHTML = adminSpecialists
                .map(s => `<option value="${s.id}">${s.fullName} (${s.speciality})</option>`)
                .join("");
        }

        form.reset();
    }

    // EDIT MODE – fill fields
    if (visit) {
        form.querySelector("[name='id']").value = visit.id;
        form.querySelector("[name='anamnesis']").value = visit.anamnesis ?? "";
        form.querySelector("[name='diagnosis']").value = visit.diagnosis ?? "";
        form.querySelector("[name='treatment']").value = visit.treatment ?? "";
        form.querySelector("[name='recommendations']").value = visit.recommendations ?? "";
        form.querySelector("[name='serviceCost']").value = visit.serviceCost ?? 0;
        form.querySelector("[name='medicationCost']").value = visit.medicationCost ?? 0;

        if (form.querySelector("[name='status']")) {
            form.querySelector("[name='status']").value = visit.status ?? "Scheduled";
        }
    }

    // Remove default form submission behavior
    form.onsubmit = saveEditedVisit;

    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.show();
}


// ======================== SAVE EDITED VISIT (PUT) ========================
async function saveEditedVisit(event) {
    event.preventDefault();

    const form = event.target;
    const id = form.querySelector("[name='id']").value;

    const dto = {
        anamnesis: form.anamnesis.value,
        diagnosis: form.diagnosis.value,
        treatment: form.treatment.value,
        recommendations: form.recommendations.value,
        serviceCost: Number(form.serviceCost.value),
        medicationCost: Number(form.medicationCost.value),
        status: form.status.value
    };

    try {
        const res = await authFetch(`/administrator/visits/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });

        if (!res.ok) {
            const txt = await res.text();
            alert("Error: " + txt);
            return;
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById("modalEditVisit"));
        modal.hide();

        await loadVisits();
    } catch (e) {
        console.error("Update failed:", e);
        alert("Failed to update visit");
    }
}

// ======================== DELETE VISIT ========================
document.getElementById("btnConfirmDeleteVisit")?.addEventListener("click", async () => {
    if (!deleteVisitId) return;

    try {
        const res = await authFetch(`/administrator/visits/${deleteVisitId}`, {
            method: "DELETE"
        });

        if (res.ok) {
            const modal = bootstrap.Modal.getInstance(document.getElementById("modalDeleteVisit"));
            modal.hide();

            await loadVisits();
        } else {
            const txt = await res.text();
        }
    } catch (err) {
        console.error("Delete error:", err);
    }
});

