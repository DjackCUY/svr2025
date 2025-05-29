        document.addEventListener('DOMContentLoaded', function() {
            const loginForm = document.getElementById('loginForm');
            const emailInput = document.getElementById('userAca');
            const passwordInput = document.getElementById('passAca');
            const feedbackMessage = document.getElementById('feedbackMessage');

            loginForm.addEventListener('submit', async function(event) {
                event.preventDefault();

                // Sembunyikan pesan feedback sebelumnya
                feedbackMessage.style.display = 'none';
                feedbackMessage.classList.remove('success', 'error');
                feedbackMessage.textContent = '';

                const email = emailInput.value.trim();
                const password = passwordInput.value.trim();

                // Validasi input
                if (email === '' || password === '') {
                    displayMessage('Email dan kata sandi harus diisi.', 'error');
                    return;
                }

                if (!isValidEmail(email)) {
                    displayMessage('Format email tidak valid.', 'error');
                    return;
                }

                try {
                    // Mengirim request login ke API server
                    const response = await fetch('../../api/login.js', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, password }),
                    });

                    const result = await response.json();

                    if (result.success) {
                        document.getElementById('loginPage').style.display = 'none';
                        document.getElementById('tableP').style.display = 'block';
                    } else {
                        displayMessage(result.message || 'Login gagal.', 'error');
                    }
                } catch (error) {
                    displayMessage('Terjadi kesalahan koneksi.', 'error');
                }
            });

            // Fungsi untuk menampilkan pesan feedback
            function displayMessage(message, type) {
                feedbackMessage.textContent = message;
                feedbackMessage.classList.add(type);
                feedbackMessage.style.display = 'block';
            }

            // Fungsi validasi format email
            function isValidEmail(email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(email);
            }
        });