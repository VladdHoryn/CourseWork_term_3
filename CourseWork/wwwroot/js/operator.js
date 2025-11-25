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
    let filteredPatients = [];
    let patientSort = { field: null, asc: true };

    async function loadPatients() {
        const res = await authFetch("/operator/patients");
        patients = res.ok ? await res.json() : [];
        applyPatientsFilters();
    }

    function applyPatientsFilters() {
        const search = document.getElementById("search-patients").value.trim().toLowerCase();
        const dateFrom = document.getElementById("filter-date-from")?.value;
        const dateTo = document.getElementById("filter-date-to")?.value;

        let data = [...patients];

        // ----- SEARCH -----
        if (search) {
            data = data.filter(p => {
                const searchTarget = [
                    p.fullName,
                    p.userName,
                    p.phone,
                    p.address,
                    p.medicalRecordNumber
                ].join(" ").toLowerCase();
                return searchTarget.includes(search);
            });
        }

        // ----- REGISTRATION DATE FROM -----
        if (dateFrom) {
            const from = new Date(dateFrom);
            data = data.filter(p => new Date(p.createdAt) >= from);
        }

        // ----- REGISTRATION DATE TO -----
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            data = data.filter(p => new Date(p.createdAt) <= to);
        }

        // Save + sort
        filteredPatients = data;

        if (patientSort.field) {
            filteredPatients.sort((a, b) => {
                let x = a[patientSort.field];
                let y = b[patientSort.field];

                if (typeof x === "string") x = x.toLowerCase();
                if (typeof y === "string") y = y.toLowerCase();

                if (x < y) return patientSort.asc ? -1 : 1;
                if (x > y) return patientSort.asc ? 1 : -1;
                return 0;
            });
        }

        renderPatientsTable();
    }

    function renderPatientsTable() {
        const container = document.getElementById("patients-table-container");

        if (!filteredPatients.length) {
            container.innerHTML = "<p class='text-muted'>No patients found</p>";
            return;
        }

        const columns = ["id","userName","fullName","phone","address","medicalRecordNumber","dateOfBirth","createdAt"];
        let html = `<table class="table table-hover table-bordered">
        <thead><tr>`;

        columns.forEach(c => {
            const arrow = (patientSort.field === c) ? (patientSort.asc ? "▲" : "▼") : "";
            html += `<th class="sortable" data-field="${c}" style="cursor:pointer">${c} ${arrow}</th>`;
        });

        html += `<th>Actions</th></tr></thead><tbody>`;

        filteredPatients.forEach(p => {
            html += `<tr>`;
            columns.forEach(c => {
                let val = p[c];
                if (c.toLowerCase().includes("date") && val)
                    val = new Date(val).toISOString().split("T")[0];
                html += `<td>${val ?? "-"}</td>`;
            });
            html += `
        <td>
            <button class="btn btn-sm btn-warning btn-edit-patient" data-id="${p.id}">Edit</button>
            <button class="btn btn-sm btn-danger btn-delete-patient" data-id="${p.id}">Delete</button>
        </td>
        </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        bindEditPatientButtons();
        bindDeletePatientButtons();
        bindPatientsSorting();
    }

    function bindPatientsSorting() {
        document.querySelectorAll("#patients-table-container th.sortable").forEach(th => {
            th.addEventListener("click", () => {
                const field = th.dataset.field;
                if (patientSort.field === field) {
                    patientSort.asc = !patientSort.asc;
                } else {
                    patientSort.field = field;
                    patientSort.asc = true;
                }
                applyPatientsFilters();
            });
        });
    }

// Apply button
    document.getElementById("apply-patients-filters")?.addEventListener("click", applyPatientsFilters);

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
    let deletePaymentId = null;

// -------------------- Load Payments --------------------
    async function loadPayments() {
        const res = await authFetch("/operator/payments");
        payments = res.ok ? await res.json() : [];
        renderPaymentsTable();
    }

// -------------------- Render Table --------------------
    function renderPaymentsTable() {
        const container = document.getElementById("payments-table-container");

        let html = `
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
            <td>${p.issuedDate ?? "-"}</td>
            <td>${p.dueDate ?? "-"}</td>
            <td>${p.lastPaymentDate ?? "-"}</td>
            <td>${p.status}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-id="${p.id}" data-edit>Edit</button>
                <button class="btn btn-danger btn-sm" data-id="${p.id}" data-delete>Delete</button>
            </td>
        </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        // Edit buttons
        document.querySelectorAll("[data-edit]").forEach(btn =>
            btn.addEventListener("click", () => {
                const payment = payments.find(p => p.id == btn.dataset.id);
                openPaymentModal(payment);
            })
        );

        // Delete buttons
        document.querySelectorAll("[data-delete]").forEach(btn =>
            btn.addEventListener("click", () => {
                deletePaymentId = btn.dataset.id;
                new bootstrap.Modal(document.getElementById("modalDeletePayment")).show();
            })
        );
    }

// -------------------- Open Add/Edit Modal --------------------
    let editingPayment = null;

    function openPaymentModal(payment = null) {
        editingPayment = payment; // зберігаємо поточний об’єкт

        const modal = document.getElementById(payment ? "modalEditPayment" : "modalAddPayment");
        const form = modal.querySelector("form");

        if (payment) {
            form.id.value = payment.id;
            form.totalAmount.value = payment.totalAmount;
            form.paidAmount.value = payment.paidAmount ?? 0;
            form.remainingAmount.value = payment.remainingAmount ?? 0;
            form.issuedDate.value = payment.issuedDate ? new Date(payment.issuedDate).toISOString().slice(0,16) : "";
            form.dueDate.value = payment.dueDate ? new Date(payment.dueDate).toISOString().slice(0,16) : "";
            form.lastPaymentDate.value = payment.lastPaymentDate ? new Date(payment.lastPaymentDate).toISOString().slice(0,16) : "";
            form.status.value = payment.status ?? "Pending";
        } else {
            form.reset();
        }

        new bootstrap.Modal(modal).show();
    }

// -------------------- Add Payment --------------------
    // -------------------- Init dropdowns when modal opens --------------------
    document.getElementById("modalAddPayment")
        .addEventListener("show.bs.modal", loadAddPaymentDropdowns);

// -------------------- Form submit --------------------
    document.getElementById("formAddPayment").addEventListener("submit", async (e) => {
        e.preventDefault();

        const dto = {
            visitId: document.getElementById("addPaymentVisitSelect").value,
            patientMedicalRecord: Number(document.getElementById("addPaymentPatientSelect").value),
            amount: Number(e.target.totalAmount.value)
        };

        try {
            const res = await authFetch("/operator/payments", {
                method: "POST",
                body: JSON.stringify(dto)
            });

            if (res.ok) {
                bootstrap.Modal.getInstance(document.getElementById("modalAddPayment")).hide();
                loadPayments();
            } else {
                const t = await res.text();
                alert("Failed to create payment: " + t);
            }
        } catch (err) {
            alert("Error: " + err.message);
        }
    });

// -------------------- Load visits and set Patient MR --------------------
    async function loadAddPaymentDropdowns() {
        const visitSelect = document.getElementById("addPaymentVisitSelect");
        const patientInput = document.getElementById("addPaymentPatientSelect");

        visitSelect.innerHTML = "<option disabled selected>Loading visits...</option>";
        patientInput.value = "";

        try {
            const visitsRes = await authFetch("/operator/visits");
            const visits = await visitsRes.json();

            visitSelect.innerHTML = "<option disabled selected>Select Visit</option>";
            visits.forEach(v => {
                const op = document.createElement("option");
                op.value = v.id;
                op.textContent = `${v.visitDate} — VisitID: ${v.id}`;
                op.dataset.patient = v.patientMedicalRecord;
                visitSelect.appendChild(op);
            });

            // коли змінюється вибір візиту
            visitSelect.addEventListener("change", () => {
                const selectedOption = visitSelect.selectedOptions[0];
                patientInput.value = selectedOption ? selectedOption.dataset.patient : "";
            });

        } catch (err) {
            console.error("Failed to load visits:", err);
            visitSelect.innerHTML = "<option>Error loading visits</option>";
            patientInput.value = "";
        }
    }


// -------------------- Edit Payment --------------------
    document.getElementById("formEditPayment").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;

        const dto = {
            totalAmount: form.totalAmount.value || 0,
            paidAmount: form.paidAmount.value || 0,
            remainingAmount: form.remainingAmount.value || 0,
            issuedDate: form.issuedDate.value ? new Date(form.issuedDate.value).toISOString() : null,
            dueDate: form.dueDate.value ? new Date(form.dueDate.value).toISOString() : null,
            lastPaymentDate: form.lastPaymentDate.value ? new Date(form.lastPaymentDate.value).toISOString() : null,
            status: form.status.value
        };

        const paymentId = form.id.value; // <-- правильний ID

        const res = await authFetch(`/operator/payments/${paymentId}`, {
            method: "PUT",
            body: JSON.stringify(dto)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalEditPayment")).hide();
            loadPayments();
        } else {
            const text = await res.text();
            alert("Failed to update payment: " + text);
        }
    });


// -------------------- Delete Payment --------------------
    document.getElementById("btnConfirmDeletePayment").addEventListener("click", async () => {
        if (!deletePaymentId) return;

        const res = await authFetch(`/operator/payments/${deletePaymentId}`, { method: "DELETE" });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalDeletePayment")).hide();
            loadPayments();
        } else {
            alert("Failed to delete payment");
        }
    });

    document.getElementById('btn-logout').addEventListener('click', function() {
        window.location.href = '/guest.html';
    });
});
