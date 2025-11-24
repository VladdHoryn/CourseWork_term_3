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
            case "bills": loadBills(); break;
            case "specialists": loadSpecialists(); break;
            case "profile": loadProfile(); break;
        }
    });
});

// ========= DASHBOARD ==========
async function loadDashboard() {
    const info = document.getElementById("patient-info");
    info.innerHTML = "Loading...";

    const res = await authFetch("/patient/dashboard");
    if (!res) { info.innerHTML = "Unauthorized. Please log in."; return; }
    if (!res.ok) { info.innerHTML = "Error loading data."; return; }

    const patient = await res.json();
    info.innerHTML = `
        <h5>${patient.fullName}</h5>
        <p><b>Phone:</b> ${patient.phone}</p>
        <p><b>Address:</b> ${patient.address}</p>
        <p><b>MRN:</b> ${patient.medicalRecordNumber}</p>
    `;
}

// ========= MY VISITS ==========
async function loadVisits() {
    const container = document.getElementById("visits-list");
    container.innerHTML = "Loading...";

    const res = await authFetch("/patient/visits");
    if (!res || !res.ok) { container.innerHTML = "Error loading visits."; return; }

    const visits = await res.json();
    container.innerHTML = visits.length === 0 ? `<p class="text-secondary">No visits found.</p>` : "";

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

// ========= MY BILLS ==========
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
    container.innerHTML = bills.length === 0
        ? `<p class="text-secondary">No bills found.</p>`
        : "";

    bills.forEach((b, index) => {
        const rem = b.totalAmount - b.paidAmount;
        const isOverdue = new Date(b.dueDate) < new Date() && rem > 0;

        // ❗ Нормальна перевірка чи можна платити
        const isPayDisabled =
            b.status === "Paid" ||
            b.status === "Cancelled" ||
            rem <= 0;

        // Badge by status
        const statusColor = {
            Pending: "secondary",
            PartiallyPaid: "warning",
            Paid: "success",
            Overdue: "danger",
            Cancelled: "dark"
        }[b.status] || "secondary";

        const card = document.createElement("div");
        card.className = "card mb-3 shadow-sm";
        card.innerHTML = `
        <div class="card-body">

            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="m-0">Bill #${index + 1}</h5>
                <span class="badge bg-${statusColor}">${b.status}</span>
            </div>

            <p><b>Total:</b> ${b.totalAmount} грн</p>
            <p><b>Paid:</b> ${b.paidAmount} грн</p>
            <p><b>Remaining:</b> ${rem} грн</p>

            <p><b>Issued:</b> ${new Date(b.issuedDate).toLocaleDateString()}</p>

            <p>
                <b>Due:</b>
                <span class="${isOverdue ? "text-danger fw-bold" : ""}">
                    ${new Date(b.dueDate).toLocaleDateString()}
                </span>
                ${isOverdue ? "⚠️ Overdue" : ""}
            </p>

            ${
            isPayDisabled
                ? `<button class="btn btn-secondary w-100 mt-2" disabled>${b.status}</button>`
                : `<button class="btn btn-success btn-pay w-100 mt-2"
                       data-id="${b.id}"
                       data-rem="${rem}">
                       Pay Now
                   </button>`
        }

        </div>
    `;

        container.appendChild(card);
    });

    // Attach button events
    document.querySelectorAll(".btn-pay").forEach(btn => {
        btn.addEventListener("click", () => {
            currentBillId = btn.getAttribute("data-id");
            const remaining = btn.getAttribute("data-rem");

            const input = document.getElementById("payment-amount");
            input.value = "";
            input.setAttribute("max", remaining);
            input.setAttribute("placeholder", `Enter amount (max ${remaining} грн)`);

            const modal = new bootstrap.Modal(document.getElementById("paymentModal"));
            modal.show();
        });
    });
}

// ========= CONFIRM PAYMENT ==========
document.getElementById("confirm-payment").addEventListener("click", async () => {
    const amount = Number(document.getElementById("payment-amount").value);
    const max = Number(document.getElementById("payment-amount").getAttribute("max"));

    if (!amount || amount <= 0) {
        alert("Enter a valid payment amount.");
        return;
    }

    if (amount > max) {
        alert(`You cannot pay more than ${max} грн.`);
        return;
    }

    const body = JSON.stringify({
        paymentId: currentBillId,
        amount: amount
    });

    const res = await authFetch("/patient/payments/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
    });

    if (!res.ok) {
        const txt = await res.text();
        alert("Payment failed: " + txt);
        return;
    }

    alert("Payment successful!");

    document.getElementById("payment-amount").value = "";
    bootstrap.Modal.getInstance(document.getElementById("paymentModal")).hide();

    loadBills();
});

// ========= SPECIALISTS WITH FILTER & SORT ==========
async function loadSpecialists(filter = "", sort = "asc") {
    const container = document.getElementById("specialist-list");
    container.innerHTML = "Loading...";

    const res = await authFetch("/patient/specialists");
    if (!res || !res.ok) { container.innerHTML = "Error loading specialists."; return; }

    let specialists = await res.json();

    if(filter) {
        const f = filter.toLowerCase();
        specialists = specialists.filter(s => s.speciality.toLowerCase().includes(f));
    }

    specialists.sort((a,b) => {
        const nameA = a.fullName.toLowerCase();
        const nameB = b.fullName.toLowerCase();
        return sort==="asc"? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

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

document.getElementById("apply-filters").addEventListener("click", () => {
    const filter = document.getElementById("specialty-filter").value;
    const sort = document.getElementById("sort-order").value;
    loadSpecialists(filter, sort);
});

// ========= PROFILE ==========
async function loadProfile() {
    const res = await authFetch("/patient/profile");
    const form = document.getElementById("profile-form");
    if (!res || !res.ok) { form.innerHTML = "Failed to load profile."; return; }
    const p = await res.json();

    document.getElementById("profile-fullname").value = p.fullName;
    document.getElementById("profile-phone").value = p.phone;
    document.getElementById("profile-address").value = p.address;
    document.getElementById("profile-mrn").value = p.medicalRecordNumber;
}

document.getElementById("btn-save-profile").addEventListener("click", async (e)=>{
    e.preventDefault();
    const fullName = document.getElementById("profile-fullname").value;
    const phone = document.getElementById("profile-phone").value;
    const address = document.getElementById("profile-address").value;
    await authFetch(`/patient/profile/update?fullName=${fullName}&phone=${phone}&address=${address}`, { method:"POST" });
    alert("Saved!"); loadProfile();
});

// ========= CHANGE PASSWORD ==========
document.getElementById("btn-save-password").addEventListener("click", async (e)=>{
    e.preventDefault();
    const newPassword = document.getElementById("new-password").value;
    await authFetch(`/patient/profile/password?newPassword=${newPassword}`, { method:"POST" });
    alert("Password updated!"); document.getElementById("new-password").value="";
});

// ========= LOGOUT ==========
document.getElementById("btn-logout").addEventListener("click", () => {
    localStorage.removeItem("token");
    window.location.href = "/guest.html";
});

// AUTOLOAD DASHBOARD
loadDashboard();
