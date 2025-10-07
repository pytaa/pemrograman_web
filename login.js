localStorage.setItem("isLoggedIn", "true");

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const validUsername = "admin";
  const validPassword = "12345";

  // Cek kondisi satu per satu
  if (username === validUsername && password === validPassword) {
    localStorage.setItem("isLoggedIn", "true");
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
});
