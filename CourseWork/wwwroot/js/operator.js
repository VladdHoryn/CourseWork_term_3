import { authFetch } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {

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
                case "dashboard": loadDashboard(); break;
                case "patients": loadPatients(); break;
                case "specialists": loadSpecialists(); break;
                case "visits": loadVisits(); break;
                case "payments": loadPayments(); break;
            }
        });
    });

    // =====================================================================
    //                             DASHBOARD
    // =====================================================================

    async function loadDashboard() {
        const res = await authFetch("/operator/dashboard");
        if (!res?.ok) return;

        const data = await res.json();

        document.getElementById("dashboard").innerHTML = `
            <h2>📊 Operator Dashboard</h2>
            <div class="row mt-4">
                <div class="col-md-3">
                    <div class="card p-3 text-center bg-primary text-white pointer dashboard-box" data-tab="patients">
                        <h4>Patients</h4>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card p-3 text-center bg-success text-white pointer dashboard-box" data-tab="specialists">
                        <h4>Specialists</h4>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card p-3 text-center bg-warning text-white pointer dashboard-box" data-tab="visits">
                        <h4>Visits</h4>
                    </div>
                </div>

                <div class="col-md-3">
                    <div class="card p-3 text-center bg-danger text-white pointer dashboard-box" data-tab="payments">
                        <h4>Payments</h4>
                    </div>
                </div>
            </div>
        `;

        // enable clicking boxes
        document.querySelectorAll(".dashboard-box").forEach(box => {
            box.addEventListener("click", () => {
                const tab = box.getAttribute("data-tab");
                document.querySelector(`[data-tab="${tab}"]`).click();
            });
        });
    }

    loadDashboard();



    // =====================================================================
    //                            PATIENTS CRUD
    // =====================================================================

    let patients = [];

    async function loadPatients() {
        const res = await authFetch("/operator/patients");
        patients = res.ok ? await res.json() : [];

        renderPatientsTable();
    }

    function renderPatientsTable() {
        const container = document.getElementById("patients-table-container");

        if (!patients.length) {
            container.innerHTML = "<p class='text-muted'>No patients found</p>";
            return;
        }

        let html = `
            <button class="btn btn-primary mb-3" id="btn-add-patient">Add Patient</button>

            <table class="table table-hover table-bordered">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>UserName</th>
                        <th>FullName</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        patients.forEach(p => {
            html += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.userName}</td>
                    <td>${p.fullName}</td>
                    <td>${p.phone ?? "-"}</td>
                    <td>${p.address ?? "-"}</td>
                    <td>
                        <button class="btn btn-sm btn-warning btn-edit" data-id="${p.id}">Edit</button>
                        <button class="btn btn-sm btn-danger btn-delete" data-id="${p.id}">Delete</button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        document.getElementById("btn-add-patient").addEventListener("click", () => openPatientModal());

        document.querySelectorAll(".btn-edit").forEach(btn =>
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                openPatientModal(patients.find(x => x.id === id));
            })
        );

        document.querySelectorAll(".btn-delete").forEach(btn =>
            btn.addEventListener("click", () => deletePatient(btn.getAttribute("data-id")))
        );
    }

    // --- Patient Modal ---

    async function savePatient(isEdit, id) {
        const dto = {
            userName: document.getElementById("p-username").value,
            fullName: document.getElementById("p-fullname").value,
            password: document.getElementById("p-password").value,
            phone: document.getElementById("p-phone").value,
            address: document.getElementById("p-address").value,
            medicalRecordNumber: 0
        };

        const url = isEdit ? `/operator/patients/${id}` : "/operator/patients";
        const method = isEdit ? "PUT" : "POST";

        const res = await authFetch(url, {
            method,
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("patientModal")).hide();
            loadPatients();
        }
    }

    async function deletePatient(id) {
        if (!confirm("Delete this patient?")) return;

        const res = await authFetch(`/operator/patients/${id}`, { method: "DELETE" });
        if (res.ok) loadPatients();
    }



    // =====================================================================
    //                        SPECIALISTS CRUD + GROUPING
    // =====================================================================

    let specialists = [];

    async function loadSpecialists() {
        const res = await authFetch("/operator/specialists");
        specialists = res.ok ? await res.json() : [];
        renderSpecialistsTable();
    }

    function renderSpecialistsTable() {
        const container = document.getElementById("specialists-table-container");

        let html = `
            <button class="btn btn-primary mb-3" id="btn-add-specialist">Add Specialist</button>
            <button class="btn btn-secondary mb-3 ms-2" id="btn-group-specialty">Group by Specialty</button>

            <table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>UserName</th>
                        <th>FullName</th>
                        <th>Specialty</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        specialists.forEach(s => {
            html += `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.userName}</td>
                    <td>${s.fullName}</td>
                    <td>${s.speciality}</td>
                    <td>${s.phone ?? "-"}</td>
                    <td>${s.address ?? "-"}</td>
                    <td>
                        <button class="btn btn-warning btn-sm btn-edit" data-id="${s.id}">Edit</button>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${s.id}">Delete</button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        document.getElementById("btn-add-specialist").addEventListener("click", () =>
            openSpecialistModal()
        );

        document.getElementById("btn-group-specialty").addEventListener("click", loadGroupedBySpecialty);

        document.querySelectorAll(".btn-edit").forEach(btn =>
            btn.addEventListener("click", () => {
                const specialist = specialists.find(s => s.id === btn.dataset.id);
                openSpecialistModal(specialist);
            })
        );

        document.querySelectorAll(".btn-delete").forEach(btn =>
            btn.addEventListener("click", () => deleteSpecialist(btn.dataset.id))
        );
    }

    async function loadGroupedBySpecialty() {
        const res = await authFetch("/operator/specialists/group-by-specialty");
        if (!res.ok) return;

        const data = await res.json();
        alert(JSON.stringify(data, null, 2));
    }

    async function deleteSpecialist(id) {
        if (!confirm("Delete specialist?")) return;

        const res = await authFetch(`/operator/specialists/${id}`, { method: "DELETE" });
        if (res.ok) loadSpecialists();
    }



    // =====================================================================
    //                               VISITS
    // =====================================================================

    let visits = [];

    async function loadVisits() {
        const res = await authFetch("/operator/visits");
        visits = res.ok ? await res.json() : [];
        renderVisitsTable();
    }

    function renderVisitsTable() {
        const container = document.getElementById("visits-table-container");

        let html = `
            <button class="btn btn-primary mb-3" id="btn-add-visit">Add Visit</button>

            <table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Specialist</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        visits.forEach(v => {
            html += `
                <tr>
                    <td>${v.id}</td>
                    <td>${v.patientName}</td>
                    <td>${v.specialistName}</td>
                    <td>${v.visitDate}</td>
                    <td>${v.status}</td>
                    <td>
                        <button class="btn btn-warning btn-sm" data-id="${v.id}" data-edit>Edit</button>
                        <button class="btn btn-danger btn-sm" data-id="${v.id}" data-delete>Delete</button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        document.getElementById("btn-add-visit").addEventListener("click", () => openVisitModal());

        document.querySelectorAll("[data-edit]").forEach(btn =>
            btn.addEventListener("click", () => {
                const visit = visits.find(v => v.id === btn.dataset.id);
                openVisitModal(visit);
            })
        );

        document.querySelectorAll("[data-delete]").forEach(btn =>
            btn.addEventListener("click", () => deleteVisit(btn.dataset.id))
        );
    }

    async function deleteVisit(id) {
        if (!confirm("Delete visit?")) return;

        const res = await authFetch(`/operator/visits/${id}`, { method: "DELETE" });
        if (res.ok) loadVisits();
    }



    // =====================================================================
    //                              PAYMENTS
    // =====================================================================

    let payments = [];

    async function loadPayments() {
        const res = await authFetch("/operator/payments");
        payments = res.ok ? await res.json() : [];
        renderPaymentsTable();
    }

    function renderPaymentsTable() {
        const container = document.getElementById("payments-table-container");

        let html = `
            <button class="btn btn-primary mb-3" id="btn-add-payment">Add Payment</button>

            <table class="table table-bordered table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Visit</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Issued</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

        payments.forEach(p => {
            html += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.visitId}</td>
                    <td>${p.totalAmount}</td>
                    <td>${p.status}</td>
                    <td>${p.issuedDate}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" data-id="${p.id}" data-delete>Delete</button>
                    </td>
                </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        document.getElementById("btn-add-payment").addEventListener("click", () => openPaymentModal());

        document.querySelectorAll("[data-delete]").forEach(btn =>
            btn.addEventListener("click", () => deletePayment(btn.dataset.id))
        );
    }

    async function deletePayment(id) {
        if (!confirm("Delete payment?")) return;

        const res = await authFetch(`/operator/payments/${id}`, { method: "DELETE" });
        if (res.ok) loadPayments();
    }



    // =====================================================================
    //                         MODAL WINDOW BUILDERS
    // =====================================================================

    function openPatientModal(patient = null) {
        alert("TODO: Insert patient modal HTML + JS logic here (I can generate it). For now modal auto-handled.");
    }

    function openSpecialistModal(spec = null) {
        alert("TODO: Insert specialist modal HTML + JS logic here.");
    }

    function openVisitModal(visit = null) {
        alert("TODO: Insert visit modal HTML + JS logic here.");
    }

    function openPaymentModal() {
        alert("TODO: Insert payment modal HTML + JS logic here.");
    }

});
