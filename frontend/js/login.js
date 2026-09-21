/**
 * login.js
 * Login page — role selector + form submission.
 */

const roleSelector = document.getElementById('roleSelector');
const loginFormContainer = document.getElementById('loginFormContainer');
const loginTitle = document.getElementById('loginTitle');
const loginSubtitle = document.getElementById('loginSubtitle');

let selectedRole = null;

// ============================================
// ✅ ROLE BUTTONS
// ============================================
document.getElementById('teacherRoleBtn').addEventListener('click', function() {
  selectedRole = 'teacher';
  loginTitle.textContent = 'Teacher Login';
  loginSubtitle.textContent = 'Welcome back, teacher!';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

document.getElementById('studentRoleBtn').addEventListener('click', function() {
  selectedRole = 'student';
  loginTitle.textContent = 'Student Login';
  loginSubtitle.textContent = 'Welcome back, student!';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

document.getElementById('adminRoleLink').addEventListener('click', function(e) {
  e.preventDefault();
  selectedRole = 'admin';
  loginTitle.textContent = 'Admin Login';
  loginSubtitle.textContent = 'Administrator access';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

// ============================================
// ✅ BACK BUTTON
// ============================================
document.getElementById('backBtn').addEventListener('click', function(e) {
  e.preventDefault();
  loginFormContainer.classList.add('hidden');
  roleSelector.classList.remove('hidden');
  document.getElementById('loginForm').reset();
  document.getElementById('errorMessage').textContent = '';
  selectedRole = null;
});

// ============================================
// ✅ SHOW/HIDE PASSWORD
// ============================================
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePasswordBtn.addEventListener('click', function() {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  this.querySelector('.eye-icon').textContent = isPassword ? '🙈' : '👁';
  this.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
});

// ============================================
// ✅ FORGOT PASSWORD (placeholder)
// ============================================
document.getElementById('forgotPasswordLink').addEventListener('click', function(e) {
  e.preventDefault();
  alert('Please contact the administrator to reset your password.');
});

// ============================================
// ✅ LOGIN FORM SUBMIT
// ============================================
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('rememberMe').checked;
  const errorMessage = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  // ✅ Reset error
  errorMessage.textContent = '';

  // ✅ Validation
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

  // ✅ Loading state
  submitBtn.disabled = true;
  btnText.textContent = 'Logging in...';
  btnSpinner.classList.remove('hidden');

  try {
    const data = await API.post('/api/auth/login', {
      username,
      password,
      role: selectedRole
    });

    // ✅ Save auth — 8 hours o 30 days kung "Remember me"
    const expiry = rememberMe ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
    saveAuth(data.token, data.user, expiry);

    errorMessage.style.color = '#2F9E67';
    errorMessage.textContent = '✅ Login successful! Redirecting...';

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
    errorMessage.textContent = '❌ ' + (error.message || 'Login failed.');
    errorMessage.style.color = '#D64550';
    submitBtn.disabled = false;
    btnText.textContent = 'Login';
    btnSpinner.classList.add('hidden');
  }
});