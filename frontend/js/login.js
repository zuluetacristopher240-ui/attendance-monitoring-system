/**
 * login.js
 * Login page — role selector + form submission.
 */

const roleSelector = document.getElementById('roleSelector');
const loginFormContainer = document.getElementById('loginFormContainer');
const loginTitle = document.getElementById('loginTitle');

let selectedRole = null;

// Teacher role button
document.getElementById('teacherRoleBtn').addEventListener('click', function() {
  selectedRole = 'teacher';
  loginTitle.textContent = 'Teacher Login';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

// Student role button
document.getElementById('studentRoleBtn').addEventListener('click', function() {
  selectedRole = 'student';
  loginTitle.textContent = 'Student Login';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

// Admin link
document.getElementById('adminRoleLink').addEventListener('click', function(e) {
  e.preventDefault();
  selectedRole = 'admin';
  loginTitle.textContent = 'Admin Login';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

// Back button
document.getElementById('backBtn').addEventListener('click', function(e) {
  e.preventDefault();
  loginFormContainer.classList.add('hidden');
  roleSelector.classList.remove('hidden');
  document.getElementById('loginForm').reset();
  document.getElementById('errorMessage').textContent = '';
  selectedRole = null;
});

// Login form submit
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  if (!username || !password) {
    errorMessage.textContent = 'Please fill in all fields.';
    errorMessage.style.color = '#D64550';
    return;
  }

  if (!selectedRole) {
    errorMessage.textContent = 'Please select a role first.';
    errorMessage.style.color = '#D64550';
    return;
  }

  const submitBtn = this.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const data = await API.post('/api/auth/login', {
      username,
      password,
      role: selectedRole
    });

    saveAuth(data.token, data.user, 8 * 60 * 60);

    errorMessage.style.color = '#2F9E67';
    errorMessage.textContent = 'Login successful! Redirecting...';

    setTimeout(() => {
      if (data.user.role === 'admin') {
        window.location.href = '/pages/admin-dashboard.html';
      } else if (data.user.role === 'teacher') {
        window.location.href = '/pages/teacher-dashboard.html';
      } else {
        window.location.href = '/pages/student-dashboard.html';
      }
    }, 800);

  } catch (error) {
    console.error('Login error:', error);
    errorMessage.textContent = error.message || 'Login failed.';
    errorMessage.style.color = '#D64550';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
});