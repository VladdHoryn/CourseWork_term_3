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

    // --- Запит на реєстрацію ---
    document.getElementById("register-form").addEventListener("submit", e => {
        e.preventDefault();
        const messageDiv = document.getElementById("register-message");

        const dto = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value,
            fullName: document.getElementById("fullname").value,
            phone: document.getElementById("phone").value,
            address: document.getElementById("address").value
        };

        fetch("/guest/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dto)
        })
            .then(async res => {
                const text = await res.text();
                messageDiv.innerHTML = `<div class="alert ${res.ok ? "alert-success" : "alert-danger"}">${text}</div>`;
            })
            .catch(() => {
                messageDiv.innerHTML = `<div class="alert alert-danger">Помилка з’єднання.</div>`;
            });
    });

    // --- Login Button ---
    document.getElementById("login-btn").addEventListener("click", () => {
        window.location.href = "/Account/Login";
    });

    function openRegister() {
        window.location.href = "register.html";
    }

    function openForgotPassword() {
        window.location.href = "forgot-password.html";
    }

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

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem("token", data.token);

            alert("Успішний вхід!");
            window.location.reload();
        } else {
            alert("Невірний логін або пароль");
        }
    });
});


