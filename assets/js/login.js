        // Mendapatkan referensi ke elemen form dan input
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('userAca');
        const passwordInput = document.getElementById('passAca');
        const feedbackMessage = document.getElementById('feedbackMessage');

        // Menambahkan event listener untuk submit form
        loginForm.addEventListener('submit', function(event) {
            // Mencegah pengiriman form default (mencegah reload halaman)
            event.preventDefault();

            // Sembunyikan pesan feedback sebelumnya
            feedbackMessage.style.display = 'none';
            feedbackMessage.classList.remove('success', 'error');
            feedbackMessage.textContent = '';

            // Mendapatkan nilai input
            const email = emailInput.value.trim(); // .trim() untuk menghapus spasi di awal/akhir
            const password = passwordInput.value.trim();

            // Validasi sederhana
            if (email === '' || password === '') {
                displayMessage('Email dan kata sandi harus diisi.', 'error');
                return; // Hentikan eksekusi jika ada error
            }

            // Contoh validasi sisi klien yang lebih kompleks (opsional)
            if (!isValidEmail(email)) {
                displayMessage('Format email tidak valid.', 'error');
                return;
            }

            setTimeout(() => {            
            // Check credentials
            if (email == process.env.USERACA && password == process.env.PASSACA) {
                // Show appropriate dashboard
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('tableP').style.display = 'block';
            } else {
                displayMessage('Username atau kata sandi salah. Silakan coba lagi.', 'error');
            }
            }, 1000); // Simulasi delay 1.5 detik
        });

        // Fungsi untuk menampilkan pesan feedback
        function displayMessage(message, type) {
            feedbackMessage.textContent = message;
            feedbackMessage.classList.add(type);
            feedbackMessage.style.display = 'block';
        }

        // Fungsi validasi format email sederhana
        function isValidEmail(email) {
            // Regex sederhana untuk validasi email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }