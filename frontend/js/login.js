const roleSelector = document.getElementById('roleSelector');
const loginFormContainer = document.getElementById('loginFormContainer');
const loginTitle = document.getElementById('loginTitle');

// ITO ANG NAWAWALA DATI — kailangan i-track kung anong role button ang pinindot
let selectedRole = null;

// PAG-CLICK NG TEACHER BUTTON
document.getElementById('teacherRoleBtn').addEventListener('click', function() {
  selectedRole = 'teacher';
  loginTitle.textContent = 'Teacher Login';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

// PAG-CLICK NG STUDENT BUTTON
document.getElementById('studentRoleBtn').addEventListener('click', function() {
  selectedRole = 'student';
  loginTitle.textContent = 'Student Login';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

// PAG-CLICK NG ADMIN LINK
document.getElementById('adminRoleLink').addEventListener('click', function(e) {
  e.preventDefault();
  selectedRole = 'admin';
  loginTitle.textContent = 'Admin Login';
  roleSelector.classList.add('hidden');
  loginFormContainer.classList.remove('hidden');
});

// PAG-CLICK NG BACK BUTTON
document.getElementById('backBtn').addEventListener('click', function(e) {
  e.preventDefault();
  loginFormContainer.classList.add('hidden');
  roleSelector.classList.remove('hidden');
  document.getElementById('loginForm').reset();
  document.getElementById('errorMessage').textContent = '';
  selectedRole = null;
});

// LOGIN FORM SUBMIT (parehong logic gaya ng dati)
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  if (username === '' || password === '') {
    errorMessage.textContent = 'Please fill in all fields.';
    return;
  }

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, role: selectedRole })
    });

    const data = await response.json();

    if (!response.ok) {
      errorMessage.textContent = data.message || 'Login failed.';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    errorMessage.style.color = 'green';
    errorMessage.textContent = 'Login successful! Redirecting...';

    setTimeout(() => {
      if (data.user.role === 'admin') {
        window.location.href = '/pages/admin-dashboard.html';
      } else if (data.user.role === 'teacher') {
        window.location.href = '/pages/teacher-dashboard.html';
      } else {
        window.location.href = '/pages/student-dashboard.html';
      }
    }, 1000);

  } catch (error) {
    errorMessage.textContent = 'Server error. Please try again.';
    console.error(error);
  }
});