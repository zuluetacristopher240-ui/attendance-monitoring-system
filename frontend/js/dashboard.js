// I-check kung naka-login
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
  window.location.href = '/pages/login.html';
} else {
  document.getElementById('welcomeUser').textContent = `Welcome, ${user.full_name}!`;
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
});

// I-LOAD ANG DASHBOARD STATS
async function loadDashboardStats() {
  try {
    const response = await fetch('/api/attendance/stats/today');
    const stats = await response.json();

    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('presentToday').textContent = stats.present || 0;
    document.getElementById('absentToday').textContent = stats.absent || 0;
    document.getElementById('lateToday').textContent = stats.late || 0;
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

loadDashboardStats();