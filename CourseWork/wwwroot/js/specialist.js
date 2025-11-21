import { authFetch } from "./auth.js";

document.addEventListener("DOMContentLoaded", ()=>{

    // ===== TAB SWITCH =====
    document.querySelectorAll("[data-tab]").forEach(btn=>{
        btn.addEventListener("click", ()=>{
            const tab = btn.getAttribute("data-tab");
            document.querySelectorAll(".tab").forEach(t=> t.classList.add("d-none"));
            const tabEl = document.getElementById(tab);
            if(tabEl) tabEl.classList.remove("d-none");
            document.querySelectorAll("[data-tab]").forEach(b=>b.classList.remove("active"));
            btn.classList.add("active");

            switch(tab){
                case "dashboard": loadDashboard(); break;
                case "visits": loadVisits(); break;
                case "payments": loadPayments(); break;
                case "patients": loadPatients(); break;
            }
        });
    });

    // ===== DASHBOARD =====
    async function loadDashboard(){
        const res = await authFetch("/specialist/dashboard");
        if(!res || !res.ok) return;

        const data = await res.json();
        const todayVisits = Array.isArray(data.Today)?data.Today:[];
        const weekVisits = Array.isArray(data.Week)?data.Week:[];

        document.getElementById("dashboard-today").innerHTML = `<h5>Today's Visits</h5>${
            todayVisits.length ? todayVisits.map(v=>`<p>${v.PatientName} - ${new Date(v.VisitDate).toLocaleString()}</p>`).join("") : "<p>No visits today</p>"
        }`;
        document.getElementById("dashboard-week").innerHTML = `<h5>Week Visits</h5>${
            weekVisits.length ? weekVisits.map(v=>`<p>${v.PatientName} - ${new Date(v.VisitDate).toLocaleString()}</p>`).join("") : "<p>No visits this week</p>"
        }`;
        document.getElementById("dashboard-stats").innerHTML = `<h5>Quick Stats</h5>
            <p>Total visits: ${weekVisits.length}</p>
            <p>Completed: ${weekVisits.filter(v=>v.Status==='Completed').length}</p>
            <p>Patients: ${[...new Set(weekVisits.map(v=>v.PatientMedicalRecord))].length}</p>`;
        startNextVisitTimer(weekVisits);
    }

    function startNextVisitTimer(visits){
        const nextDiv = document.getElementById("next-visit-timer");
        if(!nextDiv) return;
        const futureVisits = visits.filter(v=>new Date(v.VisitDate)>new Date());
        if(futureVisits.length===0){ nextDiv.innerHTML="No upcoming visits"; return; }
        const nextVisit = new Date(futureVisits.sort((a,b)=>new Date(a.VisitDate)-new Date(b.VisitDate))[0].VisitDate);
        function updateTimer(){
            const diff = nextVisit - new Date();
            if(diff<=0){ nextDiv.innerHTML="Next visit now!"; clearInterval(interval); return;}
            const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
            nextDiv.innerHTML = `Next visit in: ${h}h ${m}m ${s}s`;
        }
        updateTimer();
        const interval = setInterval(updateTimer,1000);
    }

    // ===== VISITS =====
    let visitsData = [];
    async function loadVisits(){
        const res = await authFetch("/specialist/visits");
        if(!res || !res.ok) return;
        visitsData = await res.json();
        renderVisitsTable(visitsData);
    }

    function renderVisitsTable(data){
        const container = document.getElementById("visits-table-container");
        if(!container) return;
        if(data.length===0){ container.innerHTML="<p>No visits found</p>"; return;}
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Date</th><th>Patient MR</th><th>Diagnosis</th><th>Status</th><th>Cost</th><th>Actions</th>
            </tr></thead><tbody>`;
        data.forEach(v=>{
            html+=`<tr>
                <td>${new Date(v.VisitDate).toLocaleString()}</td>
                <td>${v.PatientMedicalRecord}</td>
                <td>${v.Diagnosis}</td>
                <td><span class="badge ${v.Status==='Completed'?'bg-success':v.Status==='Scheduled'?'bg-warning':'bg-secondary'}">${v.Status}</span></td>
                <td>${v.ServiceCost + v.MedicationCost}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-visit" data-id="${v.Id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-cancel-visit" data-id="${v.Id}">Cancel</button>
                </td>
            </tr>`;
        });
        html+="</tbody></table>";
        container.innerHTML = html;
    }

    // ===== PAYMENTS =====
    let paymentsData = [];
    async function loadPayments(){
        const res = await authFetch("/specialist/payments");
        if(!res || !res.ok) return;
        paymentsData = await res.json();
        renderPaymentsTable(paymentsData);
    }

    function renderPaymentsTable(data){
        const container = document.getElementById("payments-table-container");
        if(!container) return;
        if(data.length===0){ container.innerHTML="<p>No payments found</p>"; return;}
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Patient MR</th><th>Total</th><th>Paid</th><th>Remaining</th><th>Actions</th>
            </tr></thead><tbody>`;
        data.forEach(p=>{
            const remaining = (p.TotalAmount||p.Amount) - (p.PaidAmount||0);
            html+=`<tr>
                <td>${p.PatientMedicalRecord}</td>
                <td>${p.TotalAmount||p.Amount}</td>
                <td>${p.PaidAmount||0}</td>
                <td>${remaining}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-edit-payment" data-id="${p.Id}">Edit</button>
                    <button class="btn btn-sm btn-danger btn-cancel-payment" data-id="${p.Id}">Cancel</button>
                </td>
            </tr>`;
        });
        html+="</tbody></table>";
        container.innerHTML = html;
    }

    // ===== PATIENTS =====
    let patientsData=[];
    async function loadPatients(){
        const res = await authFetch("/specialist/patients");
        if(!res || !res.ok) return;
        patientsData = await res.json();
        renderPatientsTable(patientsData);
    }

    function renderPatientsTable(data){
        const container = document.getElementById("patients-table-container");
        if(!container) return;
        if(data.length===0){ container.innerHTML="<p>No patients found</p>"; return;}
        let html = `<table class="table table-bordered table-hover">
            <thead><tr>
            <th>Full Name</th><th>DOB</th><th>Health Status</th><th>Medical Record</th><th>Actions</th>
            </tr></thead><tbody>`;
        data.forEach(p=>{
            html+=`<tr>
                <td>${p.FullName}</td>
                <td>${p.BirthDate}</td>
                <td>${p.HealthStatus}</td>
                <td>${p.MedicalRecord}</td>
                <td><button class="btn btn-sm btn-primary btn-add-visit-patient" data-mr="${p.MedicalRecord}">Add Visit</button></td>
            </tr>`;
        });
        html+="</tbody></table>";
        container.innerHTML = html;
    }

    // ===== LOGOUT =====
    document.getElementById("btn-logout")?.addEventListener("click",()=>{
        localStorage.removeItem("token");
        window.location.href="/guest.html";
    });

    // AUTOLOAD DASHBOARD
    loadDashboard();

});
