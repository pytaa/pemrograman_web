const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const validUsername = "admin";
  const validPassword = "12345";

  // Reset pesan error
  errorMsg.textContent = "";

  // Sembunyikan tombol sementara dan tampilkan indikator loading
  const btn = form.querySelector("button");
  btn.disabled = true;
  btn.textContent = "⏳ Memeriksa...";

  setTimeout(() => {
    if (username === validUsername && password === validPassword) {
      // ✅ Jika login benar
      localStorage.setItem("isLoggedIn", "true");
      alert("Login berhasil! Mode Edit diaktifkan.");

      // Redirect ke halaman utama
      window.location.href = "latihan-html.html";
    } 
    else if (username !== validUsername && password === validPassword) {
      errorMsg.textContent = "Username salah!";
    } 
    else if (username === validUsername && password !== validPassword) {
      errorMsg.textContent = "Password salah!";
    } 
    else {
      errorMsg.textContent = "Username dan password salah!";
    }

    // Kembalikan tombol seperti semula
    btn.disabled = false;
    btn.textContent = "Masuk";
  }, 800); // jeda 0.8 detik biar ada efek proses login
});
