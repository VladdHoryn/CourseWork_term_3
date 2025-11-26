import {authFetch, getToken, getUserRole} from "./auth.js";

const AdminPaymentStatusMap = {
    0: "Pending",
    1: "Paid",
    2: "PartiallyPaid",
    3: "Overdue",
    4: "Cancelled"
};
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
                case "mongo":
                    loadMongoQueries();
                    break;
                    case "logs":
                        loadLogs();
                    break;
            }
        });
    });

    // -------------------- Mongo Queries Loader --------------------
    function loadMongoQueries() {
        document.getElementById("mongo-collection").value = "";
        document.getElementById("mongo-operation").value = "find";
        document.getElementById("mongo-filter").value = "";
        document.getElementById("mongo-document").value = "";
        document.getElementById("mongo-result").innerHTML = "";
    }

    // -------------------- Mongo Queries --------------------
    document.getElementById("btnRunMongo").addEventListener("click", async () => {
        const collection = document.getElementById("mongo-collection").value.trim();
        const operation = document.getElementById("mongo-operation").value;
        const filterInput = document.getElementById("mongo-filter").value.trim();
        const docInput = document.getElementById("mongo-document").value.trim();

        if (!collection) {
            alert("Collection name is required");
            return;
        }

        let filter = {};
        let document = {};

        try {
            if (filterInput) filter = JSON.parse(filterInput);
            if (docInput) document = JSON.parse(docInput);
        } catch (err) {
            alert("Invalid JSON in filter or document");
            return;
        }

        try {
            const res = await authFetch("/administrator/mongo/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    CollectionName: collection,
                    Operation: operation,
                    Filter: Object.keys(filter).length ? filter : null,
                    Document: Object.keys(document).length ? document : null
                })
            });

            const result = await res.json();
            const container = document.getElementById("mongo-result");

            if (res.ok) {
                container.innerHTML = `<pre>${JSON.stringify(result, null, 2)}</pre>`;
            } else {
                container.innerHTML = `<div class="alert alert-danger">Error: ${result.error || JSON.stringify(result)}</div>`;
            }
        } catch (err) {
            console.error(err);
            document.getElementById("mongo-result").innerHTML = `<div class="alert alert-danger">Request failed: ${err.message}</div>`;
        }
    });

    
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

            // Додаємо клік для всіх dashboard-box, включно з новим Logs
            document.querySelectorAll(".dashboard-box").forEach(box => {
                box.addEventListener("click", () => {
                    const tab = box.getAttribute("data-tab");
                    const switchBtn = document.querySelector(`button[data-tab="${tab}"]`);
                    if (switchBtn) switchBtn.click();
                });
            });
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні Dashboard.");
        }
    }

    let payments = [];
    let deletePaymentId = null;

    async function loadPayments() {
        const res = await authFetch("/administrator/payments");
        payments = res.ok ? await res.json() : [];
        renderPaymentsTable();
    }

    function renderPaymentsTable(data = payments) {
        const container = document.getElementById("payments-table-container");

        if (!data || data.length === 0) {
            container.innerHTML = "<p>No payments found</p>";
            return;
        }

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

        data.forEach(p => {
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

    document.getElementById("apply-payment-filters")?.addEventListener("click", () => {
        let filtered = [...payments];

        const patientSearch = (document.getElementById("payment-patient-filter").value || "").toLowerCase();
        const totalMin = parseFloat(document.getElementById("payment-total-min")?.value || "");
        const totalMax = parseFloat(document.getElementById("payment-total-max")?.value || "");
        const dateFrom = document.getElementById("payment-issued-from").value;
        const dateTo = document.getElementById("payment-issued-to").value;
        const status = document.getElementById("payment-status-filter")?.value || "";

        if (patientSearch)
            filtered = filtered.filter(p => String(p.patientMedicalRecord).toLowerCase().includes(patientSearch));

        if (!isNaN(totalMin))
            filtered = filtered.filter(p => (p.totalAmount || 0) >= totalMin);

        if (!isNaN(totalMax))
            filtered = filtered.filter(p => (p.totalAmount || 0) <= totalMax);

        if (dateFrom)
            filtered = filtered.filter(p => new Date(p.issuedDate) >= new Date(dateFrom));

        if (dateTo) {
            let to = new Date(dateTo);
            to.setHours(23, 59, 59);
            filtered = filtered.filter(p => new Date(p.issuedDate) <= to);
        }

        if (status !== "")
            filtered = filtered.filter(p => p.status === status);

        renderPaymentsTable(filtered);
    });

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
            form.issuedDate.value = payment.issuedDate ? new Date(payment.issuedDate).toISOString().slice(0, 16) : "";
            form.dueDate.value = payment.dueDate ? new Date(payment.dueDate).toISOString().slice(0, 16) : "";
            form.lastPaymentDate.value = payment.lastPaymentDate ? new Date(payment.lastPaymentDate).toISOString().slice(0, 16) : "";
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
            const res = await authFetch("/administrator/payments", {
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
            const visitsRes = await authFetch("/administrator/visits");
            const visits = await visitsRes.json();

            visitSelect.innerHTML = "<option disabled selected>Select Visit</option>";
            visits.forEach(v => {
                const op = document.createElement("option");
                op.value = v.id;
                op.textContent = `${v.visitDate} — VisitID: ${v.id}`;
                op.dataset.patient = v.patientMedicalRecord;
                visitSelect.appendChild(op);
            });
            
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

        const paymentId = form.id.value;

        const res = await authFetch(`/administrator/payments/${paymentId}`, {
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

        const res = await authFetch(`/administrator/payments/${deletePaymentId}`, {method: "DELETE"});

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById("modalDeletePayment")).hide();
            loadPayments();
        } else {
            alert("Failed to delete payment");
        }
    });

    async function loadRequests() {
        try {
            const res = await authFetch("/administrator/pending");
            if (!res.ok) throw new Error("Failed to load requests");

            const requests = await res.json();
            const container = document.getElementById("requests-table-container");

            if (requests.length === 0) {
                container.innerHTML = `<p class="text-muted">No pending registration requests.</p>`;
                return;
            }

            let html = `
            <table class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Full Name</th>
                        <th>Phone</th>
                        <th>Address</th>
                        <th style="width: 180px;">Actions</th>
                    </tr>
                </thead>
                <tbody>
        `;

            requests.forEach(r => {
                html += `
                    <tr>
                        <td>${r.userName}</td>
                        <td>${r.fullName ?? "-"}</td>
                        <td>${r.phone ?? "-"}</td>
                        <td>${r.address ?? "-"}</td>
                        <td>
                            <button class="btn btn-success btn-sm btn-approve" data-id="${r.id}">Accept</button>
                            <button class="btn btn-danger btn-sm btn-reject ms-1" data-id="${r.id}">Reject</button>
                        </td>
                    </tr>
                `;
            });

            html += `</tbody></table>`;
            container.innerHTML = html;

            container.querySelectorAll(".btn-approve").forEach(b =>
                b.addEventListener("click", () => approveRequest(b.dataset.id))
            );
            container.querySelectorAll(".btn-reject").forEach(b =>
                b.addEventListener("click", () => rejectRequest(b.dataset.id))
            );

        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні запитів.");
        }
    }

    // =======================
// GLOBAL CHART VARIABLES
// =======================
    let statsChart = null;
    let avgPatientsChart = null;
    let revenueChart = null;
    let medPaymentsChart = null;
    let specialistsLoaded = false;

// =======================
// SYSTEM STATISTICS
// =======================
    async function loadStatistics() {
        try {
            const startInput = document.getElementById("statsStart").value;
            const endInput = document.getElementById("statsEnd").value;
            const start = startInput ? new Date(startInput) : new Date(Date.now() - 30*24*60*60*1000);
            const end = endInput ? new Date(endInput) : new Date();

            const res = await authFetch(`/administrator/statistics?start=${start.toISOString()}&end=${end.toISOString()}`);
            if (!res.ok) throw new Error("Failed to load statistics");

            const stats = await res.json();
            document.getElementById("statistics-container").innerHTML = `
            <div class="alert alert-info">
                <strong>Total Users:</strong> ${stats.totalUsers}<br>
                <strong>Total Visits:</strong> ${stats.totalVisits}<br>
                <strong>Total Payments:</strong> ${stats.totalPayments}<br>
                <strong>Total Revenue:</strong> ${stats.totalRevenue}
            </div>
        `;
            renderStatisticsChart(stats);
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні статистики.");
        }
    }

    function renderStatisticsChart(stats) {
        const ctx = document.getElementById("statsChart");
        if (statsChart) statsChart.destroy();
        statsChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Users", "Visits", "Payments", "Revenue"],
                datasets: [{ label: "System Statistics", data: [stats.totalUsers, stats.totalVisits, stats.totalPayments, stats.totalRevenue] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }

    document.getElementById("btnApplyStats")?.addEventListener("click", loadStatistics);

// =======================
// LOAD SPECIALISTS AND SPECIALTIES
// =======================
    async function loadSpecialistsAndSpecialties() {
        if (specialistsLoaded) return;
        try {
            const res = await authFetch("/administrator/specialists");
            if (!res.ok) throw new Error("Failed to load specialists");

            const specialists = await res.json();
            const specSelect = document.getElementById("avgSpecId");
            const typeSelect = document.getElementById("avgSpecType");
            const revenueSelect = document.getElementById("revSpecId");

            specSelect.innerHTML = `<option value="">-- All Specialists --</option>`;
            typeSelect.innerHTML = `<option value="">-- All Specialties --</option>`;
            revenueSelect.innerHTML = `<option value="">-- Select Specialist --</option>`;

            specialists.forEach(s => {
                const opt1 = document.createElement("option"); opt1.value = s.id; opt1.textContent = `${s.fullName} (${s.speciality})`; specSelect.appendChild(opt1);
                const opt2 = document.createElement("option"); opt2.value = s.id; opt2.textContent = `${s.fullName} (${s.speciality})`; revenueSelect.appendChild(opt2);
            });

            [...new Set(specialists.map(s => s.speciality).filter(x => x))].forEach(t => {
                const opt = document.createElement("option"); opt.value = t; opt.textContent = t; typeSelect.appendChild(opt);
            });

            specialistsLoaded = true;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні спеціалістів.");
        }
    }

// =======================
// AVERAGE PATIENTS
// =======================
    async function loadAveragePatients() {
        try {
            const specialistId = document.getElementById("avgSpecId").value.trim();
            const specialty = document.getElementById("avgSpecType").value.trim();
            let url = `/administrator/statistics/avg-patients`;
            const params = [];
            if (specialistId) params.push(`specialistId=${specialistId}`);
            if (specialty) params.push(`specialty=${encodeURIComponent(specialty)}`);
            if (params.length) url += `?${params.join("&")}`;

            const res = await authFetch(url);
            if (!res.ok) throw new Error("Failed to load average patients");

            const data = await res.json();
            const resultBox = document.getElementById("avg-patients-result");
            resultBox.classList.remove("d-none");
            resultBox.innerHTML = `
            <strong>Specialist ID:</strong> ${data.specialistId || "-"}<br>
            <strong>Specialty:</strong> ${data.specialty || "-"}<br>
            <strong>Average Patients Per Day:</strong> <span class="text-primary">${data.averagePatientsPerDay}</span>
        `;
            renderAvgPatientsChart(data.averagePatientsPerDay);
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні середньої кількості пацієнтів.");
        }
    }

    function renderAvgPatientsChart(value) {
        const ctx = document.getElementById("avgPatientsChart");
        if (avgPatientsChart) avgPatientsChart.destroy();
        avgPatientsChart = new Chart(ctx, {
            type: "bar",
            data: { labels: ["Average Patients Per Day"], datasets: [{ label: "Patients", data: [value] }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    document.getElementById("btnLoadAvgPatients")?.addEventListener("click", loadAveragePatients);

// =======================
// REVENUE
// =======================
    async function loadRevenue() {
        try {
            const specialistId = document.getElementById("revSpecId").value;
            const start = document.getElementById("revStart").value;
            const end = document.getElementById("revEnd").value;
            if (!specialistId || !start || !end) return alert("Будь ласка, оберіть спеціаліста та обидві дати.");

            const res = await authFetch(`/administrator/statistics/revenue?specialistId=${specialistId}&start=${start}&end=${end}`);
            if (!res.ok) throw new Error("Failed to load revenue");

            const data = await res.json();
            const resultBox = document.getElementById("revenue-result");
            resultBox.classList.remove("d-none");
            resultBox.innerHTML = `
            <strong>Specialist ID:</strong> ${data.specialistId}<br>
            <strong>Period:</strong> ${data.start.split("T")[0]} — ${data.end.split("T")[0]}<br>
            <strong>Revenue:</strong> <span class="text-success fw-bold">${data.revenue} грн</span>
        `;
            renderRevenueChart(data.revenue);
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні виручки.");
        }
    }

    function renderRevenueChart(value) {
        const ctx = document.getElementById("revenueChart");
        if (revenueChart) revenueChart.destroy();
        revenueChart = new Chart(ctx, {
            type: "bar",
            data: { labels: ["Revenue"], datasets: [{ label: "UAH", data: [value] }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    document.getElementById("btnLoadRevenue")?.addEventListener("click", loadRevenue);

// =======================
// MEDICATION PAYMENTS
// =======================
    async function loadPatientsForMedPayments() {
        try {
            const res = await authFetch("/administrator/patients");
            if (!res.ok) throw new Error("Failed to load patients");
            const patients = await res.json();
            const select = document.getElementById("medPatientId");
            select.innerHTML = `<option value="">-- Select Patient --</option>`;
            patients.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.medicalRecordNumber;
                opt.textContent = `${p.fullName} (Record: ${p.medicalRecordNumber})`;
                select.appendChild(opt);
            });
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні пацієнтів.");
        }
    }

    async function loadMedicationPayments() {
        try {
            const patientRecord = document.getElementById("medPatientId").value;
            const start = document.getElementById("medStart").value;
            const end = document.getElementById("medEnd").value;
            if (!patientRecord || !start || !end) return alert("Будь ласка, оберіть пацієнта та дати.");

            const body = { PatientMedicalRecord: parseInt(patientRecord), Start: new Date(start).toISOString(), End: new Date(end).toISOString() };
            const res = await authFetch("/administrator/statistics/patient-medications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
            if (!res.ok) throw new Error("Failed to load medication payments");
            const data = await res.json();

            const resultBox = document.getElementById("med-payments-result");
            resultBox.classList.remove("d-none");
            resultBox.innerHTML = `
            <strong>Patient Record:</strong> ${data.patientMedicalRecord}<br>
            <strong>Period:</strong> ${data.start.split("T")[0]} — ${data.end.split("T")[0]}<br>
            <strong>Total Medication Payments:</strong> <span class="text-success">${data.totalMedicationPayments} грн</span>
        `;
            renderMedPaymentsChart(data.totalMedicationPayments);
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні оплати за ліки.");
        }
    }

    function renderMedPaymentsChart(value) {
        const ctx = document.getElementById("medPaymentsChart");
        if (medPaymentsChart) medPaymentsChart.destroy();
        medPaymentsChart = new Chart(ctx, {
            type: "bar",
            data: { labels: ["Medication Payments"], datasets: [{ label: "Payments (грн)", data: [value], backgroundColor: "#17a2b8" }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
    }

    document.getElementById("btnLoadMedPayments")?.addEventListener("click", loadMedicationPayments);

    // =======================
// TOTAL PATIENT COST PER YEAR
// =======================
    async function loadPatientsForTotalCost() {
        try {
            const res = await authFetch("/administrator/patients");
            if (!res.ok) throw new Error("Failed to load patients");
            const patients = await res.json();
            const select = document.getElementById("costPatientId");
            select.innerHTML = `<option value="">-- Select Patient --</option>`;
            patients.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.medicalRecordNumber;
                opt.textContent = `${p.fullName} (Record: ${p.medicalRecordNumber})`;
                select.appendChild(opt);
            });
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні пацієнтів.");
        }
    }

    async function loadTotalPatientCost() {
        try {
            const patientRecord = document.getElementById("costPatientId").value;
            const year = document.getElementById("costYear").value;
            if (!patientRecord || !year) return alert("Будь ласка, оберіть пацієнта та рік.");

            const res = await authFetch(`/administrator/statistics/patient-total-cost?patientRecord=${patientRecord}&year=${year}`);
            if (!res.ok) throw new Error("Failed to load patient total cost");
            const data = await res.json();

            const resultBox = document.getElementById("patient-cost-result");
            resultBox.classList.remove("d-none");
            resultBox.innerHTML = `
            <strong>Patient Record:</strong> ${data.patientMedicalRecord}<br>
            <strong>Year:</strong> ${year}<br>
            <strong>Total Cost:</strong> <span class="text-secondary fw-bold">${data.totalCost} грн</span>
        `;

            renderPatientCostChart(data.monthlyCosts);
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні загальної вартості пацієнта.");
        }
    }

    let patientCostChart = null;

    function renderPatientCostChart(monthlyCosts) {
        const ctx = document.getElementById("patientCostChart");
        
        if (patientCostChart) {
            patientCostChart.destroy();
        }
        
        patientCostChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
                datasets: [{ label: "Cost (грн)", data: monthlyCosts, backgroundColor: "#6c757d" }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    document.getElementById("btnLoadPatientCost")?.addEventListener("click", loadTotalPatientCost);

// =======================
// TAB SWITCHING LOGIC
// =======================
    document.querySelectorAll("#statsTabs button").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.block;
            document.querySelectorAll("#statsTabs button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.querySelectorAll(".stats-block").forEach(block => block.classList.add("d-none"));
            const targetBlock = document.getElementById(targetId);
            if (targetBlock) targetBlock.classList.remove("d-none");
        });
    });

// =======================
// INITIAL LOAD ON STATISTICS TAB
// =======================
    document.querySelector('[data-tab="statistics"]')?.addEventListener("click", () => {
        loadSpecialistsAndSpecialties();
        loadPatientsForMedPayments();
        loadPatientsForTotalCost();
    });

    async function loadPatientsBySpecialty() {
        try {
            const specialty = document.getElementById("profileSpecialty").value.trim();
            if (!specialty) return alert("Будь ласка, оберіть спеціальність.");

            const res = await authFetch(`/administrator/statistics/patients-by-profile?specialty=${encodeURIComponent(specialty)}`);
            if (!res.ok) throw new Error("Failed to load patients");

            const patients = await res.json();
            const container = document.getElementById("patientsByProfileResult");
            container.classList.remove("d-none");

            if (!patients.length) {
                container.innerHTML = "No patients found for this specialty.";
                return;
            }

            container.innerHTML = `<ul>${patients.map(p => `<li>${p.fullName} (Record: ${p.medicalRecordNumber})</li>`).join("")}</ul>`;
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні пацієнтів за спеціальністю.");
        }
    }

    document.getElementById("btnLoadPatientsByProfile")?.addEventListener("click", loadPatientsBySpecialty);
    
    function loadSpecialtiesForPatientsByProfile() {
        const typeSelect = document.getElementById("profileSpecialty");
        typeSelect.innerHTML = `<option value="">-- Select Specialty --</option>`;

        authFetch('/administrator/specialists')
            .then(res => {
                if (!res.ok) throw new Error("Failed to load specialties");
                return res.json();
            })
            .then(specialists => {
                if (!specialists || !specialists.length) return;

                const specialties = [...new Set(specialists.map(s => s.speciality).filter(s => s))];
                specialties.forEach(s => {
                    const opt = document.createElement("option");
                    opt.value = s;
                    opt.textContent = s;
                    typeSelect.appendChild(opt);
                });

                if (specialties.length > 0) {
                    document.getElementById("patientsBySpecialistBlock").classList.remove("d-none");
                }
            })
            .catch(err => console.error("Error loading specialties:", err));
    }

    function loadPatientsBySpecialistProfile() {
        const specialty = document.getElementById("profileSpecialty").value;
        const resultBlock = document.getElementById("patientsByProfileResult");

        if (!specialty) {
            resultBlock.classList.remove("d-none");
            resultBlock.classList.add("alert-warning");
            resultBlock.classList.remove("alert-secondary");
            resultBlock.textContent = "Please select a specialty.";
            return;
        }

        fetch(`/api/admin/statistics/patients-by-profile?specialty=${encodeURIComponent(specialty)}`)
            .then(res => res.json())
            .then(patients => {
                resultBlock.classList.remove("d-none");
                resultBlock.classList.remove("alert-warning");
                resultBlock.classList.add("alert-secondary");

                if (!patients || patients.length === 0) {
                    resultBlock.textContent = "No patients found for this specialty.";
                    return;
                }
                
                let html = `<table class="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Full Name</th>
                                    <th>Medical Record</th>
                                    <th>Phone</th>
                                    <th>Address</th>
                                </tr>
                            </thead>
                            <tbody>`;

                patients.forEach((p, index) => {
                    html += `<tr>
                            <td>${index + 1}</td>
                            <td>${p.fullName ?? "-"}</td>
                            <td>${p.medicalRecordNumber ?? "-"}</td>
                            <td>${p.phone ?? "-"}</td>
                            <td>${p.address ?? "-"}</td>
                         </tr>`;
                });

                html += `</tbody></table>`;
                resultBlock.innerHTML = html;
            })
            .catch(err => {
                console.error(err);
                resultBlock.classList.remove("d-none");
                resultBlock.classList.add("alert-danger");
                resultBlock.textContent = "Error loading patients. Check console for details.";
            });
    }

    document.addEventListener("DOMContentLoaded", () => {
        loadSpecialtiesForPatientsByProfile();

        document.getElementById("btnLoadPatientsByProfile")
            .addEventListener("click", loadPatientsBySpecialistProfile);
    });
    
    loadSpecialtiesForPatientsByProfile();
    // =====================================================================
//                            USERS CRUD
// =====================================================================

    let users = [];
    let filteredUsers = [];
    let userSort = { field: null, asc: true };

    async function loadUsers() {
        try {
            const res = await authFetch("/administrator/users");
            users = res.ok ? await res.json() : [];
            applyUsersFilters();
        } catch (err) {
            console.error(err);
            alert("Помилка при завантаженні користувачів.");
        }
    }

    function applyUsersFilters() {
        const search = document.getElementById("search-users").value.trim().toLowerCase();
        const role = document.getElementById("filter-role").value;

        const dateFrom = document.getElementById("filter-date-from")?.value;
        const dateTo = document.getElementById("filter-date-to")?.value;

        let data = [...users];

        // ----- ROLE FILTER -----
        if (role !== "") {
            const targetRole = roleMap[role];
            data = data.filter(u => Number(u.userRole) === targetRole);
        }

        // ----- SEARCH -----
        if (search) {
            data = data.filter(u => {
                const searchTarget = [
                    u.fullName,
                    u.userName,
                    u.phone,
                    u.address,
                    u.speciality,
                    u.medicalRecordNumber
                ].join(" ").toLowerCase();

                return searchTarget.includes(search);
            });
        }

        // ----- REGISTRATION DATE FROM -----
        if (dateFrom) {
            const from = new Date(dateFrom);
            data = data.filter(u => new Date(u.createdAt) >= from);
        }

        // ----- REGISTRATION DATE TO -----
        if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59);
            data = data.filter(u => new Date(u.createdAt) <= to);
        }

        // Save + sort
        filteredUsers = data;

        if (userSort.field) {
            filteredUsers.sort((a, b) => {
                let x = a[userSort.field];
                let y = b[userSort.field];

                if (typeof x === "string") x = x.toLowerCase();
                if (typeof y === "string") y = y.toLowerCase();

                if (x < y) return userSort.asc ? -1 : 1;
                if (x > y) return userSort.asc ? 1 : -1;
                return 0;
            });
        }

        renderUsersTable();
    }


    function renderUsersTable() {
        const container = document.getElementById("users-table-container");

        if (!filteredUsers.length) {
            container.innerHTML = "<p class='text-muted'>No users found</p>";
            return;
        }

        const columns = new Set();
        filteredUsers.forEach(u => Object.keys(u).forEach(k => columns.add(k)));
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
            const arrow = (userSort.field === c) ? (userSort.asc ? "▲" : "▼") : "";
            html += `<th class="sortable" data-field="${c}" style="cursor:pointer">${c} ${arrow}</th>`;
        });

        html += `<th>Actions</th></tr></thead><tbody>`;

        filteredUsers.forEach(user => {
            html += `<tr>`;
            colArray.forEach(c => {
                let val = user[c];

                if (c.toLowerCase().includes("date") && val)
                    val = new Date(val).toISOString().split("T")[0];

                html += `<td>${val ?? "-"}</td>`;
            });

            html += `
            <td>
                <button class="btn btn-sm btn-warning btn-edit-user" data-id="${user.id}">Edit</button>
                <button class="btn btn-sm btn-danger btn-delete-user" data-id="${user.id}">Delete</button>
            </td>
        </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

        bindEditUserButtons();
        bindDeleteUserButtons();
        bindUsersSorting();
    }

    function bindUsersSorting() {
        document.querySelectorAll("#users-table-container th.sortable").forEach(th => {
            th.addEventListener("click", () => {
                const field = th.dataset.field;

                if (userSort.field === field) {
                    userSort.asc = !userSort.asc;
                } else {
                    userSort.field = field;
                    userSort.asc = true;
                }

                applyUsersFilters();
            });
        });
    }

    document.getElementById("apply-users-filters")?.addEventListener("click", applyUsersFilters);

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
        roleFieldsContainer.innerHTML = "";

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
            userRole: roleMap[form.role.value]
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
            PasswordHash: user.passwordHash
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
let filteredVisits = [];
let sortColumn = null;
let sortAsc = true;

const VisitStatusMap = {
    "Scheduled": "Scheduled",
    "InProgress": "In Progress",
    "Completed": "Completed",
    "Cancelled": "Cancelled",
    "NoShow": "No Show"
};

// -------------------- Load Visits --------------------
async function loadVisits() {
    try {
        const res = await authFetch("/administrator/visits");
        adminVisits = res.ok ? await res.json() : [];
        filteredVisits = [...adminVisits];
        renderVisitsTable(filteredVisits);
    } catch (err) {
        console.error(err);
        alert("Помилка при завантаженні візитів.");
    }
}

// -------------------- Render Table --------------------
function renderVisitsTable(data) {
    const container = document.getElementById("visits-table-container");

    if (!data.length) {
        container.innerHTML = "<p class='text-muted'>No visits found</p>";
        return;
    }

    let html = `
    <table class="table table-bordered table-hover">
        <thead>
            <tr>
                <th data-sort="id">ID</th>
                <th data-sort="patientMedicalRecord">Patient MRN</th>
                <th data-sort="specialistId">Specialist</th>
                <th data-sort="visitDate">Date</th>
                <th data-sort="status">Status</th>
                <th>First Visit</th>
                <th>Anamnesis</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
                <th>Recommendations</th>
                <th data-sort="serviceCost">Service Cost</th>
                <th data-sort="medicationCost">Medication Cost</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
    `;

    data.forEach(v => {
        html += `
            <tr>
                <td>${v.id}</td>
                <td>${v.patientMedicalRecord}</td>
                <td>${v.specialistId}</td>
                <td>${v.visitDate ? new Date(v.visitDate).toLocaleString() : "-"}</td>
                <td>${VisitStatusMap[v.status] ?? v.status}</td>
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

    // Sort handlers
    document.querySelectorAll("th[data-sort]").forEach(th =>
        th.addEventListener("click", () => applySort(th.dataset.sort))
    );

    // Edit
    document.querySelectorAll("[data-edit]").forEach(btn =>
        btn.addEventListener("click", () => {
            const visit = adminVisits.find(v => v.id == btn.dataset.edit);
            openVisitModal(visit);
        })
    );

    // Delete
    document.querySelectorAll("[data-delete]").forEach(btn =>
        btn.addEventListener("click", () => {
            deleteVisitId = btn.dataset.delete;
            bootstrap.Modal.getOrCreateInstance(
                document.getElementById("modalDeleteVisit")
            ).show();
        })
    );
}

// ---------------------- APPLY FILTERS ----------------------
const StatusFilterMap = {
    "0": "Scheduled",
    "1": "InProgress",
    "2": "Completed",
    "3": "Cancelled",
    "4": "NoShow"
};

document.getElementById("apply-visit-filters")
    ?.addEventListener("click", applyVisitFilters);

function applyVisitFilters() {
    const search = document.getElementById("visit-patient-search").value.trim().toLowerCase();
    const dateFrom = document.getElementById("visit-date-from").value;
    const dateTo = document.getElementById("visit-date-to").value;
    const status = document.getElementById("visit-status-filter").value;

    let data = [...adminVisits];

    // Search
    if (search) {
        data = data.filter(v =>
            String(v.patientMedicalRecord || "").toLowerCase().includes(search)
        );
    }

    // Date from
    if (dateFrom) {
        const from = new Date(dateFrom);
        data = data.filter(v => new Date(v.visitDate) >= from);
    }

    // Date to
    if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59);
        data = data.filter(v => new Date(v.visitDate) <= to);
    }

    // Status
    if (status !== "") {
        const mappedStatus = StatusFilterMap[status];
        data = data.filter(v => v.status === mappedStatus);
    }

    filteredVisits = data;
    renderVisitsTable(filteredVisits);
}

// ---------------------- SORTING ----------------------
function applySort(column) {
    if (sortColumn === column) {
        sortAsc = !sortAsc;
    } else {
        sortColumn = column;
        sortAsc = true;
    }

    filteredVisits.sort((a, b) => {
        let v1 = a[column];
        let v2 = b[column];

        if (column === "visitDate") {
            v1 = new Date(v1);
            v2 = new Date(v2);
        }

        if (v1 > v2) return sortAsc ? 1 : -1;
        if (v1 < v2) return sortAsc ? -1 : 1;
        return 0;
    });

    renderVisitsTable(filteredVisits);
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
document.getElementById("btnAddVisit")?.addEventListener("click", () => openVisitModal());

async function openVisitModal(visit = null) {
    await loadPatientsAndSpecialists();

    const modalId = visit ? "modalEditVisit" : "modalAddVisit";
    const modalElement = document.getElementById(modalId);
    const form = modalElement.querySelector("form");

    if (!form) return;

    // Populate dropdowns for Add
    if (!visit) {
        form.querySelector("[name='patientId']").innerHTML =
            adminPatients.map(p => `<option value="${p.id}">${p.fullName} (MRN: ${p.medicalRecordNumber})</option>`).join("");
        form.querySelector("[name='specialistId']").innerHTML =
            adminSpecialists.map(s => `<option value="${s.id}">${s.fullName} (${s.speciality})</option>`).join("");
        form.reset();
    }

    // Fill fields for Edit
    if (visit) {
        form.querySelector("[name='id']").value = visit.id;
        form.querySelector("[name='anamnesis']").value = visit.anamnesis ?? "";
        form.querySelector("[name='diagnosis']").value = visit.diagnosis ?? "";
        form.querySelector("[name='treatment']").value = visit.treatment ?? "";
        form.querySelector("[name='recommendations']").value = visit.recommendations ?? "";
        form.querySelector("[name='serviceCost']").value = visit.serviceCost ?? 0;
        form.querySelector("[name='medicationCost']").value = visit.medicationCost ?? 0;
        form.querySelector("[name='status']").value = visit.status ?? "Scheduled";
    }

    form.onsubmit = visit ? saveEditedVisit : saveNewVisit;

    bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

// -------------------- ADD VISIT --------------------
async function saveNewVisit(e) {
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

    const res = await authFetch("/administrator/visits", { method: "POST", body: JSON.stringify(dto) });

    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById("modalAddVisit")).hide();
        loadVisits();
    } else alert("Failed to create visit");
}


// ======================== SAVE EDITED VISIT (PUT) ========================
async function saveEditedVisit(e) {
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

    const id = form.querySelector("[name='id']").value;
    const res = await authFetch(`/administrator/visits/${id}`, { method: "PUT", body: JSON.stringify(dto) });

    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById("modalEditVisit")).hide();
        loadVisits();
    } else alert("Failed to update visit");
}

// ======================== DELETE VISIT ========================
document.getElementById("btnConfirmDeleteVisit")?.addEventListener("click", async () => {
    if (!deleteVisitId) return;
    const res = await authFetch(`/administrator/visits/${deleteVisitId}`, { method: "DELETE" });
    if (res.ok) {
        bootstrap.Modal.getInstance(document.getElementById("modalDeleteVisit")).hide();
        loadVisits();
    } else alert("Failed to delete visit");
});

async function approveRequest(id) {
    if (!confirm("Approve this registration?")) return;

    const res = await authFetch(`/administrator/requests/${id}/approve`, {
        method: "POST"
    });

    if (res.ok) {
        alert("Approved!");
        loadRequests();
    } else {
        alert("Error approving.");
    }
}

async function rejectRequest(id) {
    if (!confirm("Reject this registration?")) return;

    const res = await authFetch(`/administrator/requests/${id}/reject`, {
        method: "POST"
    });

    if (res.ok) {
        alert("Rejected!");
        loadRequests();
    } else {
        alert("Error rejecting.");
    }
}

async function loadLogs() {
    try {
        const res = await authFetch("/administrator/logs");
        if (!res.ok) throw new Error("Failed to load logs");

        let logs = await res.json();
        
        const userFilter = document.getElementById("logs-user-filter").value.trim().toLowerCase();
        const dateFrom = document.getElementById("logs-date-from").value;
        const dateTo = document.getElementById("logs-date-to").value;

        if (userFilter) {
            logs = logs.filter(l => l.userName.toLowerCase().includes(userFilter) || l.userId.toLowerCase().includes(userFilter));
        }
        if (dateFrom) {
            logs = logs.filter(l => new Date(l.timestamp) >= new Date(dateFrom));
        }
        if (dateTo) {
            logs = logs.filter(l => new Date(l.timestamp) <= new Date(dateTo));
        }

        const container = document.getElementById("logs-table-container");
        if (!logs.length) {
            container.innerHTML = '<div class="alert alert-secondary">No logs found</div>';
            return;
        }
        
        let html = `<table class="table table-striped table-bordered">
            <thead>
                <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody>`;

        logs.forEach(l => {
            html += `<tr>
                <td>${new Date(l.timestamp).toLocaleString()}</td>
                <td>${l.userName} (${l.userId})</td>
                <td>${l.action}</td>
                <td>${l.details}</td>
            </tr>`;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error(err);
        document.getElementById("logs-table-container").innerHTML = `<div class="alert alert-danger">Error loading logs: ${err.message}</div>`;
    }
}

// APPLY FILTER BUTTON
document.getElementById("btnApplyLogsFilter").addEventListener("click", loadLogs);

switch (tab) {
    case "logs":
        loadLogs();
        break;
}




