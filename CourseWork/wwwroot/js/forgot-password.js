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
        let score = 0;
        if (!pwd) return score;

        if (pwd.length >= 6) score += 1;
        if (pwd.length >= 10) score += 1;
        if (/[0-9]/.test(pwd)) score += 1;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score += 1;
        if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

        return score;
    }

    function updateStrengthUI(pwd) {
        const score = evaluatePasswordStrength(pwd);
        const percent = (score / 5) * 100;
        strengthBar.style.width = percent + '%';

        let text = '—';
        let cls = '';
        if (score <= 1) { text = 'Very Weak'; cls = 'bg-danger'; }
        else if (score === 2) { text = 'Weak'; cls = 'bg-warning'; }
        else if (score === 3) { text = 'Medium'; cls = 'bg-info'; }
        else if (score >= 4) { text = 'Strong'; cls = 'bg-success'; }

        strengthText.textContent = `Password strength: ${text}`;
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
            showMessage('Please fill in all fields.', 'warning');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('Password must be at least 6 characters.', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match.', 'warning');
            return;
        }

        submitBtn.disabled = true;
        const origHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Please wait...`;

        try {
            const response = await fetch('/guest/update-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, newPassword })
            });

            if (response.ok) {
                const text = await response.text().catch(() => null);
                showMessage(text || 'Password successfully changed.', 'success');
                form.reset();
                updateStrengthUI('');
            } else {
                let errText = 'Failed to change password.';
                try {
                    const json = await response.json();
                    if (json && (json.message || json.error)) {
                        errText = json.message || json.error;
                    } else if (typeof json === 'string') {
                        errText = json;
                    }
                } catch {
                    try {
                        const txt = await response.text();
                        if (txt) errText = txt;
                    } catch {}
                }
                showMessage(errText, 'danger');
            }
        } catch (err) {
            showMessage('Network error or server unavailable.', 'danger');
            console.error(err);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = origHtml;
        }
    });
});

// Back button function
function goBack() {
    window.history.back();
}
