import {authFetch} from "./auth.js";

const VisitStatusMap = {
    0: "Scheduled",
    1: "InProgress",
    2: "Completed",
    3: "Cancelled",
    4: "NoShow"
};
const PaymentStatusMap = {
    0: "Pending",
    1: "Paid",
    2: "PartiallyPaid",
    3: "Overdue",
    4: "Cancelled"
};

document.addEventListener("DOMContentLoaded", () => {

    // ===== TAB SWITCH =====
    document.querySelectorAll("[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab").forEach(t => t.classList.add("d-none"));
            const tabEl = document.getElementById(tab);
            if (tabEl) tabEl.classList.remove("d-none");
            document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            switch (tab) {
                case "dashboard":
                    loadDashboard();
                    break;
                case "visits":
                    loadVisits();
                    break;
                case "payments":
                    loadPayments();
                    break;
                case "patients":
                    loadPatients();
                    break;
            }
        });
    });

    // ===== DASHBOARD =====
    async function loadDashboard() {
        const res = await authFetch("/specialist/dashboard");
        if (!res || !res.ok) return;

        const data = await res.json();

        const todayVisits = Array.isArray(data.today) ? data.today : [];
        const weekVisits = Array.isArray(data.week) ? data.week : [];

        renderDashboardTable("dashboard-today-container", todayVisits);
        renderDashboardTable("dashboard-week-container", weekVisits);

        // ==== STATS CARDS ====
        document.getElementById("dashboard-stats").innerHTML = `
        <div class="row g-3">
            <div class="col-md-4">
                <div class="card shadow-sm border-primary">
                    <div class="card-body">
                        <h5 class="card-title text-primary">Total Week Visits</h5>
                        <p class="fs-4 fw-bold">${weekVisits.length}</p>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card shadow-sm border-success">
                    <div class="card-body">
                        <h5 class="card-title text-success">Completed</h5>
                        <p class="fs-4 fw-bold">${weekVisits.filter(v => v.status === 2).length}</p>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card shadow-sm border-info">
                    <div class="card-body">
                        <h5 class="card-title text-info">Unique Patients</h5>
                        <p class="fs-4 fw-bold">
                            ${new Set(weekVisits.map(v => v.patientMedicalRecord)).size}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;

        startNextVisitTimer(weekVisits);
    }

    function renderDashboardTable(containerId, visits) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!visits.length) {
            container.innerHTML = `<p class="text-muted">No visits</p>`;
            return;
        }

        let html = `
        <table class="table table-bordered table-hover mt-2">
            <thead class="table-light">
                <tr>
                    <th>Patient MR</th>
                    <th>Date</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

        visits.forEach(v => {
            html += `
            <tr>
                <td>${v.patientMedicalRecord}</td>
                <td>${new Date(v.visitDate).toLocaleString()}</td>
                <td>${VisitStatusMap[v.status] ?? "Unknown"}</td>
            </tr>
        `;
        });

        html += "</tbody></table>";
        container.innerHTML = html;
    }

    function startNextVisitTimer(visits) {
        const nextDiv = document.getElementById("next-visit-timer");
        if (!nextDiv) return;
        const futureVisits = visits.filter(v => new Date(v.visitDate) > new Date());
        if (futureVisits.length === 0) {
            nextDiv.innerHTML = "No upcoming visits";
            return;
        }
        const nextVisit = new Date(futureVisits.sort((a, b) => new Date(a.visitDate) - new Date(b.visitDate))[0].visitDate);

        function updateTimer() {
            const diff = nextVisit - new Date();
            if (diff <= 0) {
                nextDiv.innerHTML = "Next visit now!";
                clearInterval(interval);
                return;
            }
            const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000),
                s = Math.floor((diff % 60000) / 1000);
            nextDiv.innerHTML = `Next visit in: ${h}h ${m}m ${s}s`;
        }

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
    }

    // ===== VISITS =====
    let visitsData = [];

    async function loadVisits() {
        const res = await authFetch("/specialist/visits");
        if (!res || !res.ok) return;
        visitsData = await res.json();
        renderVisitsTable(visitsData);
    }

    function renderVisitsTable(data) {
        const container = document.getElementById("visits-table-container");
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = "<p>No visits found</p>";
            return;
        }
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Date</th><th>Patient MR</th><th>Diagnosis</th><th>Status</th><th>Cost</th><th>Actions</th>
            </tr></thead><tbody>`;
        data.forEach(v => {
            html += `<tr>
                <td>${new Date(v.visitDate).toLocaleString()}</td>
                <td>${v.patientMedicalRecord}</td>
                <td>${v.diagnosis}</td>
                <td>${VisitStatusMap[v.status] ?? "Unknown"}</td>
                <td>${v.serviceCost + v.medicationCost}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-visit" data-id="${v.id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-cancel-visit" data-id="${v.id}">Cancel</button>
                </td>
            </tr>`;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
    }

    document.getElementById("apply-visit-filters")
        ?.addEventListener("click", applyVisitFilters);

    function renderVisitsTable(data) {
        const container = document.getElementById("visits-table-container");
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = "<p>No visits found</p>";
            return;
        }
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Date</th><th>Patient MR</th><th>Diagnosis</th><th>Status</th><th>Cost</th><th>Actions</th>
            </tr></thead><tbody>`;
        data.forEach(v => {
            html += `<tr>
                <td>${new Date(v.visitDate).toLocaleString()}</td>
                <td>${v.patientMedicalRecord}</td>
                <td>${v.diagnosis}</td>
                <td>${VisitStatusMap[v.status] ?? "Unknown"}</td>
                <td>${v.serviceCost + v.medicationCost}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-visit" data-id="${v.id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-cancel-visit" data-id="${v.id}">Cancel</button>
                </td>
            </tr>`;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
    }

    document.getElementById("apply-visit-filters")
        ?.addEventListener("click", applyVisitFilters);

    function applyVisitFilters() {
        let filtered = [...visitsData];

        const search = document.getElementById("visit-patient-search").value.trim().toLowerCase();
        const dateFrom = document.getElementById("visit-date-from").value;
        const dateTo = document.getElementById("visit-date-to").value;
        const status = document.getElementById("visit-status-filter").value;

        // ==== SEARCH BY MR ====
        if (search) {
            filtered = filtered.filter(v =>
                (String(v.patientMedicalRecord || "")).toLowerCase().includes(search)
            );
        }

        // ==== DATE FROM ====
        if (dateFrom) {
            const from = new Date(dateFrom);
            filtered = filtered.filter(v => new Date(v.visitDate) >= from);
        }

        // ==== DATE TO ====
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            filtered = filtered.filter(v => new Date(v.visitDate) <= to);
        }

        // ==== STATUS ====
        if (status !== "") {
            filtered = filtered.filter(v => v.status == status);
        }

        renderVisitsTable(filtered);
    }

    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("btn-edit-visit")) {
            const id = e.target.dataset.id;

            const res = await authFetch(`/specialist/visits/${id}`);
            if (!res.ok) return alert("Error loading visit");

            const v = await res.json();

            document.getElementById("edit-visit-id").value = v.id;
            document.getElementById("edit-diagnosis").value = v.diagnosis || "";
            document.getElementById("edit-service-cost").value = v.serviceCost;
            document.getElementById("edit-medication-cost").value = v.medicationCost;

            document.getElementById("edit-status").value = v.status;

            // convert date to datetime-local format
            let dt = new Date(v.visitDate);
            document.getElementById("edit-visit-date").value =
                dt.toISOString().slice(0, 16);

            new bootstrap.Modal(document.getElementById("editVisitModal")).show();
        }
    });

    document.getElementById("save-visit-changes")
        .addEventListener("click", async () => {
            const id = document.getElementById("edit-visit-id").value;

            const dto = {
                Anamnesis: "", // якщо в тебе немає поля, залиш пустим
                Diagnosis: document.getElementById("edit-diagnosis").value,
                Treatment: "", // якщо немає поля в формі
                Recommendations: "", // якщо немає поля в формі
                ServiceCost: Number(document.getElementById("edit-service-cost").value) || 0,
                MedicationCost: Number(document.getElementById("edit-medication-cost").value) || 0,
                Status: document.getElementById("edit-status").value
            };

            try {
                const res = await authFetch(`/specialist/visits/${id}`, {
                    method: "PUT",
                    body: JSON.stringify(dto)
                });

                if (!res.ok) {
                    const text = await res.text();
                    alert("Update failed: " + text);
                    return;
                }

                bootstrap.Modal.getInstance(
                    document.getElementById("editVisitModal")
                ).hide();

                await loadVisits();

            } catch (err) {
                alert("Error: " + err.message);
            }
        });


    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("btn-cancel-visit")) {
            document.getElementById("cancel-visit-id").value = e.target.dataset.id;
            new bootstrap.Modal(document.getElementById("cancelVisitModal")).show();
        }
    });

    document.getElementById("confirm-cancel-visit")
        .addEventListener("click", async () => {

            const id = document.getElementById("cancel-visit-id").value;

            const res = await authFetch(`/specialist/visits/${id}/status`, {
                method: "PATCH",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({status: 3}) // 3 = Cancelled
            });

            if (!res.ok) {
                alert("Cancel failed");
                return;
            }

            bootstrap.Modal.getInstance(
                document.getElementById("cancelVisitModal")
            ).hide();

            await loadVisits();
        });

    // ===== PAYMENTS =====
    let paymentsData = [];

    async function loadPayments() {
        const res = await authFetch("/specialist/payments");
        if (!res || !res.ok) return;
        paymentsData = await res.json();
        renderPaymentsTable(paymentsData);
    }

    function renderPaymentsTable(data) {
        const container = document.getElementById("payments-table-container");
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = "<p>No payments found</p>";
            return;
        }
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Patient MR</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Issued Date</th>
            <th>Due Date</th><th>Last PaymentDate</th><th>Status</th><th>Actions</th>
            
            </tr></thead><tbody>`;
        data.forEach(p => {
            const remaining = (p.totalAmount || p.amount) - (p.paidAmount || 0);
            html += `<tr>
                <td>${p.patientMedicalRecord}</td>
                <td>${p.totalAmount || p.amount}</td>
                <td>${p.paidAmount || 0}</td>
                <td>${remaining}</td>
                <td>${p.issuedDate}</td>
                <td>${p.issuedDate}</td>
                <td>${p.lastPaymentDate}</td>
                <td>${PaymentStatusMap[p.status] ?? "Unknown"}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-payment" data-id="${p.id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-cancel-payment" data-id="${p.id}">Cancel</button>
                </td>
            </tr>`;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
    }

    document.getElementById("apply-payment-filters").addEventListener("click", applyPaymentFilters);

    function applyPaymentFilters() {
        let filtered = [...paymentsData];

        const patientSearch = (document.getElementById("payment-patient-filter").value || "")
            .toLowerCase();

        const dateFrom = document.getElementById("payment-issued-from").value;
        const dateTo = document.getElementById("payment-issued-to").value;

        const totalMin = parseFloat(document.getElementById("payment-total-min")?.value || "");
        const totalMax = parseFloat(document.getElementById("payment-total-max")?.value || "");

        const status = document.getElementById("payment-status-filter")?.value || "";

        // ---------- Patient MR search ----------
        if (patientSearch) {
            filtered = filtered.filter(p =>
                String(p.patientMedicalRecord || "").toLowerCase().includes(patientSearch)
            );
        }

        // ---------- Issued Date ----------
        if (dateFrom) {
            const from = new Date(dateFrom);
            filtered = filtered.filter(v => new Date(v.p.issuedDate) >= from);
            // filtered = filtered.filter(p => p.issuedDate >= dateFrom);
        }
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            filtered = filtered.filter(v => new Date(v.visitDate) <= to);
            // filtered = filtered.filter(p => p.issuedDate <= dateTo);
        }

        // ---------- Total Amount Min/Max ----------
        if (!isNaN(totalMin)) {
            filtered = filtered.filter(p => (p.totalAmount || p.amount || 0) >= totalMin);
        }
        if (!isNaN(totalMax)) {
            filtered = filtered.filter(p => (p.totalAmount || p.amount || 0) <= totalMax);
        }

        // ---------- Status ----------
        if (status !== "") {
            filtered = filtered.filter(p => String(p.status) === status);
        }

        renderPaymentsTable(filtered);
    }

    // ===== PATIENTS =====
    let patientsData = [];

    async function loadPatients() {
        const res = await authFetch("/specialist/patients");
        if (!res || !res.ok) return;
        patientsData = await res.json();
        renderPatientsTable(patientsData);
    }

    function renderPatientsTable(data) {
        const container = document.getElementById("patients-table-container");
        if (!container) return;
        if (data.length === 0) {
            container.innerHTML = "<p>No patients found</p>";
            return;
        }
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Full Name</th><th>Phone</th><th>Address</th><th>DOB</th><th>Medical Record</th><th>Actions</th>
            </tr></thead><tbody>`;
        data.forEach(p => {
            html += `<tr>
                <td>${p.fullName}</td>
                <td>${p.phone}</td>
                <td>${p.address}</td>
                <td>${p.dateOfBirth}</td>
                <td>${p.medicalRecordNumber}</td>
                <td><button class="btn btn-sm btn-primary btn-add-visit-patient" data-mr="${p.medicalRecordNumber}">
                    Add Visit
                </button></td>
            </tr>`;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
    }

    document.getElementById("apply-patient-filters")
        ?.addEventListener("click", applyPatientFilters);

    function applyPatientFilters() {
        let filtered = [...patientsData];

        const surname = document.getElementById("patient-surname-filter").value.trim().toLowerCase();

        const birthFrom = document.getElementById("patient-birth-from").value;
        const birthTo = document.getElementById("patient-birth-to").value;

        // ==== FILTER BY SURNAME ====
        if (surname) {
            filtered = filtered.filter(p =>
                p.fullName?.toLowerCase().split(" ")[0]?.includes(surname)
            );
        }

        // ==== BIRTH DATE FROM ====
        if (birthFrom) {
            const from = new Date(birthFrom);
            filtered = filtered.filter(p => new Date(p.dateOfBirth) >= from);
        }

        // ==== BIRTH DATE TO ====
        if (birthTo) {
            const to = new Date(birthTo);
            to.setHours(23, 59, 59);
            filtered = filtered.filter(p => new Date(p.dateOfBirth) <= to);
        }

        renderPatientsTable(filtered);
    }


    // ===== LOGOUT =====
    document.getElementById("btn-logout")?.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/guest.html";
    });

    // AUTOLOAD DASHBOARD
    loadDashboard();

});
