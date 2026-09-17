function showToast(message, type) {
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
}
