import { logout } from './auth.js';

const apiBase = '/operator';

document.getElementById('btn-logout').addEventListener('click', logout);

// -------------------- TAB NAVIGATION --------------------
const tabs = document.querySelectorAll('nav.sidebar button');
const sections = document.querySelectorAll('main .tab');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        sections.forEach(s => s.id === target ? s.classList.remove('d-none') : s.classList.add('d-none'));
    });
});

// -------------------- DASHBOARD --------------------
async function loadDashboard() {
    const res = await fetch(`${apiBase}/dashboard`);
    const data = await res.json();
    const container = document.getElementById('dashboard-sections');
    container.innerHTML = '';
    data.Sections.forEach(sec => {
        const div = document.createElement('div');
        div.className = 'col-md-3';
        div.innerHTML = `<div class="card p-3 shadow-sm text-center">${sec}</div>`;
        container.appendChild(div);
    });
}
loadDashboard();

// -------------------- PATIENTS --------------------
async function loadPatients() {
    const res = await fetch(`${apiBase}/patients`);
    const patients = await res.json();
    const container = document.getElementById('patients-table-container');
    container.innerHTML = `<table class="table table-striped">
        <thead><tr><th>Username</th><th>Full Name</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody>
        ${patients.map(p => `<tr>
            <td>${p.userName}</td>
            <td>${p.fullName}</td>
            <td>${p.phone || ''}</td>
            <td>${p.address || ''}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-patient" data-id="${p.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-patient" data-id="${p.id}">Delete</button>
            </td>
        </tr>`).join('')}
        </tbody>
    </table>`;

    document.querySelectorAll('.edit-patient').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const patient = patients.find(p => p.id === id);
            document.getElementById('patient-id').value = id;
            document.getElementById('patient-username').value = patient.userName;
            document.getElementById('patient-fullname').value = patient.fullName;
            document.getElementById('patient-phone').value = patient.phone || '';
            document.getElementById('patient-address').value = patient.address || '';
            document.getElementById('patientModalTitle').textContent = 'Edit Patient';
            new bootstrap.Modal(document.getElementById('patientModal')).show();
        });
    });

    document.querySelectorAll('.delete-patient').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if(confirm('Delete this patient?')) {
                await fetch(`${apiBase}/patients/${id}`, { method: 'DELETE' });
                loadPatients();
            }
        });
    });
}
loadPatients();

document.getElementById('btn-add-patient').addEventListener('click', () => {
    document.getElementById('patient-form').reset();
    document.getElementById('patient-id').value = '';
    document.getElementById('patientModalTitle').textContent = 'Add Patient';
    new bootstrap.Modal(document.getElementById('patientModal')).show();
});

document.getElementById('save-patient').addEventListener('click', async () => {
    const id = document.getElementById('patient-id').value;
    const payload = {
        userName: document.getElementById('patient-username').value,
        fullName: document.getElementById('patient-fullname').value,
        phone: document.getElementById('patient-phone').value,
        address: document.getElementById('patient-address').value,
        password: document.getElementById('patient-password').value
    };
    if(id) {
        await fetch(`${apiBase}/patients/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    } else {
        await fetch(`${apiBase}/patients`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    }
    new bootstrap.Modal(document.getElementById('patientModal')).hide();
    loadPatients();
});

// -------------------- SPECIALISTS --------------------
async function loadSpecialists() {
    const res = await fetch(`${apiBase}/specialists`);
    const specialists = await res.json();
    const container = document.getElementById('specialists-table-container');
    container.innerHTML = `<table class="table table-striped">
        <thead><tr><th>Username</th><th>Full Name</th><th>Specialty</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
        <tbody>
        ${specialists.map(s => `<tr>
            <td>${s.userName}</td>
            <td>${s.fullName}</td>
            <td>${s.speciality || ''}</td>
            <td>${s.phone || ''}</td>
            <td>${s.address || ''}</td>
            <td>
                <button class="btn btn-sm btn-primary edit-specialist" data-id="${s.id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-specialist" data-id="${s.id}">Delete</button>
            </td>
        </tr>`).join('')}
        </tbody>
    </table>`;

    document.querySelectorAll('.edit-specialist').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const specialist = specialists.find(s => s.id === id);
            document.getElementById('specialist-id').value = id;
            document.getElementById('specialist-username').value = specialist.userName;
            document.getElementById('specialist-fullname').value = specialist.fullName;
            document.getElementById('specialist-specialty').value = specialist.speciality || '';
            document.getElementById('specialist-phone').value = specialist.phone || '';
            document.getElementById('specialist-address').value = specialist.address || '';
            document.getElementById('specialistModalTitle').textContent = 'Edit Specialist';
            new bootstrap.Modal(document.getElementById('specialistModal')).show();
        });
    });

    document.querySelectorAll('.delete-specialist').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if(confirm('Delete this specialist?')) {
                await fetch(`${apiBase}/specialists/${id}`, { method: 'DELETE' });
                loadSpecialists();
            }
        });
    });
}
loadSpecialists();

document.getElementById('btn-add-specialist').addEventListener('click', () => {
    document.getElementById('specialist-form').reset();
    document.getElementById('specialist-id').value = '';
    document.getElementById('specialistModalTitle').textContent = 'Add Specialist';
    new bootstrap.Modal(document.getElementById('specialistModal')).show();
});

document.getElementById('save-specialist').addEventListener('click', async () => {
    const id = document.getElementById('specialist-id').value;
    const payload = {
        userName: document.getElementById('specialist-username').value,
        fullName: document.getElementById('specialist-fullname').value,
        specialty: document.getElementById('specialist-specialty').value,
        phone: document.getElementById('specialist-phone').value,
        address: document.getElementById('specialist-address').value,
        password: document.getElementById('specialist-password').value
    };
    if(id) {
        await fetch(`${apiBase}/specialists/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    } else {
        await fetch(`${apiBase}/specialists`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    }
    new bootstrap.Modal(document.getElementById('specialistModal')).hide();
    loadSpecialists();
});
