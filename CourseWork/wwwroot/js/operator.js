import { authFetch } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {

    // ===== TAB SWITCH =====
    document.querySelectorAll("[data-tab]").forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab").forEach(t => t.classList.add("d-none"));
            document.getElementById(tab).classList.remove("d-none");
            document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            switch(tab){
                case "dashboard": loadDashboard(); break;
                case "visits": loadVisits(); break;
                case "payments": loadPayments(); break;
                case "clients": loadClients(); break;
            }
        });
    });

    // ===== DASHBOARD =====
    async function loadDashboard() {
        const res = await authFetch("/operator/dashboard");
        if (!res?.ok) return;

        const data = await res.json();

        renderDashboardTable("dashboard-visits-container", data.visits || []);
        renderDashboardTable("dashboard-payments-container", data.payments || []);
        document.getElementById("dashboard-stats").innerHTML = `
            <p>Total Visits: ${data.visits?.length || 0}</p>
            <p>Total Payments: ${data.payments?.length || 0}</p>
        `;
    }

    function renderDashboardTable(containerId, items) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!items.length) {
            container.innerHTML = `<p class="text-muted">No data</p>`;
            return;
        }

        let html = `<table class="table table-bordered table-hover"><thead><tr>`;
        Object.keys(items[0]).forEach(key => html += `<th>${key}</th>`);
        html += `</tr></thead><tbody>`;
        items.forEach(item => {
            html += `<tr>`;
            Object.values(item).forEach(val => html += `<td>${val}</td>`);
            html += `</tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    // ===== VISITS =====
    let visitsData = [];
    async function loadVisits() {
        const res = await authFetch("/operator/visits");
        if (!res?.ok) return;
        visitsData = await res.json();
        renderVisitsTable(visitsData);
    }

    function renderVisitsTable(data) {
        const container = document.getElementById("visits-table-container");
        if (!container) return;
        if (!data.length) { container.innerHTML = "<p>No visits found</p>"; return; }

        let html = `<table class="table table-bordered table-hover"><thead><tr>`;
        html += `<th>ID</th><th>Client</th><th>Date</th><th>Status</th></tr></thead><tbody>`;
        data.forEach(v => {
            html += `<tr>
                <td>${v.id}</td>
                <td>${v.clientName}</td>
                <td>${v.visitDate}</td>
                <td>${v.status}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    }

    // ===== PAYMENTS =====
    let paymentsData = [];
    async function loadPayments() {
        const res = await authFetch("/operator/payments");
        if (!res?.ok) return;
        paymentsData = await res.json();
        renderPaymentsTable(paymentsData);
    }

    function renderPaymentsTable(data) {
        const container = document.getElementById("payments-table-container");
        if (!container) return;
        if (!data.length) { container.innerHTML = "<p>No payments found</p>"; return; }

        let html = `<table class="table table-bordered table-hover"><thead><tr>`;
        html += `<th>ID</th><th>Client</th><th>Total</th><th>Status</th></tr></thead><tbody>`;
        data.forEach(p => {
            html += `<tr>
                <td>${p.id}</td>
                <td>${p.clientName}</td>
                <td>${p.totalAmount}</td>
                <td>${p.status}</td>
            </tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
    }
});
