#!/bin/bash

echo "Creating utils folder..."
mkdir -p frontend/js/utils

echo "Creating escapeHtml.js..."
echo 'function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'"'"'/g, "&#039;");
}

function createCell(text, className) {
  const td = document.createElement("td");
  td.textContent = text || "";
  if (className) td.className = className;
  return td;
}' > frontend/js/utils/escapeHtml.js

echo "Creating api.js..."
echo 'const API = {
  async request(url, options) {
    options = options || {};
    const token = localStorage.getItem("token");
    const config = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json"
      }
    };
    if (token) config.headers["Authorization"] = "Bearer " + token;
    if (options.headers) {
      for (const key in options.headers) {
        config.headers[key] = options.headers[key];
      }
    }
    if (options.body) {
      config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }
    const response = await fetch(url, config);
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiry");
      if (window.location.pathname.indexOf("login.html") === -1) {
        window.location.href = "/pages/login.html";
      }
      throw new Error("Session expired. Please log in again.");
    }
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch (e) { data = { message: text.slice(0, 200) }; }
    }
    if (!response.ok) {
      throw new Error((data && data.message) || "Request failed (HTTP " + response.status + ")");
    }
    return data;
  },
  get(url) { return this.request(url); },
  post(url, body) { return this.request(url, { method: "POST", body: body }); },
  put(url, body) { return this.request(url, { method: "PUT", body: body }); },
  delete(url) { return this.request(url, { method: "DELETE" }); }
};' > frontend/js/utils/api.js

echo "Creating auth.js..."
echo 'function requireAuth(allowedRoles) {
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
}' > frontend/js/utils/auth.js

echo "Creating toast.js..."
echo 'function showToast(message, type) {
  type = type || "present";
  const container = document.getElementById("toastContainer");
  if (!container) {
    console.warn("No #toastContainer found on page.");
    return;
  }
  const toast = document.createElement("div");
  toast.className = "toast toast-" + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function() {
    toast.classList.add("toast-out");
    setTimeout(function() { toast.remove(); }, 300);
  }, 4000);
}' > frontend/js/utils/toast.js

echo ""
echo "DONE! Batch 1 complete."
echo ""
ls -la frontend/js/utils/