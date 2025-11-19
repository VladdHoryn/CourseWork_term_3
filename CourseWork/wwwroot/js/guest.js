document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".tab");

    // --- Таби ---
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            sections.forEach(s => s.classList.add("d-none"));
            document.getElementById(tab.dataset.tab).classList.remove("d-none");
        });
    });

    // --- Автоматично завантажити Dashboard ---
    const welcomeMsg = document.getElementById("welcome-message");

    fetch("/guest/dashboard")
        .then(res => res.json())
        .then(data => {
            welcomeMsg.textContent = `${data.message}. Доступні дії: ${data.options.join(", ")}.`;
        })
        .catch(() => {
            welcomeMsg.textContent = "Не вдалося завантажити інформацію.";
        });

    // --- Завантаження статистики ---
    document.getElementById("load-stats").addEventListener("click", () => {
        const start = document.getElementById("start-date").value;
        const end = document.getElementById("end-date").value;
        const resultDiv = document.getElementById("stats-result");

        if (!start || !end) {
            alert("Оберіть діапазон дат!");
            return;
        }

        fetch(`/guest/statistics?start=${start}&end=${end}`)
            .then(res => {
                if (!res.ok) throw new Error("Помилка при отриманні статистики");
                return res.json();
            })
            .then(data => {
                resultDiv.classList.remove("d-none", "alert-danger");
                resultDiv.classList.add("alert-info");
                resultDiv.innerHTML = `
          <strong>Результати:</strong><br>
          👥 Користувачів: ${data.totalUsers}<br>
          🕓 Відвідувань: ${data.totalVisits}<br>
          💳 Платежів: ${data.totalPayments}<br>
          💰 Дохід: ${data.totalRevenue} ₴
        `;
            })
            .catch(err => {
                resultDiv.classList.remove("d-none", "alert-info");
                resultDiv.classList.add("alert-danger");
                resultDiv.textContent = err.message;
            });
    });

    // ==============================
//     Load Specialists Tab
// ==============================
    function loadSpecialists() {
        const list = document.getElementById("specialist-list");
        const filter = document.getElementById("spec-filter");

        fetch("/guest/specialists")
            .then(res => res.json())
            .then(data => {
                // Зберігаємо для фільтрації та пошуку
                window.allSpecialists = data;

                // --- Формуємо список спеціальностей для селекту ---
                const specialties = [...new Set(data.map(s => s.speciality).filter(Boolean))].sort();
                filter.innerHTML = `<option value="">Всі спеціальності</option>` +
                    specialties.map(s => `<option value="${s}">${s}</option>`).join("");

                // Відображення всіх спеціалістів
                renderSpecialists(data);
            })
            .catch(() => {
                list.innerHTML = `<div class="alert alert-danger">Не вдалося завантажити спеціалістів</div>`;
            });
    }

// ==============================
//     Render Specialists
// ==============================
    function renderSpecialists(arr) {
        const list = document.getElementById("specialist-list");

        if (!arr.length) {
            list.innerHTML = `<div class="alert alert-warning">Спеціалістів не знайдено.</div>`;
            return;
        }

        list.innerHTML = arr.map(s => `
        <div class="col-md-4">
            <div class="card shadow-sm border-0 h-100">
                <div class="card-body">
                    <h5 class="card-title fw-bold">${s.fullName ?? "Не вказано"}</h5>
                    <p class="card-text text-secondary m-0">
                        <i class="bi bi-briefcase"></i> ${s.speciality ?? "Не вказано"}
                    </p>
                    ${s.dateOfBirth ? `<p class="card-text text-muted m-0">
                        <i class="bi bi-calendar"></i> ${new Date(s.dateOfBirth).toLocaleDateString("uk-UA")}
                    </p>` : ""}
                    <p class="card-text text-muted m-0">
                        <i class="bi bi-person-badge"></i> Роль: ${s.speciality}
                    </p>
                </div>
            </div>
        </div>
    `).join("");
    }

// ==============================
//     Search and Filter
// ==============================
    document.getElementById("spec-search").addEventListener("input", () => {
        const query = document.getElementById("spec-search").value.toLowerCase();
        const filtered = window.allSpecialists.filter(s =>
            (s.fullName && s.fullName.toLowerCase().includes(query)) ||
            (s.speciality && s.speciality.toLowerCase().includes(query))
        );
        renderSpecialists(filtered);
    });

    document.getElementById("spec-filter").addEventListener("change", () => {
        const value = document.getElementById("spec-filter").value;
        if (!value) return renderSpecialists(window.allSpecialists);

        const filtered = window.allSpecialists.filter(s => s.speciality === value);
        renderSpecialists(filtered);
    });

// ==============================
//     Manual Refresh
// ==============================
    document.getElementById("spec-refresh").addEventListener("click", () => loadSpecialists());

// ==============================
//     Load Specialists on Tab Click
// ==============================
    document.querySelector("[data-tab='specialists']").addEventListener("click", () => {
        loadSpecialists();
    });

    document.getElementById("btn-open-register")
        .addEventListener("click", () => window.location.href = "register.html");

    document.getElementById("btn-open-forgot-password")
        .addEventListener("click", () => window.location.href = "forgot-password.html");

// Приклад відправки запиту на API Login
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("loginUsername").value;
        const password = document.getElementById("loginPassword").value;

        const response = await fetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            alert("Невірний логін або пароль");
            return;
        }

        const data = await response.json();
        const token = data.token;

        // Зберігаємо токен
        localStorage.setItem("token", token);

        // Декодуємо роль з JWT
        const payload = JSON.parse(atob(token.split(".")[1]));
        const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

        console.log("Role =", role);

        // Редірект за роллю
        switch (role) {
            case "Patient":
                window.location.href = "/patient.html";
                break;
            case "Specialist":
                window.location.href = "/specialist.html";
                break;
            case "Operator":
                window.location.href = "/operator.html";
                break;
            case "Administrator":
                window.location.href = "/administrator.html";
                break;
            default:
                alert("Невідома роль!");
                break;
        }
    });
});


