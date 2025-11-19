// ========= AUTH FETCH ==========
async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const headers = options.headers || {};
    headers["Authorization"] = `Bearer ${token}`;
    headers["Content-Type"] = "application/json";

    return fetch(url, { ...options, headers });
}

// ========= TAB SWITCHING ==========
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
            case "statistics": loadStatistics(); break;
        }
    });
});

// ========= DASHBOARD ==========
async function loadDashboard() {
    const container = document.getElementById("dashboard-content");
    container.innerHTML = "Loading...";

    const res = await authFetch("/specialist/dashboard");
    if (!res || !res.ok) { container.innerHTML = "Error loading dashboard."; return; }

    const data = await res.json();
    const todayVisits = data.Today.length;
    const weekVisits = data.Week.length;

    container.innerHTML = `
        <p><b>Today's Visits:</b> ${todayVisits}</p>
        <p><b>Week Visits:</b> ${weekVisits}</p>
        <p><b>Next Visit:</b> ${data.Week.length ? new Date(data.Week[0].VisitDate).toLocaleString() : 'None'}</p>
    `;
}

// ========= VISITS ==========
async function loadVisits(filters = {}) {
    const container = document.getElementById("visits-list");
    container.innerHTML = "Loading...";

    const params = new URLSearchParams(filters).toString();
    const res = await authFetch(`/specialist/visits?${params}`);
    if (!res || !res.ok) { container.innerHTML = "Error loading visits."; return; }

    const visits = await res.json();
    if(!visits.length) { container.innerHTML = "<p class='text-secondary'>No visits found.</p>"; return; }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = `
        <thead>
            <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Diagnosis</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${visits.map(v => `
                <tr>
                    <td>${new Date(v.VisitDate).toLocaleString()}</td>
                    <td>${v.PatientName}</td>
                    <td>${v.Diagnosis ?? ""}</td>
                    <td>${v.Status}</td>
                    <td>${v.TotalCost}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-edit" data-id="${v.Id}">Edit</button>
                        <button class="btn btn-sm btn-danger btn-delete" data-id="${v.Id}">Delete</button>
                    </td>
                </tr>`).join('')}
        </tbody>
    `;
    container.innerHTML = "";
    container.appendChild(table);
}

document.getElementById("apply-visit-filters").addEventListener("click", () => {
    const patientSearch = document.getElementById("visit-patient-filter").value;
    const dateFrom = document.getElementById("visit-date-from").value;
    const dateTo = document.getElementById("visit-date-to").value;
    loadVisits({ patientSearch, dateFrom, dateTo });
});

// ========= PAYMENTS ==========
async function loadPayments() {
    const container = document.getElementById("payments-list");
    container.innerHTML = "Loading...";

    const res = await authFetch("/specialist/payments");
    if (!res || !res.ok) { container.innerHTML = "Error loading payments."; return; }

    const payments = await res.json();
    if(!payments.length) { container.innerHTML = "<p class='text-secondary'>No payments found.</p>"; return; }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = `
        <thead>
            <tr>
                <th>Patient MRN</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Issued Date</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${payments.map(p => `
                <tr>
                    <td>${p.PatientMedicalRecord}</td>
                    <td>${p.TotalAmount}</td>
                    <td>${p.PaidAmount}</td>
                    <td>${p.RemainingAmount}</td>
                    <td>${new Date(p.IssuedDate).toLocaleDateString()}</td>
                    <td>${p.Status}</td>
                    <td>
                        <button class="btn btn-sm btn-primary btn-edit-payment" data-id="${p.Id}">Edit</button>
                        <button class="btn btn-sm btn-danger btn-cancel-payment" data-id="${p.Id}">Cancel</button>
                    </td>
                </tr>`).join('')}
        </tbody>
    `;
    container.innerHTML = "";
    container.appendChild(table);
}

// ========= STATISTICS ==========
async function loadStatistics() {
    const container = document.getElementById("statistics-content");
    container.innerHTML = "Loading...";

    const res = await authFetch("/specialist/statistics");
    if(!res || !res.ok) { container.innerHTML = "Error loading statistics."; return; }

    const stats = await res.json();
    container.innerHTML = `
        <p><b>Average Patients per Day:</b> ${stats.AvgPatientsPerDay}</p>
        <p><b>Total Revenue:</b> ${stats.Revenue} грн</p>
    `;
}

// ========= LOGOUT ==========
document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/guest.html";
});

// AUTOLOAD DASHBOARD
loadDashboard();
