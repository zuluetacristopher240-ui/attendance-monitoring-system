/**
 * signup.js
 * Signup page — role selector + registration form.
 */

const signupRoleButtons = document.getElementById('signupRoleButtons');
const signupForm = document.getElementById('signupForm');
const studentFields = document.getElementById('studentFields');
const message = document.getElementById('signupMessage');

// Teacher button
document.getElementById('signupTeacherBtn').addEventListener('click', function() {
  document.getElementById('signupRole').value = 'teacher';
  studentFields.classList.add('hidden');
  document.getElementById('studentId').required = false;
  document.getElementById('yearLevel').required = false;
  document.getElementById('section').required = false;
  signupRoleButtons.classList.add('hidden');
  signupForm.classList.remove('hidden');
});

// Student button
document.getElementById('signupStudentBtn').addEventListener('click', function() {
  document.getElementById('signupRole').value = 'student';
  studentFields.classList.remove('hidden');
  document.getElementById('studentId').required = true;
  document.getElementById('yearLevel').required = true;
  document.getElementById('section').required = true;
  signupRoleButtons.classList.add('hidden');
  signupForm.classList.remove('hidden');
});

// Back button
document.getElementById('signupBackBtn').addEventListener('click', function(e) {
  e.preventDefault();
  signupForm.classList.add('hidden');
  signupRoleButtons.classList.remove('hidden');
  signupForm.reset();
  message.textContent = '';
});

// Form submit
signupForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  message.style.color = '#D64550';

  const role = document.getElementById('signupRole').value;

  if (!role) {
    message.textContent = 'Please select a role first.';
    return;
  }

  const payload = {
    username: document.getElementById('username').value.trim(),
    password: document.getElementById('password').value,
    role: role,
    full_name: document.getElementById('fullName').value.trim()
  };

  // Validation
  if (!payload.username || !payload.password || !payload.full_name) {
    message.textContent = 'Please fill in all fields.';
    return;
  }

  // Student-specific fields
  if (role === 'student') {
    payload.student_id = document.getElementById('studentId').value.trim();
    payload.year_level = document.getElementById('yearLevel').value.trim();
    payload.section = document.getElementById('section').value.trim();

    if (!payload.student_id || !payload.year_level || !payload.section) {
      message.textContent = 'Please fill in all student fields.';
      return;
    }
  }

  const submitBtn = this.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    await API.post('/api/auth/register', payload);

    message.style.color = '#2F9E67';
    message.textContent = 'Account created! Redirecting to login...';

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);

  } catch (error) {
    console.error('Signup error:', error);
    message.textContent = error.message || 'Sign up failed.';
    message.style.color = '#D64550';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
});