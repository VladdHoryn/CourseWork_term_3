document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-form');
    const usernameInput = document.getElementById('username');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const messageDiv = document.getElementById('forgot-message');
    const submitBtn = document.getElementById('submitBtn');

    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');

    function showMessage(text, type = 'success') {
        messageDiv.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${text}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }

    function evaluatePasswordStrength(pwd) {
        // Простий алгоритм оцінки: довжина + наявність цифр/великих/маленьких/символів
        let score = 0;
        if (!pwd) return score;

        if (pwd.length >= 6) score += 1;
        if (pwd.length >= 10) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

        return score; // 0..5
    }

    function updateStrengthUI(pwd) {
        const score = evaluatePasswordStrength(pwd);
        const percent = (score / 5) * 100;
        strengthBar.style.width = percent + '%';

        let text = '—';
        let cls = '';
        if (score <= 1) { text = 'Дуже слабий'; cls = 'bg-danger'; }
        else if (score === 2) { text = 'Слабкий'; cls = 'bg-warning'; }
        else if (score === 3) { text = 'Середній'; cls = 'bg-info'; }
        else if (score >= 4) { text = 'Сильний'; cls = 'bg-success'; }

        strengthText.textContent = `Сила пароля: ${text}`;
        // remove previous classes and add new
        strengthBar.className = 'progress-bar ' + cls;
    }

    newPasswordInput.addEventListener('input', (e) => {
        updateStrengthUI(e.target.value);
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageDiv.innerHTML = '';

        const username = usernameInput.value.trim();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!username || !newPassword || !confirmPassword) {
            showMessage('Заповніть усі поля.', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('Пароль має містити щонайменше 6 символів.', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Паролі не співпадають.', 'warning');
            return;
        }

        // Disable button to avoid double submits
        submitBtn.disabled = true;
        const origHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Зачекайте...`;

        try {
            // Заміни шлях, якщо API в іншому місці
            const response = await fetch('/guest/update-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    newPassword: newPassword
                })
            });

            if (response.ok) {
                const text = await response.text().catch(() => null);
                showMessage(text || 'Пароль успішно змінено.', 'success');
                form.reset();
                updateStrengthUI('');
            } else {
                // спробуємо отримати повідомлення з відповіді
                let errText = 'Не вдалось змінити пароль.';
                try {
                    const json = await response.json();
                    if (json && (json.message || json.error)) {
                        errText = json.message || json.error;
                    } else if (typeof json === 'string') {
                        errText = json;
                    }
                } catch {
                    // не JSON
                    try {
                        const txt = await response.text();
                        if (txt) errText = txt;
                    } catch {}
                }

                showMessage(errText, 'danger');
            }
        } catch (err) {
            showMessage('Помилка мережі або сервер недоступний.', 'danger');
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    });
});

// Функція для кнопки "Назад"
function goBack() {
    window.history.back();
}
