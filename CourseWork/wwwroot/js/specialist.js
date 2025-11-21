// specialist.js (safe Bootstrap usage, guards for modal/backdrop errors)
document.addEventListener("DOMContentLoaded", () => {

    const tabs = document.querySelectorAll(".nav-link[data-tab]");
    const sections = document.querySelectorAll(".tab");

    function showTab(tabId) {
        sections.forEach(s => s.classList.remove("active"));
        const el = document.getElementById(tabId);
        if (el) el.classList.add("active");
    }

    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            btn.classList.add("active");

            const target = btn.dataset.tab;
            showTab(target);

            if (target === "dashboard") loadDashboard();
            if (target === "visits") loadVisits();
            if (target === "payments") loadPayments();
            if (target === "patients") loadPatients();
        });
    });

    // Helper: safe fetch wrapper (returns null on non-ok)
    async function safeJson(url, opts = {}) {
        try {
            const r = await fetch(url, opts);
            if (!r.ok) return null;
            return await r.json();
        } catch (e) {
            console.error("Network / parse error", e);
            return null;
        }
    }

    // --- DASHBOARD ---
    async function loadDashboard() {
        const el = document.getElementById("dashboard-content");
        if (!el) return;
        el.innerHTML = "Loading...";
        const data = await safeJson("/specialist/dashboard");
        if (!data) { el.innerHTML = "<div class='text-danger'>Error loading dashboard</div>"; return; }

        // NOTE: controller returns Today/Week arrays; adapt if your API differs
        const todayCount = (data.Today && data.Today.length) || 0;
        const weekCount = (data.Week && data.Week.length) || 0;
        const nextVisit = (data.Week && data.Week.length) ? new Date(data.Week[0].VisitDate).toLocaleString() : "None";

        el.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3"><div class="card p-3"><b>Today's visits</b><div>${todayCount}</div></div></div>
                <div class="col-md-3"><div class="card p-3"><b>Week visits</b><div>${weekCount}</div></div></div>
                <div class="col-md-6"><div class="card p-3"><b>Next visit</b><div>${nextVisit}</div></div></div>
            </div>
        `;
    }

    // --- VISITS ---
    async function loadVisits(filters = {}) {
        const c = document.getElementById("visits-list");
        if (!c) return;
        c.innerHTML = "Loading...";

        const qs = new URLSearchParams();
        if (filters.patientSearch) qs.set("patientSearch", filters.patientSearch);
        if (filters.dateFrom) qs.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) qs.set("dateTo", filters.dateTo);

        const list = await safeJson("/specialist/visits?" + qs.toString());
        if (!list) { c.innerHTML = "<div class='text-danger'>Error loading visits</div>"; return; }

        if (!list.length) { c.innerHTML = "<p>No visits found.</p>"; return; }

        // Build table
        const rows = list.map(v => {
            // try to get fields with various naming conventions
            const visitDate = v.VisitDate || v.visitDate || v.date || "";
            const patientName = v.PatientName || v.patientName || v.PatientMedicalRecord || v.patientMedicalRecord || "-";
            const diag = v.Diagnosis || v.diagnosis || "-";
            const serviceCost = (v.ServiceCost ?? v.serviceCost ?? 0);
            const medCost = (v.MedicationCost ?? v.medicationCost ?? 0);
            const status = v.Status || v.status || "";
            const id = v.Id || v.id || v._id || "";

            return `<tr>
                <td>${new Date(visitDate).toLocaleString()}</td>
                <td>${patientName}</td>
                <td>${diag}</td>
                <td>${(Number(serviceCost) + Number(medCost)).toFixed(2)}</td>
                <td><span class="badge bg-${statusBadge(status)}">${status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" data-id="${id}" data-action="edit-visit">Edit</button>
                    <button class="btn btn-sm btn-danger" data-id="${id}" data-action="cancel-visit">Cancel</button>
                </td>
            </tr>`;
        }).join("");

        c.innerHTML = `
            <div class="mb-3"><button id="btn-add-visit" class="btn btn-success">➕ Add Visit</button></div>
            <div class="table-responsive"><table class="table table-sm table-striped">
                <thead><tr><th>Date</th><th>Patient</th><th>Diagnosis</th><th>Costs</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>
        `;

        // Attach handlers
        document.getElementById("btn-add-visit")?.addEventListener("click", () => openAddVisitModal());
        c.querySelectorAll("button[data-action]").forEach(b => {
            const action = b.dataset.action;
            const id = b.dataset.id;
            if (action === "edit-visit") b.addEventListener("click", () => openEditVisit(id));
            if (action === "cancel-visit") b.addEventListener("click", () => changeVisitStatus(id, "Cancelled"));
        });
    }

    function statusBadge(status) {
        switch ((status || "").toString()) {
            case "Scheduled": return "info";
            case "InProgress": return "warning";
            case "Completed": return "success";
            case "Cancelled": return "secondary";
            case "NoShow": return "dark";
            default: return "primary";
        }
    }

    // Placeholder modal helpers (safe — only if element exists and bootstrap available)
    function tryShowModalById(modalId) {
        const modalEl = document.getElementById(modalId);
        if (!modalEl) {
            // fallback: no modal in DOM -> do nothing (or use prompt)
            return null;
        }
        if (typeof bootstrap === "undefined" || !bootstrap.Modal) {
            console.warn("Bootstrap Modal is not available, fallback will be used.");
            return null;
        }
        try {
            return new bootstrap.Modal(modalEl);
        } catch (e) {
            console.error("Bootstrap modal init error", e);
            return null;
        }
    }

    // Example fallback flows for add/edit visit:
    function openAddVisitModal(prefilledMrn) {
        // try to open modal with id="visitModal"
        const modal = tryShowModalById("visitModal");
        if (modal) {
            // If you have form fields, you can prefill here, e.g.
            const mrnEl = document.getElementById("visit-patient");
            if (mrnEl && prefilledMrn) mrnEl.value = prefilledMrn;
            modal.show();
            return;
        }
        // fallback: simple prompt flow
        const mrn = prefilledMrn || prompt("Patient MRN:");
        if (!mrn) return;
        const date = prompt("Visit date/time (YYYY-MM-DDTHH:mm):", new Date().toISOString().slice(0,16));
        if (!date) return;
        // minimal payload
        const payload = { PatientMedicalRecord: Number(mrn), VisitDate: date, Status: "Scheduled" };
        fetch("/specialist/visits", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)})
            .then(r => {
                if (r.ok) { alert("Visit created"); loadVisits(); }
                else alert("Error creating visit");
            });
    }

    function openEditVisit(id) {
        // safe edit flow without assuming modal exists
        safeJson(`/specialist/visits/${id}`).then(v => {
            if (!v) { alert("Cannot load visit"); return; }
            const newDiag = prompt("Diagnosis:", v.Diagnosis || v.diagnosis || "");
            if (newDiag === null) return;
            const payload = {
                Diagnosis: newDiag,
                ServiceCost: v.ServiceCost ?? v.serviceCost ?? 0,
                MedicationCost: v.MedicationCost ?? v.medicationCost ?? 0,
                VisitDate: v.VisitDate ?? v.visitDate
            };
            fetch(`/specialist/visits/${id}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload)})
                .then(r => { if (r.ok) { alert("Updated"); loadVisits(); } else alert("Update failed"); });
        });
    }

    async function changeVisitStatus(id, status) {
        if (!confirm(`Change status to ${status}?`)) return;
        const res = await fetch(`/specialist/visits/${id}/status`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ Status: status }) });
        if (res.ok) { alert("Status updated"); loadVisits(); }
        else alert("Failed to update status");
    }

    document.getElementById("apply-visit-filters")?.addEventListener("click", () => {
        loadVisits({
            patientSearch: document.getElementById("visit-patient-filter")?.value,
            dateFrom: document.getElementById("visit-date-from")?.value,
            dateTo: document.getElementById("visit-date-to")?.value
        });
    });

    // --- PAYMENTS ---
    async function loadPayments() {
        const c = document.getElementById("payments-list");
        if (!c) return;
        c.innerHTML = "Loading...";
        const list = await safeJson("/specialist/payments");
        if (!list) { c.innerHTML = "<div class='text-danger'>Error loading payments</div>"; return; }
        if (!list.length) { c.innerHTML = "<p>No payments.</p>"; return; }

        c.innerHTML = `<div class="table-responsive"><table class="table table-sm table-striped">
            <thead><tr><th>MRN</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>${list.map(p => {
            const id = p.Id || p.id || p._id || "";
            return `<tr>
                    <td>${p.PatientMedicalRecord ?? p.patientMedicalRecord ?? "-"}</td>
                    <td>${p.TotalAmount ?? p.totalAmount ?? 0}</td>
                    <td>${p.PaidAmount ?? p.paidAmount ?? 0}</td>
                    <td>${p.RemainingAmount ?? p.remainingAmount ?? 0}</td>
                    <td>${p.Status ?? p.status ?? ""}</td>
                    <td><button class="btn btn-sm btn-danger" data-id="${id}" data-action="cancel-pay">Cancel</button></td>
                </tr>`;
        }).join("")}</tbody></table></div>`;

        c.querySelectorAll("button[data-action='cancel-pay']").forEach(b => {
            const id = b.dataset.id;
            b.addEventListener("click", async () => {
                if (!confirm("Cancel payment?")) return;
                const r = await fetch(`/specialist/payments/${id}/cancel`, { method: "PATCH" });
                if (r.ok) { alert("Cancelled"); loadPayments(); } else alert("Cancel failed");
            });
        });
    }

    // --- PATIENTS ---
    async function loadPatients(filters = {}) {
        const tbody = document.getElementById("patients-list");
        if (!tbody) return;
        tbody.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";

        const qs = new URLSearchParams();
        if (filters.surname) qs.set("surname", filters.surname);
        if (filters.birthFrom) qs.set("birthFrom", filters.birthFrom);
        if (filters.birthTo) qs.set("birthTo", filters.birthTo);
        if (filters.healthStatus) qs.set("healthStatus", filters.healthStatus);

        const list = await safeJson("/specialist/patients?" + qs.toString());
        if (!list) { tbody.innerHTML = "<tr><td colspan='5' class='text-danger'>Error loading patients</td></tr>"; return; }
        if (!list.length) { tbody.innerHTML = "<tr><td colspan='5'>No patients found.</td></tr>"; return; }

        tbody.innerHTML = list.map(p => {
            const mrn = p.MedicalRecord ?? p.medicalRecord ?? p.medicalRecordNumber ?? p.MedicalRecordNumber ?? "";
            const fullName = p.FullName ?? p.fullName ?? `${p.Surname ?? p.surname ?? ""} ${p.Name ?? p.name ?? ""}`;
            const dob = p.DateOfBirth ?? p.dateOfBirth ?? p.BirthDate ?? p.birthDate ?? "";
            const hs = p.HealthStatus ?? p.healthStatus ?? "";
            return `<tr>
                <td>${fullName}</td>
                <td>${dob ? new Date(dob).toLocaleDateString() : ""}</td>
                <td>${hs}</td>
                <td>${mrn}</td>
                <td>
                    <button class="btn btn-info btn-sm" data-mrn="${mrn}" data-action="view-patient">View</button>
                    <button class="btn btn-success btn-sm" data-mrn="${mrn}" data-action="add-visit">Add Visit</button>
                </td>
            </tr>`;
        }).join("");

        tbody.querySelectorAll("button[data-action='view-patient']").forEach(b => {
            const mrn = b.dataset.mrn;
            b.addEventListener("click", async () => {
                const p = await safeJson(`/specialist/patients/${mrn}`);
                if (!p) { alert("Cannot load patient"); return; }
                // show details safely (fallback: alert)
                if (typeof bootstrap !== "undefined" && document.getElementById("patientDetailModal")) {
                    const modal = tryShowModalById("patientDetailModal");
                    // fill modal fields if exist
                    // ...
                    if (modal) modal.show();
                } else {
                    alert(`Name: ${p.FullName ?? p.fullName ?? ""}\nDOB: ${p.DateOfBirth ?? p.dateOfBirth ?? ""}\nStatus: ${p.HealthStatus ?? p.healthStatus ?? ""}`);
                }
            });
        });

        tbody.querySelectorAll("button[data-action='add-visit']").forEach(b => {
            const mrn = b.dataset.mrn;
            b.addEventListener("click", () => openAddVisitModal(mrn));
        });
    }

    document.getElementById("apply-patient-filters")?.addEventListener("click", () => {
        loadPatients({
            surname: document.getElementById("patient-surname-filter")?.value,
            birthFrom: document.getElementById("patient-birth-from")?.value,
            birthTo: document.getElementById("patient-birth-to")?.value,
            healthStatus: document.getElementById("patient-health-status")?.value
        });
    });

    // Initial load
    loadDashboard();
});
