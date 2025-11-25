document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("register-form");
    const msg = document.getElementById("register-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const dto = {
            username: document.getElementById("username").value.trim(),
            password: document.getElementById("password").value.trim(),
            fullName: document.getElementById("fullname").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            address: document.getElementById("address").value.trim()
        };

        // Send request
        try {
            const response = await fetch("/guest/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(dto)
            });

            const text = await response.text();

            msg.innerHTML = `
                <div class="alert ${response.ok ? "alert-success" : "alert-danger"}">
                    ${text}
                </div>
            `;

            if (response.ok) {
                form.reset();

                // Optional: redirect back to guest.html
                setTimeout(() => {
                    window.location.href = "guest.html";
                }, 1500);
            }

        } catch (err) {
            msg.innerHTML = `
                <div class="alert alert-danger">
                    Server connection error.
                </div>
            `;
        }
    });
});

function goBack() {
    window.location.href = "guest.html";
}
