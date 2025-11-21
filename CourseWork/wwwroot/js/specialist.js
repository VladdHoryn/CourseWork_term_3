// specialist.js
// Full-featured frontend for Specialist page (Bootstrap 5 safe)
// Works with SpecialistController endpoints under /specialist
// - GET /specialist/dashboard
// - GET /specialist/visits
// - GET /specialist/visits/{id}
// - POST /specialist/visits
// - PUT /specialist/visits/{visitId}
// - PATCH /specialist/visits/{visitId}/status
// - GET /specialist/payments
// - GET /specialist/payments/{id}
// - POST /specialist/payments
// - PATCH /specialist/payments/{id}/cancel
// - GET /specialist/patients
// - GET /specialist/patients/{medicalRecord}

document.addEventListener("DOMContentLoaded", () => {

    /* -------------------- Helpers -------------------- */

    async function safeJson(url, opts = {}) {
        try {
            const r = await fetch(url, opts);
            if (!r.ok) {
                console.warn("request failed", url, r.status);
                return null;
            }
            // some endpoints may return empty body on success
            const text = await r.text();
            return text ? JSON.parse(text) : {};
        } catch (e) {
            console.error("Network/parse error", url, e);
            return null;
        }
    }

    function tryCreateModal(modalId) {
        const el = document.getElementById(modalId);
        if (!el) return null;
        if (typeof bootstrap === "undefined" || !bootstrap.Modal) return null;
        try {
            return new bootstrap.Modal(el);
        } catch (e) {
            console.error("Bootstrap modal error", e);
            return null;
        }
    }

    function formatDateTimeLocal(d) {
        if (!d) return "";
        const dt = new Date(d);
        const pad = (n) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    }

    function parseNumber(v) {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
    }

    function statusBadgeClass(status) {
        switch ((status || "").toString()) {
            case "Scheduled": return "bg-info";
            case "InProgress": return "bg-warning";
            case "Completed": return "bg-success";
            case "Cancelled": return "bg-secondary";
            case "NoShow": return "bg-dark";
            default: return "bg-primary";
        }
    }

    /* -------------------- Tab handling (Bootstrap tabs) -------------------- */

    // When a tab is shown, load its data.
    const tabLinks = document.querySelectorAll('a[data-bs-toggle="tab"]');
    tabLinks.forEach(a => {
        a.addEventListener('shown.bs.tab', (e) => {
            const href = (e.target && e.target.getAttribute('href')) || "";
            if (href === "#dashboard") loadDashboard();
            if (href === "#visits") loadVisits();
            if (href === "#payments") loadPayments();
            if (href === "#patients") loadPatients();
        });
    });

    // initial load - load dashboard by default
    loadDashboard();

    /* -------------------- DASHBOARD -------------------- */

    async function loadDashboard() {
        const el = document.getElementById("dashboardContent") || document.getElementById("dashboard-content");
        if (!el) return;
        el.innerHTML = `<div class="text-muted">Loading...</div>`;
        const data = await safeJson("/specialist/dashboard");
        if (!data) {
            el.innerHTML = `<div class="text-danger">Error loading dashboard</div>`;
            return;
        }

        const todayArr = data.Today || data.today || [];
        const weekArr = data.Week || data.week || [];

        // quick stats
        const totalVisits = (todayArr.length || 0) + (weekArr.length || 0);
        const completedCount = (todayArr.filter?.(v => (v.Status || v.status) === "Completed").length) || 0;
        const patientsCount = new Set((todayArr.concat(weekArr)).map(v => v.PatientMedicalRecord ?? v.patientMedicalRecord)).size;

        // next visit
        const nextVisit = (weekArr && weekArr.length) ? new Date(weekArr[0].VisitDate || weekArr[0].visitDate).toLocaleString() : "None";

        el.innerHTML = `
      <div class="row g-3">
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted small">Today's visits</div>
            <div class="h4">${todayArr.length}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted small">Week visits</div>
            <div class="h4">${weekArr.length}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted small">Completed visits (sample)</div>
            <div class="h4">${completedCount}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted small">Patients (unique)</div>
            <div class="h4">${patientsCount}</div>
          </div>
        </div>
      </div>

      <div class="mt-3 card p-3">
        <div class="mb-1 text-muted">Next visit</div>
        <div>${nextVisit}</div>
      </div>
    `;
    }

    /* -------------------- VISITS -------------------- */

    // render visits table into #visitsTable or #visits-list
    async function loadVisits(filters = {}) {
        const tableEl = document.getElementById("visitsTable") || document.getElementById("visits-list");
        if (!tableEl) return;
        tableEl.innerHTML = `<tr><td>Loading...</td></tr>`;

        const qs = new URLSearchParams();
        if (filters.patientSearch) qs.set("patientSearch", filters.patientSearch);
        if (filters.dateFrom) qs.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) qs.set("dateTo", filters.dateTo);

        const list = await safeJson("/specialist/visits?" + qs.toString());
        if (!list) {
            tableEl.innerHTML = `<tr><td class="text-danger">Error loading visits</td></tr>`;
            return;
        }
        if (!list.length) {
            tableEl.innerHTML = `<tr><td>No visits found.</td></tr>`;
            return;
        }

        // Build HTML table (thead + tbody)
        const rows = list.map(v => {
            const id = v.Id || v.id || v._id || "";
            const visitDate = v.VisitDate || v.visitDate || v.date || "";
            const patient = (v.PatientName || v.patientName) || (v.PatientMedicalRecord ?? v.patientMedicalRecord) || "-";
            const diagnosis = v.Diagnosis || v.diagnosis || "-";
            const svc = parseNumber(v.ServiceCost ?? v.serviceCost ?? 0);
            const med = parseNumber(v.MedicationCost ?? v.medicationCost ?? 0);
            const status = v.Status || v.status || "";
            const total = (svc + med).toFixed(2);
            return `
        <tr data-id="${id}">
          <td>${new Date(visitDate).toLocaleString()}</td>
          <td>${patient}</td>
          <td>${diagnosis}</td>
          <td>${total}</td>
          <td><span class="badge ${statusBadgeClass(status)}">${status}</span></td>
          <td>
            <button class="btn btn-sm btn-primary me-1 btn-edit-visit" data-id="${id}">Edit</button>
            <button class="btn btn-sm btn-secondary me-1 btn-status-visit" data-id="${id}">Status</button>
            <button class="btn btn-sm btn-danger btn-cancel-visit" data-id="${id}">Cancel</button>
          </td>
        </tr>
      `;
        }).join("");

        // if element is a <table> we must include thead/tbody; if it's a div insert full table
        if (tableEl.tagName.toLowerCase() === "table") {
            tableEl.innerHTML = `
        <thead>
          <tr><th>Date</th><th>Patient</th><th>Diagnosis</th><th>Cost</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      `;
        } else {
            tableEl.innerHTML = `
        <div class="mb-3"><button id="btn-open-create-visit" class="btn btn-success">➕ Add Visit</button></div>
        <div class="table-responsive"><table class="table table-sm table-striped"><thead><tr><th>Date</th><th>Patient</th><th>Diagnosis</th><th>Cost</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
      `;
        }

        // attach handlers
        document.getElementById("btn-open-create-visit")?.addEventListener("click", () => openCreateVisitModal());

        (tableEl.querySelectorAll ? tableEl.querySelectorAll(".btn-edit-visit") : []).forEach(b => {
            b.addEventListener("click", () => openEditVisitModal(b.dataset.id));
        });
        (tableEl.querySelectorAll ? tableEl.querySelectorAll(".btn-status-visit") : []).forEach(b => {
            b.addEventListener("click", () => openChangeStatusModal(b.dataset.id));
        });
        (tableEl.querySelectorAll ? tableEl.querySelectorAll(".btn-cancel-visit") : []).forEach(b => {
            b.addEventListener("click", () => cancelVisit(b.dataset.id));
        });
    }

    // Open Create Visit modal or fallback prompt flow
    function openCreateVisitModal(prefill = {}) {
        // expected modal id: modalCreateVisit
        const modal = tryCreateModal("modalCreateVisit") || tryCreateModal("visitModal") || null;
        if (modal) {
            // try to prefill fields if exist (support multiple id conventions)
            const patientIdEl = document.getElementById("cvPatientId") || document.getElementById("cvPatient") || document.getElementById("visit-patient");
            const patientMrnEl = document.getElementById("cvPatientMrn") || document.getElementById("cvPatientMRN") || document.getElementById("visit-patient-mrn");
            const dateEl = document.getElementById("cvDate") || document.getElementById("cvVisitDate") || document.getElementById("visit-date");
            const anamEl = document.getElementById("cvAnamnesis") || document.getElementById("cvNotes");
            const diagEl = document.getElementById("cvDiagnosis");
            const treatEl = document.getElementById("cvTreatment");
            const recEl = document.getElementById("cvRecommendations");
            const svcEl = document.getElementById("cvServiceCost");
            const medEl = document.getElementById("cvMedicationCost");

            if (prefill.patientId && patientIdEl) patientIdEl.value = prefill.patientId;
            if (prefill.patientMrn && patientMrnEl) patientMrnEl.value = prefill.patientMrn;
            if (prefill.visitDate && dateEl) dateEl.value = formatDateTimeLocal(prefill.visitDate);

            modal.show();
            return;
        }

        // fallback: prompt-based creation
        (async () => {
            const mrn = prompt("Patient medical record (MRN):", prefill.patientMrn || "");
            if (!mrn) return;
            const date = prompt("Visit date/time (YYYY-MM-DDTHH:mm):", new Date().toISOString().slice(0,16));
            if (!date) return;
            const anam = prompt("Anamnesis (optional):", "");
            const diag = prompt("Diagnosis (optional):", "");
            const treat = prompt("Treatment (optional):", "");
            const svc = parseNumber(prompt("Service cost:", "0"));
            const med = parseNumber(prompt("Medication cost:", "0"));

            const payload = {
                PatientId: prefill.patientId || null,
                PatientMedicalRecord: Number(mrn),
                VisitDate: new Date(date).toISOString(),
                Anamnesis: anam,
                Diagnosis: diag,
                Treatment: treat,
                Recommendations: "",
                ServiceCost: svc,
                MedicationCost: med
            };

            const res = await fetch("/specialist/visits", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
            if (res.ok) { alert("Created"); loadVisits(); } else { alert("Create failed"); }
        })();
    }

    // Open Edit Visit modal: loads visit, fills fields
    async function openEditVisitModal(visitId) {
        const data = await safeJson(`/specialist/visits/${visitId}`);
        if (!data) { alert("Cannot load visit"); return; }

        const modal = tryCreateModal("modalUpdateVisit") || tryCreateModal("visitEditModal") || null;
        if (modal) {
            // fill fields if present
            const dateEl = document.getElementById("uvDate") || document.getElementById("edit-visit-date");
            const anamEl = document.getElementById("uvAnamnesis") || document.getElementById("edit-visit-anamnesis");
            const diagEl = document.getElementById("uvNotes") || document.getElementById("edit-visit-diagnosis");
            const treatEl = document.getElementById("uvTreatment");
            const recEl = document.getElementById("uvRecommendations");
            const svcEl = document.getElementById("uvServiceCost");
            const medEl = document.getElementById("uvMedicationCost");

            if (dateEl) dateEl.value = formatDateTimeLocal(data.VisitDate || data.visitDate);
            if (anamEl) anamEl.value = data.Anamnesis ?? data.anamnesis ?? "";
            if (diagEl) diagEl.value = data.Diagnosis ?? data.diagnosis ?? "";
            if (treatEl) treatEl.value = data.Treatment ?? data.treatment ?? "";
            if (recEl) recEl.value = data.Recommendations ?? data.recommendations ?? "";
            if (svcEl) svcEl.value = data.ServiceCost ?? data.serviceCost ?? 0;
            if (medEl) medEl.value = data.MedicationCost ?? data.medicationCost ?? 0;

            // store editing id on modal element for save handler
            const modalEl = document.getElementById(modal._element?.id || "modalUpdateVisit");
            if (modalEl) modalEl.setAttribute("data-edit-id", visitId);
            modal.show();
            return;
        }

        // fallback prompt
        const newDiag = prompt("Diagnosis:", data.Diagnosis || data.diagnosis || "");
        if (newDiag === null) return;
        const payload = {
            Anamnesis: data.Anamnesis ?? data.anamnesis ?? "",
            Diagnosis: newDiag,
            Treatment: data.Treatment ?? data.treatment ?? "",
            Recommendations: data.Recommendations ?? data.recommendations ?? "",
            ServiceCost: data.ServiceCost ?? data.serviceCost ?? 0,
            MedicationCost: data.MedicationCost ?? data.medicationCost ?? 0
        };
        const r = await fetch(`/specialist/visits/${visitId}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)});
        if (r.ok) { alert("Updated"); loadVisits(); } else alert("Update failed");
    }

    // Change status modal
    function openChangeStatusModal(visitId) {
        const modal = tryCreateModal("modalVisitStatus") || tryCreateModal("visitStatusModal");
        if (modal) {
            const modalEl = modal._element || document.getElementById("modalVisitStatus");
            if (modalEl) modalEl.setAttribute("data-edit-id", visitId);
            modal.show();
            return;
        }
        // fallback
        const s = prompt("Enter new status (Scheduled, InProgress, Completed, Cancelled, NoShow):", "Completed");
        if (!s) return;
        changeVisitStatus(visitId, s);
    }

    // Actually call PATCH to change the status
    async function changeVisitStatus(visitId, status) {
        const body = JSON.stringify({ Status: status });
        const r = await fetch(`/specialist/visits/${visitId}/status`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body });
        if (r.ok) { alert("Status updated"); loadVisits(); } else { alert("Failed to update status"); }
    }

    // Cancel visit -> we will set status to Cancelled via PATCH
    async function cancelVisit(visitId) {
        if (!confirm("Cancel this visit?")) return;
        await changeVisitStatus(visitId, "Cancelled");
    }

    /* -------------------- PAYMENTS -------------------- */

    async function loadPayments(filters = {}) {
        const tableEl = document.getElementById("paymentsTable") || document.getElementById("payments-list");
        if (!tableEl) return;
        tableEl.innerHTML = `<tr><td>Loading...</td></tr>`;
        const list = await safeJson("/specialist/payments");
        if (!list) { tableEl.innerHTML = `<tr><td class="text-danger">Error loading payments</td></tr>`; return; }
        if (!list.length) { tableEl.innerHTML = `<tr><td>No payments.</td></tr>`; return; }

        const rows = list.map(p => {
            const id = p.Id || p.id || p._id || "";
            const mrn = p.PatientMedicalRecord ?? p.patientMedicalRecord ?? "-";
            const total = p.TotalAmount ?? p.totalAmount ?? 0;
            const paid = p.PaidAmount ?? p.paidAmount ?? 0;
            const remaining = p.RemainingAmount ?? p.remainingAmount ?? (total - paid);
            const status = p.Status ?? p.status ?? "";
            return `
        <tr data-id="${id}">
          <td>${mrn}</td>
          <td>${Number(total).toFixed(2)}</td>
          <td>${Number(paid).toFixed(2)}</td>
          <td>${Number(remaining).toFixed(2)}</td>
          <td><span class="badge ${statusBadgeClass(status)}">${status}</span></td>
          <td>
            <button class="btn btn-sm btn-primary me-1 btn-edit-payment" data-id="${id}">Edit</button>
            <button class="btn btn-sm btn-danger btn-cancel-payment" data-id="${id}">Cancel</button>
          </td>
        </tr>
      `;
        }).join("");

        if (tableEl.tagName.toLowerCase() === "table") {
            tableEl.innerHTML = `<thead><tr><th>MRN</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody>`;
        } else {
            tableEl.innerHTML = `<div class="mb-3"><button id="btn-open-create-payment" class="btn btn-success">➕ Create Payment</button></div><div class="table-responsive"><table class="table table-sm table-striped"><thead><tr><th>MRN</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }

        document.getElementById("btn-open-create-payment")?.addEventListener("click", () => openCreatePaymentModal());

        (tableEl.querySelectorAll ? tableEl.querySelectorAll(".btn-cancel-payment") : []).forEach(b => {
            b.addEventListener("click", () => openCancelPaymentModal(b.dataset.id));
        });

        (tableEl.querySelectorAll ? tableEl.querySelectorAll(".btn-edit-payment") : []).forEach(b => {
            b.addEventListener("click", () => openEditPaymentModal(b.dataset.id));
        });
    }

    function openCreatePaymentModal(prefill = {}) {
        const modal = tryCreateModal("modalCreatePayment");
        if (modal) {
            const visitIdEl = document.getElementById("cpVisitId");
            const amountEl = document.getElementById("cpAmount");
            if (prefill.visitId && visitIdEl) visitIdEl.value = prefill.visitId;
            modal.show();
            return;
        }
        // fallback prompt
        (async () => {
            const vid = prompt("Visit ID:", prefill.visitId || "");
            if (!vid) return;
            const amt = parseNumber(prompt("Amount:", "0"));
            const patientMrn = parseNumber(prompt("Patient MRN:", prefill.patientMrn || "0"));
            const dto = { VisitId: vid, Amount: amt, PatientMedicalRecord: Number(patientMrn) };
            const r = await fetch("/specialist/payments", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(dto) });
            if (r.ok) { alert("Payment created"); loadPayments(); } else alert("Create failed");
        })();
    }

    function openEditPaymentModal(paymentId) {
        // Not implemented specific edit modal in HTML by default; try to load and fallback to prompt
        (async () => {
            const p = await safeJson(`/specialist/payments/${paymentId}`);
            if (!p) { alert("Cannot load payment"); return; }
            const newTotal = parseNumber(prompt("Total amount:", p.TotalAmount ?? p.totalAmount ?? 0));
            const payload = { TotalAmount: newTotal };
            // Controller doesn't expose a dedicated PUT for payments in provided controller,
            // but if you have one implement here. We'll attempt POST/PUT at /specialist/payments/{id} if exists.
            const r = await fetch(`/specialist/payments/${paymentId}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
            if (r.ok) { alert("Updated"); loadPayments(); } else alert("Update failed (endpoint may not exist)");
        })();
    }

    function openCancelPaymentModal(paymentId) {
        const modal = tryCreateModal("modalCancelPayment");
        if (modal) {
            const modalEl = modal._element || document.getElementById("modalCancelPayment");
            if (modalEl) modalEl.setAttribute("data-pay-id", paymentId);
            modal.show();
            return;
        }
        (async () => {
            if (!confirm("Cancel payment?")) return;
            const r = await fetch(`/specialist/payments/${paymentId}/cancel`, { method: "PATCH" });
            if (r.ok) { alert("Cancelled"); loadPayments(); } else alert("Cancel failed");
        })();
    }

    async function cancelPaymentConfirmed(paymentId) {
        const r = await fetch(`/specialist/payments/${paymentId}/cancel`, { method: "PATCH" });
        if (r.ok) { alert("Cancelled"); loadPayments(); } else alert("Cancel failed");
    }

    /* -------------------- PATIENTS -------------------- */

    async function loadPatients(filters = {}) {
        const tableEl = document.getElementById("patientsTable") || document.getElementById("patients-list") || document.getElementById("patients-list-wrapper");
        if (!tableEl) return;
        tableEl.innerHTML = `<tr><td>Loading...</td></tr>`;
        const qs = new URLSearchParams();
        if (filters.surname) qs.set("surname", filters.surname);
        if (filters.birthFrom) qs.set("birthFrom", filters.birthFrom);
        if (filters.birthTo) qs.set("birthTo", filters.birthTo);
        if (filters.healthStatus) qs.set("healthStatus", filters.healthStatus);

        const list = await safeJson("/specialist/patients?" + qs.toString());
        if (!list) { tableEl.innerHTML = `<tr><td class="text-danger">Error loading patients</td></tr>`; return; }
        if (!list.length) { tableEl.innerHTML = `<tr><td>No patients.</td></tr>`; return; }

        const rows = list.map(p => {
            const mrn = p.MedicalRecord ?? p.medicalRecord ?? p.medicalRecordNumber ?? p.MedicalRecordNumber ?? (p.MedicalRecordNumber ?? "");
            const fullName = p.FullName ?? p.fullName ?? `${p.Surname ?? p.surname ?? ""} ${p.Name ?? p.name ?? ""}`.trim();
            const dob = p.DateOfBirth || p.dateOfBirth || p.BirthDate || p.birthDate || "";
            const hs = p.HealthStatus ?? p.healthStatus ?? "";
            return `
        <tr data-mrn="${mrn}">
          <td>${fullName}</td>
          <td>${dob ? new Date(dob).toLocaleDateString() : ""}</td>
          <td>${hs}</td>
          <td>${mrn}</td>
          <td>
            <button class="btn btn-sm btn-info me-1 btn-view-patient" data-mrn="${mrn}">View</button>
            <button class="btn btn-sm btn-success btn-add-visit" data-mrn="${mrn}">Add Visit</button>
          </td>
        </tr>
      `;
        }).join("");

        if (tableEl.tagName.toLowerCase() === "table") {
            tableEl.innerHTML = `<thead><tr><th>Full Name</th><th>DOB</th><th>Health</th><th>MRN</th><th>Actions</th></tr></thead><tbody>${rows}</tbody>`;
        } else {
            tableEl.innerHTML = `<div class="table-responsive"><table class="table table-sm table-striped"><thead><tr><th>Full Name</th><th>DOB</th><th>Health</th><th>MRN</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        }

        (tableEl.querySelectorAll ? tableEl.querySelectorAll(".btn-view-patient") : []).forEach(b => {
            b.addEventListener("click", () => openPatientDetailsModal(b.dataset.mrn));
        });
        (tableEl.querySelectorAll ? tableEl.querySelectorAll(".btn-add-visit") : []).forEach(b => {
            b.addEventListener("click", () => openCreateVisitModal({ patientMrn: b.dataset.mrn }));
        });
    }

    async function openPatientDetailsModal(mrn) {
        const p = await safeJson(`/specialist/patients/${mrn}`);
        if (!p) { alert("Cannot load patient"); return; }
        const modal = tryCreateModal("patientDetailModal") || tryCreateModal("modalPatientDetails");
        if (modal) {
            // fill modal fields if exist
            const modalEl = modal._element || document.getElementById("patientDetailModal");
            const nameEl = modalEl?.querySelector("[data-field='fullName']");
            const dobEl = modalEl?.querySelector("[data-field='dob']");
            const phoneEl = modalEl?.querySelector("[data-field='phone']");
            const addrEl = modalEl?.querySelector("[data-field='address']");
            const mrnEl = modalEl?.querySelector("[data-field='mrn']");
            if (nameEl) nameEl.textContent = p.FullName ?? p.fullName ?? `${p.Surname ?? ''} ${p.Name ?? ''}`.trim();
            if (dobEl) dobEl.textContent = (p.DateOfBirth || p.dateOfBirth) ? new Date(p.DateOfBirth || p.dateOfBirth).toLocaleDateString() : "";
            if (phoneEl) phoneEl.textContent = p.Phone ?? p.phone ?? "";
            if (addrEl) addrEl.textContent = p.Address ?? p.address ?? "";
            if (mrnEl) mrnEl.textContent = p.MedicalRecordNumber ?? p.medicalRecordNumber ?? mrn;
            modal.show();
            return;
        }

        // fallback alert
        alert(`Name: ${p.FullName ?? p.fullName ?? ""}\nDOB: ${p.DateOfBirth ?? p.dateOfBirth ?? ""}\nPhone: ${p.Phone ?? p.phone ?? ""}\nAddress: ${p.Address ?? p.address ?? ""}`);
    }

    /* -------------------- Modal submit handlers (hooked to modal buttons) -------------------- */

    // These are exposed on window so modal inline onclicks (if present) still work
    window.createVisit = async function createVisitHandler() {
        // gather values from modal inputs if exist
        const patientIdEl = document.getElementById("cvPatientId") || document.getElementById("cvPatient");
        const patientMrnEl = document.getElementById("cvPatientMrn") || document.getElementById("cvPatientMRN");
        const dateEl = document.getElementById("cvDate");
        const anamEl = document.getElementById("cvAnamnesis") || document.getElementById("cvNotes");
        const diagEl = document.getElementById("cvDiagnosis");
        const treatEl = document.getElementById("cvTreatment");
        const recEl = document.getElementById("cvRecommendations");
        const svcEl = document.getElementById("cvServiceCost");
        const medEl = document.getElementById("cvMedicationCost");

        // fallback to simple elements if not found
        const patientId = patientIdEl?.value?.trim() || null;
        const patientMrn = patientMrnEl?.value?.trim() || (document.getElementById("cvPatient")?.value?.trim()) || null;
        const visitDate = dateEl?.value ? new Date(dateEl.value).toISOString() : null;

        // if minimal inputs present in your html used earlier (cvPatient, cvDate, cvNotes) they will be used
        const payload = {
            PatientId: patientId,
            PatientMedicalRecord: patientMrn ? Number(patientMrn) : undefined,
            VisitDate: visitDate,
            Anamnesis: anamEl?.value ?? "",
            Diagnosis: diagEl?.value ?? "",
            Treatment: treatEl?.value ?? "",
            Recommendations: recEl?.value ?? "",
            ServiceCost: svcEl ? parseNumber(svcEl.value) : 0,
            MedicationCost: medEl ? parseNumber(medEl.value) : 0
        };

        // Validation: require PatientMedicalRecord and VisitDate
        if (!payload.PatientMedicalRecord || !payload.VisitDate) {
            // fallback to prompt creation if insufficient fields
            const mrn = prompt("Patient medical record (MRN):", payload.PatientMedicalRecord || "");
            if (!mrn) return alert("MRN required");
            const dt = prompt("Visit date/time (YYYY-MM-DDTHH:mm):", new Date().toISOString().slice(0,16));
            if (!dt) return alert("Date required");
            payload.PatientMedicalRecord = Number(mrn);
            payload.VisitDate = new Date(dt).toISOString();
        }

        const r = await fetch("/specialist/visits", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        if (r.ok) {
            alert("Visit created");
            // hide modal if present
            const m = tryCreateModal("modalCreateVisit");
            if (m) m.hide();
            loadVisits();
        } else {
            const txt = await r.text();
            alert("Failed to create visit: " + (txt || r.status));
        }
    };

    window.updateVisit = async function updateVisitHandler() {
        // find modal with data-edit-id
        const editModalEl = document.getElementById("modalUpdateVisit") || document.getElementById("visitEditModal");
        const visitId = editModalEl?.getAttribute("data-edit-id");
        if (!visitId) return alert("No visit selected");

        const dateEl = document.getElementById("uvDate") || document.getElementById("edit-visit-date");
        const anamEl = document.getElementById("uvAnamnesis");
        const diagEl = document.getElementById("uvNotes") || document.getElementById("edit-visit-diagnosis");
        const treatEl = document.getElementById("uvTreatment");
        const recEl = document.getElementById("uvRecommendations");
        const svcEl = document.getElementById("uvServiceCost");
        const medEl = document.getElementById("uvMedicationCost");

        const payload = {
            Anamnesis: anamEl?.value ?? "",
            Diagnosis: diagEl?.value ?? "",
            Treatment: treatEl?.value ?? "",
            Recommendations: recEl?.value ?? "",
            ServiceCost: svcEl ? parseNumber(svcEl.value) : 0,
            MedicationCost: medEl ? parseNumber(medEl.value) : 0,
            // status is part of VisitUpdateDto too: we won't change here unless input exists
        };

        if (dateEl && dateEl.value) payload.VisitDate = new Date(dateEl.value).toISOString();

        const r = await fetch(`/specialist/visits/${visitId}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
        if (r.ok) {
            alert("Visit updated");
            const m = tryCreateModal("modalUpdateVisit");
            if (m) m.hide();
            loadVisits();
        } else {
            const txt = await r.text();
            alert("Update failed: " + (txt || r.status));
        }
    };

    // Status modal apply: reads data-edit-id and select inside modal
    window.applyVisitStatusChange = async function applyVisitStatusChangeHandler() {
        const modalEl = document.getElementById("modalVisitStatus") || document.getElementById("visitStatusModal");
        const id = modalEl?.getAttribute("data-edit-id");
        const select = modalEl?.querySelector("select") || document.getElementById("vsStatus");
        if (!id || !select) return alert("Missing data");
        const newStatus = select.value;
        await changeVisitStatus(id, newStatus);
        const m = tryCreateModal("modalVisitStatus");
        if (m) m.hide();
    };

    window.createPayment = async function createPaymentHandler() {
        const visitIdEl = document.getElementById("cpVisitId");
        const amountEl = document.getElementById("cpAmount");
        const mrnEl = document.getElementById("cpPatientMrn");

        const dto = {
            VisitId: visitIdEl?.value || undefined,
            Amount: amountEl ? parseNumber(amountEl.value) : undefined,
            PatientMedicalRecord: mrnEl ? Number(mrnEl.value) : undefined
        };

        if (!dto.Amount || (!dto.VisitId && !dto.PatientMedicalRecord)) {
            alert("Please provide VisitId or Patient MRN and amount.");
            return;
        }

        const r = await fetch("/specialist/payments", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(dto) });
        if (r.ok) {
            alert("Payment created");
            tryCreateModal("modalCreatePayment")?.hide();
            loadPayments();
        } else {
            const txt = await r.text();
            alert("Create failed: " + (txt || r.status));
        }
    };

    // Cancel payment confirmed from modal
    window.confirmCancelPayment = async function confirmCancelPaymentHandler() {
        const modalEl = document.getElementById("modalCancelPayment");
        const payId = modalEl?.getAttribute("data-pay-id");
        if (!payId) return alert("No payment selected");
        const r = await fetch(`/specialist/payments/${payId}/cancel`, { method: "PATCH" });
        if (r.ok) {
            alert("Cancelled");
            tryCreateModal("modalCancelPayment")?.hide();
            loadPayments();
        } else {
            const txt = await r.text();
            alert("Cancel failed: " + (txt || r.status));
        }
    };

    /* -------------------- Wire modal-confirm buttons if present -------------------- */

    // If HTML contains modal buttons with ids, attach listeners to global functions above.
    document.getElementById("modalCreateVisitSubmit")?.addEventListener("click", () => window.createVisit());
    document.getElementById("modalUpdateVisitSubmit")?.addEventListener("click", () => window.updateVisit());
    document.getElementById("modalVisitStatusApply")?.addEventListener("click", () => window.applyVisitStatusChange());
    document.getElementById("modalCreatePaymentSubmit")?.addEventListener("click", () => window.createPayment());
    document.getElementById("modalCancelPaymentConfirm")?.addEventListener("click", () => window.confirmCancelPayment());

    /* -------------------- Filters / search buttons -------------------- */

    document.getElementById("apply-visit-filters")?.addEventListener("click", () => {
        loadVisits({
            patientSearch: document.getElementById("visit-patient-filter")?.value,
            dateFrom: document.getElementById("visit-date-from")?.value,
            dateTo: document.getElementById("visit-date-to")?.value
        });
    });

    document.getElementById("apply-patient-filters")?.addEventListener("click", () => {
        loadPatients({
            surname: document.getElementById("patient-surname-filter")?.value,
            birthFrom: document.getElementById("patient-birth-from")?.value,
            birthTo: document.getElementById("patient-birth-to")?.value,
            healthStatus: document.getElementById("patient-health-status")?.value
        });
    });

    document.getElementById("visitSearch")?.addEventListener("input", (e) => {
        const q = e.target.value.trim();
        // quick client-side filtering is possible, but for correctness call server with query
        loadVisits({ patientSearch: q });
    });

    document.getElementById("patientSearch")?.addEventListener("input", (e) => {
        const q = e.target.value.trim();
        loadPatients({ surname: q });
    });

    document.getElementById("paymentSearch")?.addEventListener("input", (e) => {
        const q = e.target.value.trim();
        loadPayments({ query: q });
    });

    /* -------------------- Expose some methods to console for debug -------------------- */
    window.loadVisits = loadVisits;
    window.loadPayments = loadPayments;
    window.loadPatients = loadPatients;
    window.loadDashboard = loadDashboard;
    window.openCreateVisitModal = openCreateVisitModal;
    window.openEditVisitModal = openEditVisitModal;
    window.openChangeStatusModal = openChangeStatusModal;
    window.openCreatePaymentModal = openCreatePaymentModal;
    window.openCancelPaymentModal = openCancelPaymentModal;
    window.openPatientDetailsModal = openPatientDetailsModal;
    window.cancelPaymentConfirmed = cancelPaymentConfirmed;

});
