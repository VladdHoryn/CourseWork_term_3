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

// ====================== LOAD & RENDER ======================

    async function loadSpecialists() {
        const res = await authFetch("/operator/specialists");
        specialists = res.ok ? await res.json() : [];
        renderSpecialistsTable();
    }

    function renderSpecialistsTable() {
        const container = document.getElementById("specialists-table-container");

        if (!specialists.length) {
            container.innerHTML = "<p class='text-muted'>No specialists found</p>";
            return;
        }

        // Кнопка Group by Specialty над таблицею
        let html = `
        <button class="btn btn-secondary mb-3" id="btn-group-specialty">Group by Specialty</button>

        <table class="table table-bordered table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>UserName</th>
                    <th>Full Name</th>
                    <th>Specialty</th>
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

        // Прив'язка кнопки Group by Specialty
        document.getElementById("btn-group-specialty").addEventListener("click", loadGroupedBySpecialty);

        // Edit & Delete кнопки
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

// ====================== MODAL HANDLING ======================

    function openSpecialistModal(specialist = null) {
        const modalEl = document.getElementById(specialist ? "modalEditSpecialist" : "modalAddSpecialist");
        const form = modalEl.querySelector("form");

        if (specialist) {
            form.id.value = specialist.id;
            form.fullName.value = specialist.fullName;
            form.specialty.value = specialist.speciality ?? "";
            form.phone.value = specialist.phone ?? "";
            form.address.value = specialist.address ?? "";
        } else {
            form.reset();
        }

        new bootstrap.Modal(modalEl).show();
    }

// ====================== CREATE SPECIALIST ======================

    document.getElementById("formAddSpecialist").addEventListener("submit", async e => {
        e.preventDefault();
        const form = e.target;

        const dto = {
            userName: form.userName.value,
            fullName: form.fullName.value,
            password: form.password.value,
            specialty: form.specialty.value,
            phone: form.phone.value || null,
            address: form.address.value || null
        };

        const res = await authFetch("/operator/specialists", {
            method: "POST",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalAddSpecialist")).hide();
            loadSpecialists();
        } else {
            alert("Failed to create specialist");
        }
    });

// ====================== EDIT SPECIALIST ======================

    document.getElementById("formEditSpecialist").addEventListener("submit", async e => {
        e.preventDefault();
        const form = e.target;
        const id = form.id.value;

        const dto = {
            fullName: form.fullName.value,
            specialty: form.specialty.value,
            phone: form.phone.value || null,
            address: form.address.value || null
        };

        const res = await authFetch(`/operator/specialists/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalEditSpecialist")).hide();
            loadSpecialists();
        } else {
            alert("Update failed");
        }
    });

// ====================== DELETE SPECIALIST ======================

    async function deleteSpecialist(id) {
        if (!confirm("Delete specialist?")) return;

        const res = await authFetch(`/operator/specialists/${id}`, { method: "DELETE" });
        if (res.ok) loadSpecialists();
        else {
            const errorText = await res.text();
            alert("Delete failed: " + errorText);
        }
    }

// ====================== GROUP BY SPECIALTY ======================

    async function loadGroupedBySpecialty() {
        const res = await authFetch("/operator/specialists/group-by-specialty");
        if (!res.ok) return;

        const data = await res.json();
        // Відображаємо у зручному alert
        let msg = "Specialists grouped by specialty:\n\n";
        for (const [specialty, count] of Object.entries(data)) {
            msg += `${specialty}: ${count}\n`;
        }
        alert(msg);
    }

// ====================== INIT ======================

    loadSpecialists();



    // =====================================================================
//                               VISITS
// =====================================================================

    let visits = [];
    let deleteVisitId = null;

// -------------------- Load Visits --------------------
    async function loadVisits() {
        const res = await authFetch("/operator/visits");
        visits = res.ok ? await res.json() : [];
        renderVisitsTable();
    }

// -------------------- Render Table --------------------
    function renderVisitsTable() {
        const container = document.getElementById("visits-table-container");

        let html = `
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
                    <button class="btn btn-warning btn-sm" data-id="${v.id}" data-edit>Edit</button>
                    <button class="btn btn-danger btn-sm" data-id="${v.id}" data-delete>Delete</button>
                </td>
            </tr>
        `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Edit buttons
        document.querySelectorAll("[data-edit]").forEach(btn =>
            btn.addEventListener("click", () => {
                const visit = visits.find(v => v.id == btn.dataset.id);
                openVisitModal(visit);
            })
        );

        // Delete buttons
        document.querySelectorAll("[data-delete]").forEach(btn =>
            btn.addEventListener("click", () => {
                deleteVisitId = btn.dataset.id;
                new bootstrap.Modal(document.getElementById("modalDeleteVisit")).show();
            })
        );
    }

    // visits = [];
    // deleteVisitId = null;
    // patients = [];
    // specialists = [];

// -------------------- Load Patients and Specialists --------------------
    async function loadPatientsAndSpecialists() {
        const [resPatients, resSpecialists] = await Promise.all([
            authFetch("/operator/patients"),
            authFetch("/operator/specialists")
        ]);

        patients = resPatients.ok ? await resPatients.json() : [];
        specialists = resSpecialists.ok ? await resSpecialists.json() : [];
    }

// -------------------- Open Add/Edit Modal --------------------
    document.getElementById("btnAddVisit").addEventListener("click", () => openVisitModal());
    async function openVisitModal(visit = null) {
        await loadPatientsAndSpecialists(); // підвантажуємо перед відкриттям модалки

        const modal = document.getElementById(visit ? "modalEditVisit" : "modalAddVisit");
        const form = modal.querySelector("form");

        // ---------- Populate dropdowns (only for Add modal) ----------
        if (!visit) {
            const patientSelect = form.patientId;
            const specialistSelect = form.specialistId;

            patientSelect.innerHTML = "";
            specialistSelect.innerHTML = "";

            patients.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.id;
                opt.textContent = `${p.fullName} (MRN: ${p.medicalRecordNumber})`;
                patientSelect.appendChild(opt);
            });

            specialists.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s.id;
                opt.textContent = `${s.fullName} (${s.speciality})`;
                specialistSelect.appendChild(opt);
            });
        }

        if (visit) {
            form.id.value = visit.id;
            form.anamnesis.value = visit.anamnesis ?? "";
            form.diagnosis.value = visit.diagnosis ?? "";
            form.treatment.value = visit.treatment ?? "";
            form.recommendations.value = visit.recommendations ?? "";
            form.serviceCost.value = visit.serviceCost ?? 0;
            form.medicationCost.value = visit.medicationCost ?? 0;
            form.status.value = visit.status ?? "Scheduled";
        } else {
            form.reset();
        }

        new bootstrap.Modal(modal).show();
    }

// -------------------- Add Visit --------------------
    document.getElementById("formAddVisit").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;

        const dto = {
            patientId: form.patientId.value,
            patientMedicalRecord: Number(form.patientMedicalRecord.value),
            specialistId: form.specialistId.value,
            visitDate: form.visitDate.value,
            status: form.status.value,
            isFirstVisit: form.isFirstVisit.value === "true",
            anamnesis: form.anamnesis.value,
            diagnosis: form.diagnosis.value,
            treatment: form.treatment.value,
            recommendations: form.recommendations.value,
            serviceCost: Number(form.serviceCost.value),
            medicationCost: Number(form.medicationCost.value)
        };

        const res = await authFetch("/operator/visits", {
            method: "POST",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalAddVisit")).hide();
            loadVisits();
        } else {
            alert("Failed to create visit");
        }
    });

// -------------------- Edit Visit --------------------
    document.getElementById("formEditVisit").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;

        const dto = {
            anamnesis: form.anamnesis.value,
            diagnosis: form.diagnosis.value,
            treatment: form.treatment.value,
            recommendations: form.recommendations.value,
            serviceCost: Number(form.serviceCost.value),
            medicationCost: Number(form.medicationCost.value),
            status: form.status.value
        };

        const res = await authFetch(`/operator/visits/${form.id.value}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalEditVisit")).hide();
            loadVisits();
        } else {
            alert("Failed to update visit");
        }
    });

// -------------------- Delete Visit --------------------
    document.getElementById("btnConfirmDeleteVisit").addEventListener("click", async () => {
        if (!deleteVisitId) return;

        const res = await authFetch(`/operator/visits/${deleteVisitId}`, { method: "DELETE" });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalDeleteVisit")).hide();
            loadVisits();
        } else {
            alert("Failed to delete visit");
        }
    });



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
