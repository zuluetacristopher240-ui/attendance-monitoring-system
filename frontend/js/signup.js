const signupRoleButtons = document.getElementById('signupRoleButtons');
const signupForm = document.getElementById('signupForm');
const studentFields = document.getElementById('studentFields');

document.getElementById('signupTeacherBtn').addEventListener('click', function() {
  document.getElementById('signupRole').value = 'teacher';
  studentFields.classList.add('hidden');
  document.getElementById('studentId').required = false;
  document.getElementById('yearLevel').required = false;
  document.getElementById('section').required = false;
  signupRoleButtons.classList.add('hidden');
  signupForm.classList.remove('hidden');
});

document.getElementById('signupStudentBtn').addEventListener('click', function() {
  document.getElementById('signupRole').value = 'student';
  studentFields.classList.remove('hidden');
  document.getElementById('studentId').required = true;
  document.getElementById('yearLevel').required = true;
  document.getElementById('section').required = true;
  signupRoleButtons.classList.add('hidden');
  signupForm.classList.remove('hidden');
});

document.getElementById('signupBackBtn').addEventListener('click', function(e) {
  e.preventDefault();
  signupForm.classList.add('hidden');
  signupRoleButtons.classList.remove('hidden');
  signupForm.reset();
  document.getElementById('signupMessage').textContent = '';
});

signupForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const message = document.getElementById('signupMessage');
  const role = document.getElementById('signupRole').value;

  const payload = {
    username: document.getElementById('username').value,
    password: document.getElementById('password').value,
    role: role,
    full_name: document.getElementById('fullName').value
  };

  if (role === 'student') {
    payload.student_id = document.getElementById('studentId').value;
    payload.year_level = document.getElementById('yearLevel').value;
    payload.section = document.getElementById('section').value;
  }

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      message.style.color = '#D64550';
      message.textContent = data.message || 'Sign up failed.';
      return;
    }

    message.style.color = '#2F9E67';
    message.textContent = 'Account created! Redirecting to login...';

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);

  } catch (error) {
    message.style.color = '#D64550';
    message.textContent = 'Server error. Please try again.';
    console.error(error);
  }
});