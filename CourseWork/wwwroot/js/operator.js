import {authFetch} from "./auth.js";

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
                case "dashboard":
                    loadDashboard();
                    break;
                case "patients":
                    loadPatients();
                    break;
                case "specialists":
                    loadSpecialists();
                    break;
                case "visits":
                    loadVisits();
                    break;
                case "payments":
                    loadPayments();
                    break;
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
    <table class="table table-hover table-bordered">
        <thead>
            <tr>
                <th>ID</th>
                <th>UserName</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Medical Record #</th>
                <th>Date of Birth</th>
                <th>Created At</th>
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
            <td>${p.medicalRecordNumber ?? "-"}</td>
            <td>${p.dateOfBirth ?? "-"}</td>
            <td>${p.createdAt ?? "-"}</td>
            <td>
                <button class="btn btn-sm btn-warning btn-edit-patient" data-id="${p.id}">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete-patient" data-id="${p.id}">Delete</button>
            </td>
        </tr>
    `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        bindEditPatientButtons();
        bindDeletePatientButtons();
    }

// ====================== CREATE PATIENT ======================

    document.getElementById("formAddPatient").addEventListener("submit", async (e) => {
        e.preventDefault();

        const form = e.target;
        const dto = {
            userName: form.userName.value,
            fullName: form.fullName.value,
            password: form.password.value,
            phone: form.phone.value || null,
            address: form.address.value || null,
            medicalRecordNumber: Number(form.medicalRecordNumber.value),
            dateOfBirth: form.dateOfBirth.value || null
        };

        const res = await authFetch("/operator/patients", {
            method: "POST",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalAddPatient")).hide();
            loadPatients();
        } else {
            alert("Failed to create patient");
        }
    });

// ====================== EDIT PATIENT ======================

    function bindEditPatientButtons() {
        document.querySelectorAll(".btn-edit-patient").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                const patient = patients.find(p => p.id === id);

                const modal = document.getElementById("modalEditPatient");
                modal.querySelector("[name=id]").value = patient.id;
                modal.querySelector("[name=fullName]").value = patient.fullName;
                modal.querySelector("[name=phone]").value = patient.phone || "";
                modal.querySelector("[name=address]").value = patient.address || "";
                modal.querySelector("[name=medicalRecordNumber]").value = patient.medicalRecordNumber ?? "";
                modal.querySelector("[name=dateOfBirth]").value = patient.dateOfBirth ? patient.dateOfBirth.substring(0,10) : "";

                new bootstrap.Modal(modal).show();
            });
        });
    }

    document.getElementById("formEditPatient").addEventListener("submit", async (e) => {
        e.preventDefault();

        const form = e.target;
        const id = form.id.value;

        const dto = {
            fullName: form.fullName.value,
            phone: form.phone.value || null,
            address: form.address.value || null,
            medicalRecordNumber: form.medicalRecordNumber.value ? Number(form.medicalRecordNumber.value) : null,
            dateOfBirth: form.dateOfBirth.value || null
        };

        const res = await authFetch(`/operator/patients/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalEditPatient")).hide();
            loadPatients();
        } else {
            alert("Update failed");
        }
    });

// ====================== DELETE PATIENT ======================

    let deletePatientId = null;

    function bindDeletePatientButtons() {
        document.querySelectorAll(".btn-delete-patient").forEach(btn => {
            btn.addEventListener("click", () => {
                deletePatientId = btn.dataset.id;
                new bootstrap.Modal(document.getElementById("modalDeletePatient")).show();
            });
        });
    }

    document.getElementById("btnConfirmDeletePatient").addEventListener("click", async () => {
        if (!deletePatientId) return;

        const res = await authFetch(`/operator/patients/${deletePatientId}`, {
            method: "DELETE",
            // Видаляємо Content-Type, щоб ASP.NET не "підозрював" тіло
            headers: {
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalDeletePatient")).hide();
            loadPatients();
        } else {
            const errorText = await res.text();
            alert("Delete failed: " + errorText);
        }
    });


// ====================== INIT ======================
    document.addEventListener("DOMContentLoaded", () => {
        loadPatients();
    });



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
                    <th>Full Name</th>
                    <th>Speciality</th>
                    <th>Date of Birth</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Created At</th>
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
                <td>${s.dateOfBirth ?? "-"}</td>
                <td>${s.phone ?? "-"}</td>
                <td>${s.address ?? "-"}</td>
                <td>${s.createdAt ?? "-"}</td>
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
                const specialist = specialists.find(s => s.id == btn.dataset.id);
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

        const res = await authFetch(`/operator/specialists/${id}`, {method: "DELETE"});
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
                    <th>Patient MRN</th>
                    <th>Specialist ID</th>
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

        visits.forEach(v => {
            html += `
            <tr>
                <td>${v.id}</td>
                <td>${v.patientMedicalRecord}</td>
                <td>${v.specialistId}</td>
                <td>${v.visitDate}</td>
                <td>${v.status}</td>
                <td>${v.isFirstVisit ? "Yes" : "No"}</td>
                <td>${v.anamnesis ?? "-"}</td>
                <td>${v.diagnosis ?? "-"}</td>
                <td>${v.treatment ?? "-"}</td>
                <td>${v.recommendations ?? "-"}</td>
                <td>${v.serviceCost}</td>
                <td>${v.medicationCost}</td>
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
                const visit = visits.find(v => v.id == btn.dataset.id);
                openVisitModal(visit);
            })
        );

        document.querySelectorAll("[data-delete]").forEach(btn =>
            btn.addEventListener("click", () => deleteVisit(btn.dataset.id))
        );
    }


    async function deleteVisit(id) {
        if (!confirm("Delete visit?")) return;

        const res = await authFetch(`/operator/visits/${id}`, {method: "DELETE"});
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
                    <th>Visit ID</th>
                    <th>Patient MRN</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Remaining</th>
                    <th>Issued</th>
                    <th>Due</th>
                    <th>Last Payment</th>
                    <th>Status</th>
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
                <td>${p.patientMedicalRecord}</td>
                <td>${p.totalAmount}</td>
                <td>${p.paidAmount}</td>
                <td>${p.remainingAmount}</td>
                <td>${p.issuedDate}</td>
                <td>${p.dueDate}</td>
                <td>${p.lastPaymentDate ?? "-"}</td>
                <td>${p.status}</td>
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

        const res = await authFetch(`/operator/payments/${id}`, {method: "DELETE"});
        if (res.ok) loadPayments();
    }

});
