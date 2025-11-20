import { authFetch } from "./auth.js";

document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll(".tab").forEach(t => t.classList.add("d-none"));
        document.getElementById(tab).classList.remove("d-none");
        document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        switch(tab){
            case "dashboard": loadDashboard(); break;
            case "visits": loadVisits(); break;
            case "payments": loadPayments(); break;
            case "patients": loadPatients(); break;
            case "statistics": loadStatistics(); break;
        }
    });
});

// ================= DASHBOARD =================
async function loadDashboard() {
    const container = document.getElementById("dashboard-content");
    container.innerHTML = "Loading...";
    const res = await authFetch("/specialist/dashboard");
    if(!res.ok){ container.innerHTML = "Error loading dashboard"; return; }
    const data = await res.json();
    container.innerHTML = `
        <p><b>Today's Visits:</b> ${data.Today?.length ?? 0}</p>
        <p><b>Week Visits:</b> ${data.Week?.length ?? 0}</p>
        <p><b>Next Visit:</b> ${data.Week?.length ? new Date(data.Week[0].VisitDate).toLocaleString() : 'None'}</p>
    `;
}

// ================= VISITS =====================
async function loadVisits() {
    const container = document.getElementById("visits-list");
    container.innerHTML = "Loading...";
    const patient = document.getElementById("visit-patient-filter").value;
    const from = document.getElementById("visit-date-from").value;
    const to = document.getElementById("visit-date-to").value;
    const query = new URLSearchParams({ patientSearch: patient, dateFrom: from, dateTo: to }).toString();

    const res = await authFetch("/specialist/visits?" + query);
    if(!res.ok){ container.innerHTML = "Error loading visits"; return; }

    const visits = await res.json();
    container.innerHTML = `<button class="btn btn-success mb-3" id="btn-add-visit">➕ Add Visit</button>`;
    if(!visits.length){ container.innerHTML += "<p>No visits found.</p>"; return; }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = `
        <thead>
            <tr><th>Date</th><th>Patient</th><th>Diagnosis</th><th>Costs</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
        ${visits.map(v => `
            <tr>
                <td>${new Date(v.VisitDate).toLocaleString()}</td>
                <td>${v.PatientName ?? v.PatientMedicalRecord}</td>
                <td>${v.Diagnosis ?? "-"}</td>
                <td>${(v.ServiceCost + v.MedicationCost).toFixed(2)}</td>
                <td><span class="badge bg-${visitStatusColor(v.Status)}">${v.Status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-visit" data-id="${v.Id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-delete-visit" data-id="${v.Id}">Delete</button>
                </td>
            </tr>`).join("")}
        </tbody>`;
    container.appendChild(table);

    document.getElementById("btn-add-visit").onclick = () => openVisitModal();
    document.querySelectorAll(".btn-edit-visit").forEach(b => b.onclick = () => openVisitModal(b.dataset.id));
    document.querySelectorAll(".btn-delete-visit").forEach(b => b.onclick = () => deleteVisit(b.dataset.id));
}

function visitStatusColor(status){
    switch(status){ case "Scheduled": return "info"; case "Completed": return "success"; case "Cancelled": return "secondary"; default: return "dark"; }
}

// ================= VISIT MODAL =================
const visitModal = new bootstrap.Modal(document.getElementById("visitModal"));
document.getElementById("visitForm").onsubmit = async (e) => {
    e.preventDefault();
    const id = document.getElementById("visit-id").value;
    const payload = {
        PatientMedicalRecord: +document.getElementById("visit-patient").value,
        VisitDate: document.getElementById("visit-date").value,
        Diagnosis: document.getElementById("visit-diagnosis").value,
        ServiceCost: +document.getElementById("visit-service-cost").value,
        MedicationCost: +document.getElementById("visit-medication-cost").value,
        Status: document.getElementById("visit-status").value
    };
    const url = id ? `/specialist/visits/${id}` : "/specialist/visits";
    const method = id ? "PUT" : "POST";
    const res = await authFetch(url, { method, body: JSON.stringify(payload) });
    if(res.ok){ visitModal.hide(); loadVisits(); } else { alert("Error saving visit"); }
};

function openVisitModal(id=null){
    document.getElementById("visit-id").value = "";
    document.getElementById("visitForm").reset();
    if(id){
        authFetch(`/specialist/visits/${id}`).then(r=>r.json()).then(v=>{
            document.getElementById("visit-id").value = v.Id;
            document.getElementById("visit-patient").value = v.PatientMedicalRecord;
            document.getElementById("visit-date").value = v.VisitDate.slice(0,16);
            document.getElementById("visit-diagnosis").value = v.Diagnosis;
            document.getElementById("visit-service-cost").value = v.ServiceCost;
            document.getElementById("visit-medication-cost").value = v.MedicationCost;
            document.getElementById("visit-status").value = v.Status;
        });
    }
    visitModal.show();
}

async function deleteVisit(id){
    if(!confirm("Cancel this visit?")) return;
    const res = await authFetch(`/specialist/visits/${id}/status`, { method:"PATCH", body: JSON.stringify({Status:"Cancelled"}) });
    if(res.ok) loadVisits(); else alert("Error cancelling visit");
}

// ================= PAYMENTS =================
async function loadPayments() {
    const container = document.getElementById("payments-list");
    container.innerHTML = "Loading...";
    const res = await authFetch("/specialist/payments");
    if(!res.ok){ container.innerHTML = "Error loading payments"; return; }
    const payments = await res.json();
    container.innerHTML = `<button class="btn btn-success mb-3" id="btn-create-payment">➕ Add Payment</button>`;
    if(!payments.length){ container.innerHTML += "<p>No payments</p>"; return; }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = `
        <thead>
            <tr><th>MRN</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Status</th><th>Issued</th><th>Actions</th></tr>
        </thead>
        <tbody>
        ${payments.map(p=>`
            <tr>
                <td>${p.PatientMedicalRecord}</td>
                <td>${p.TotalAmount}</td>
                <td>${p.PaidAmount}</td>
                <td>${p.RemainingAmount}</td>
                <td>${p.Status}</td>
                <td>${new Date(p.IssuedDate).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-payment" data-id="${p.Id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-cancel-payment" data-id="${p.Id}">Cancel</button>
                </td>
            </tr>`).join("")}
        </tbody>`;
    container.appendChild(table);

    document.getElementById("btn-create-payment").onclick = () => openPaymentModal();
    document.querySelectorAll(".btn-edit-payment").forEach(b => b.onclick = () => openPaymentModal(b.dataset.id));
    document.querySelectorAll(".btn-cancel-payment").forEach(b => b.onclick = async e => {
        if(confirm("Cancel this payment?")){
            const res = await authFetch(`/specialist/payments/${b.dataset.id}/cancel`, {method:"PATCH"});
            if(res.ok) loadPayments(); else alert("Error cancelling payment");
        }
    });
}

// Payment modal
const paymentModal = new bootstrap.Modal(document.getElementById("paymentModal"));
document.getElementById("paymentForm").onsubmit = async e=>{
    e.preventDefault();
    const id = document.getElementById("payment-id").value;
    const payload = {
        PatientMedicalRecord: +document.getElementById("payment-patient").value,
        TotalAmount: +document.getElementById("payment-total").value,
        PaidAmount: +document.getElementById("payment-paid").value,
        Status: document.getElementById("payment-status").value
    };
    const url = id ? `/specialist/payments/${id}` : "/specialist/payments";
    const method = id ? "PUT" : "POST";
    const res = await authFetch(url, {method, body: JSON.stringify(payload)});
    if(res.ok){ paymentModal.hide(); loadPayments(); } else { alert("Error saving payment"); }
};
function openPaymentModal(id=null){
    document.getElementById("payment-id").value = "";
    document.getElementById("paymentForm").reset();
    if(id) authFetch(`/specialist/payments/${id}`).then(r=>r.json()).then(p=>{
        document.getElementById("payment-id").value = p.Id;
        document.getElementById("payment-patient").value = p.PatientMedicalRecord;
        document.getElementById("payment-total").value = p.TotalAmount;
        document.getElementById("payment-paid").value = p.PaidAmount;
        document.getElementById("payment-status").value = p.Status;
    });
    paymentModal.show();
}

// ================= PATIENTS =================
async function loadPatients(){
    const container = document.getElementById("patients-list");
    container.innerHTML = "Loading...";
    const surname = document.getElementById("patient-surname-filter").value;
    const from = document.getElementById("patient-birth-from").value;
    const to = document.getElementById("patient-birth-to").value;
    const query = new URLSearchParams({ surname, birthFrom: from, birthTo: to }).toString();

    const res = await authFetch("/specialist/patients?" + query);
    if(!res.ok){ container.innerHTML="Error loading patients"; return; }
    const patients = await res.json();
    if(!patients.length){ container.innerHTML="<p>No patients</p>"; return; }

    const table = document.createElement("table");
    table.className = "table table-striped";
    table.innerHTML = `
        <thead><tr><th>MRN</th><th>Name</th><th>Birth</th><th>Health</th></tr></thead>
        <tbody>
        ${patients.map(p=>`
            <tr>
                <td>${p.MedicalRecord}</td>
                <td>${p.Surname} ${p.Name}</td>
                <td>${new Date(p.BirthDate).toLocaleDateString()}</td>
                <td>${p.HealthStatus}</td>
            </tr>`).join("")}
        </tbody>`;
    container.appendChild(table);
}
document.getElementById("apply-visit-filters").onclick = loadVisits;
document.getElementById("apply-patient-filters").onclick = loadPatients;

// ================= LOGOUT ====================
document.getElementById("btn-logout").onclick = ()=>{
    localStorage.removeItem("token");
    window.location.href="/guest.html";
};

// AUTOLOAD
loadDashboard();
