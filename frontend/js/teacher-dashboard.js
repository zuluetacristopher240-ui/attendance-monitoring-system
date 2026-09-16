const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// I-PROTECT ANG PAGE — teacher lang ang makaka-access
if (!token || !user || user.role !== 'teacher') {
  window.location.href = '/pages/login.html';
} else {
  document.getElementById('welcomeUser').textContent = `Welcome, ${user.full_name}!`;
}

document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
});

async function loadDashboardStats() {
  try {
    const response = await fetch('/api/attendance/stats/today');
    const stats = await response.json();

    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('presentToday').textContent = stats.present || 0;
    document.getElementById('absentToday').textContent = stats.absent || 0;
    document.getElementById('lateToday').textContent = stats.late || 0;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

loadDashboardStats();