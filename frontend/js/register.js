// 📁 SECTION: frontend/js
// 📄 FILE PATH: frontend/js/register.js
// (i-save/i-replace mo dito sa project mo)

document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const full_name = document.getElementById('full_name').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const role = document.getElementById('role').value;
  const errorMessage = document.getElementById('errorMessage');

  errorMessage.style.color = 'red';

  if (!full_name || !username || !password || !role) {
    errorMessage.textContent = 'Please fill in all fields.';
    return;
  }

  if (password !== confirmPassword) {
    errorMessage.textContent = 'Passwords do not match.';
    return;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ full_name, username, password, role })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.textContent = data.message || 'Registration failed.';
      return;
    }

    errorMessage.style.color = 'green';
    errorMessage.textContent = 'Account created! Redirecting to login...';

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);

  } catch (error) {
    errorMessage.textContent = 'Server error. Please try again.';
    console.error(error);
  }
});
