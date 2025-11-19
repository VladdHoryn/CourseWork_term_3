// ========= AUTH FETCH (adds token to every request) ==========
async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const headers = options.headers || {};
    headers["Authorization"] = `Bearer ${token}`;
    headers["Content-Type"] = "application/json";

    return fetch(url, {
        ...options,
        headers
    });
}


// ========= TAB SWITCHING ==========
document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");

        document.querySelectorAll(".tab").forEach(t => t.classList.add("d-none"));
        document.getElementById(tab).classList.remove("d-none");

        document.querySelectorAll("[data-tab]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        switch (tab) {
            case "dashboard": loadDashboard(); break;
            case "visits": loadVisits(); break;
            case "bills": loadBills(); break;
            case "specialists": loadSpecialists(); break;
            case "profile": loadProfile(); break;
        }
    });
});


// ========= 1. DASHBOARD ==========
async function loadDashboard() {
    const info = document.getElementById("patient-info");
    info.innerHTML = "Loading...";
    
    const res = await authFetch("/patient/dashboard");
    
    if (!res) {
        info.innerHTML = "Unauthorized. Please log in.";
        return;
    }
    
    if (!res.ok) {
        info.innerHTML = "Error loading data.";
        return;
    }

    const patient = await res.json();

    info.innerHTML = `
        <h5>${patient.fullName}</h5>
        <p><b>Phone:</b> ${patient.phone}</p>
        <p><b>Address:</b> ${patient.address}</p>
        <p><b>MRN:</b> ${patient.medicalRecordNumber}</p>
    `;
}


// ========= 2. MY VISITS ==========
async function loadVisits() {
    const container = document.getElementById("visits-list");
    container.innerHTML = "Loading...";

    const res = await authFetch("/patient/visits");
    if (!res || !res.ok) {
        container.innerHTML = "Error loading visits.";
        return;
    }

    const visits = await res.json();
    container.innerHTML = "";

    if (visits.length === 0) {
        container.innerHTML = `<p class="text-secondary">No visits found.</p>`;
        return;
    }

    visits.forEach(v => {
        const card = document.createElement("div");
        card.className = "card mb-3";

        card.innerHTML = `
            <div class="card-body">
                <h5>${new Date(v.visitDate).toLocaleString()}</h5>
                <p><b>Specialist:</b> ${v.specialistName}</p>
                <p><b>Purpose:</b> ${v.purpose}</p>
                <p><b>Status:</b> ${v.status}</p>
                <p><b>Total Cost:</b> ${v.totalCost} грн</p>
            </div>
        `;

        container.appendChild(card);
    });
}


// ========= 3. BILLS ==========
let currentBillId = null;

async function loadBills() {
    const container = document.getElementById("bills-list");
    container.innerHTML = "Loading...";

    const res = await authFetch("/patient/bills");
    if (!res || !res.ok) {
        container.innerHTML = "Error loading bills.";
        return;
    }

    const bills = await res.json();
    container.innerHTML = "";

    if (bills.length === 0) {
        container.innerHTML = `<p class="text-secondary">No bills found.</p>`;
        return;
    }

    bills.forEach(b => {
        const rem = b.totalAmount - b.paidAmount;
        const card = document.createElement("div");
        card.className = "card mb-3";

        card.innerHTML = `
            <div class="card-body">
                <h5>Bill #${b.id}</h5>
                <p><b>Total:</b> ${b.totalAmount} грн</p>
                <p><b>Paid:</b> ${b.paidAmount} грн</p>
                <p><b>Remaining:</b> ${rem} грн</p>
                <p><b>Issued:</b> ${new Date(b.issuedDate).toLocaleDateString()}</p>

                ${rem > 0 ? `
                    <button class="btn btn-success btn-pay" data-id="${b.id}">
                        Pay Now
                    </button>
                ` : `
                    <button class="btn btn-secondary" disabled>Paid</button>
                `}
            </div>
        `;

        container.appendChild(card);
    });

    document.querySelectorAll(".btn-pay").forEach(btn => {
        btn.addEventListener("click", () => {
            currentBillId = btn.getAttribute("data-id");
            const modal = new bootstrap.Modal(document.getElementById("paymentModal"));
            modal.show();
        });
    });
}


// Confirm payment
document.getElementById("confirm-payment").addEventListener("click", async () => {
    const amount = Number(document.getElementById("payment-amount").value);

    await authFetch(`/patient/bills/pay/${currentBillId}?amount=${amount}`, {
        method: "POST"
    });

    document.getElementById("payment-amount").value = "";

    const modal = bootstrap.Modal.getInstance(document.getElementById("paymentModal"));
    modal.hide();

    loadBills();
});


// ========= 4. SPECIALISTS ==========
async function loadSpecialists() {
    const container = document.getElementById("specialist-list");
    container.innerHTML = "Loading...";

    const res = await authFetch("/patient/specialists");
    if (!res || !res.ok) {
        container.innerHTML = "Error loading specialists.";
        return;
    }

    const specialists = await res.json();
    container.innerHTML = "";

    specialists.forEach(s => {
        const col = document.createElement("div");
        col.className = "col-md-4";

        col.innerHTML = `
            <div class="card shadow-sm p-3">
                <h5>${s.fullName}</h5>
                <p><b>Speciality:</b> ${s.speciality}</p>
                <p>${s.description ?? ""}</p>
            </div>
        `;

        container.appendChild(col);
    });
}


// ========= 5. PROFILE ==========
async function loadProfile() {
    const res = await authFetch("/patient/profile");
    const form = document.getElementById("profile-form");

    if (!res || !res.ok) {
        form.innerHTML = "Failed to load profile.";
        return;
    }

    const p = await res.json();

    document.getElementById("profile-fullname").value = p.fullName;
    document.getElementById("profile-phone").value = p.phone;
    document.getElementById("profile-address").value = p.address;
    document.getElementById("profile-mrn").value = p.medicalRecordNumber;
}


// Save profile
document.getElementById("btn-save-profile").addEventListener("click", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("profile-fullname").value;
    const phone = document.getElementById("profile-phone").value;
    const address = document.getElementById("profile-address").value;

    await authFetch(`/patient/profile/update?fullName=${fullName}&phone=${phone}&address=${address}`, {
        method: "POST"
    });

    alert("Saved!");
    loadProfile();
});


// ========= 6. CHANGE PASSWORD ==========
document.getElementById("btn-save-password").addEventListener("click", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("new-password").value;

    await authFetch(`/patient/profile/password?newPassword=${newPassword}`, {
        method: "POST"
    });

    alert("Password updated!");
    document.getElementById("new-password").value = "";
});

// ========= LOGOUT ==========
document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/guest.html";
});


// AUTOLOAD DASHBOARD
loadDashboard();
