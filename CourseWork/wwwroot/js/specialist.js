import {authFetch} from "./auth.js";

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

        const container = document.getElementById("visits-table-container");
        if (!container) return;
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Patient MR</th><th>Date</th>
            </tr></thead><tbody>`;
        todayVisits.forEach(v => {
            html += `<tr>
                <td>${v.patientMedicalRecord}</td>
                <td>${new Date(v.visitDate).toLocaleString()}</td>
            </tr>`;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
        // document.getElementById("dashboard-today").innerHTML = `<h5>Today's Visits</h5>${
        //     todayVisits.length ? todayVisits.map(v=>`<p>${v.patientMedicalRecord} - ${new Date(v.visitDate).toLocaleString()}</p>`).join("") : "<p>No visits today</p>"
        // }`;
        document.getElementById("dashboard-week").innerHTML = `<h5>Week Visits</h5>${
            weekVisits.length ? weekVisits.map(v => `<p>${v.patientMedicalRecord} - ${new Date(v.visitDate).toLocaleString()}</p>`).join("") : "<p>No visits this week</p>"
        }`;
        document.getElementById("dashboard-stats").innerHTML = `<h5>Quick Stats</h5>
            <p>Total visits: ${weekVisits.length}</p>
            <p>Completed: ${weekVisits.filter(v => v.status === 'Completed').length}</p>
            <p>Patients: ${[...new Set(weekVisits.map(v => v.patientMedicalRecord))].length}</p>`;
        startNextVisitTimer(weekVisits);
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
                <td><span class="badge ${v.status === 'Completed' ? 'bg-success' : v.status === 'Scheduled' ? 'bg-warning' : 'bg-secondary'}">${v.status}</span></td>
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
            <th>Patient MR</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Actions</th>
            </tr></thead><tbody>`;
        data.forEach(p => {
            const remaining = (p.totalAmount || p.amount) - (p.paidAmount || 0);
            html += `<tr>
                <td>${p.patientMedicalRecord}</td>
                <td>${p.totalAmount || p.amount}</td>
                <td>${p.paidAmount || 0}</td>
                <td>${remaining}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-payment" data-id="${p.id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-cancel-payment" data-id="${p.id}">Cancel</button>
                </td>
            </tr>`;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
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
                <td><button class="btn btn-sm btn-primary btn-add-visit-patient" data-mr="${p.medicalRecord}">Add Visit</button></td>
            </tr>`;
        });
        html += "</tbody></table>";
        container.innerHTML = html;
    }

    // ===== LOGOUT =====
    document.getElementById("btn-logout")?.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/guest.html";
    });

    // AUTOLOAD DASHBOARD
    loadDashboard();

});
