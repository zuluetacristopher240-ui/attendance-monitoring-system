function requireAuth(allowedRoles) {
  allowedRoles = allowedRoles || [];
  const token = localStorage.getItem("token");
  const expiry = parseInt(localStorage.getItem("tokenExpiry") || "0", 10);
  let user = null;
  try { user = JSON.parse(localStorage.getItem("user")); } catch (e) { user = null; }
  if (!token || !user) { redirectToLogin(); return null; }
  if (expiry && Date.now() > expiry) { clearAuth(); redirectToLogin(); return null; }
  if (allowedRoles.length > 0 && allowedRoles.indexOf(user.role) === -1) {
    alert("Access denied. You do not have permission to view this page.");
    redirectToLogin();
    return null;
  }
  const welcomeEl = document.getElementById("welcomeUser");
  if (welcomeEl) welcomeEl.textContent = "Welcome, " + user.full_name + "!";
  return user;
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;
  logoutBtn.addEventListener("click", function(e) {
    e.preventDefault();
    clearAuth();
    redirectToLogin();
  });
}

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("tokenExpiry");
}

function redirectToLogin() {
  if (window.location.pathname.indexOf("login.html") === -1) {
    window.location.href = "/pages/login.html";
  }
}

function saveAuth(token, user, expiresInSeconds) {
  expiresInSeconds = expiresInSeconds || 28800;
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("tokenExpiry", String(Date.now() + expiresInSeconds * 1000));
}
