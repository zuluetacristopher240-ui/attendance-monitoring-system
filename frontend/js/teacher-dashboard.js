/**
 * teacher-dashboard.js
 * Teacher Dashboard logic.
 */

// ✅ Auth check — teacher lang
const user = requireAuth(['teacher']);
if (!user) throw new Error('Not authenticated');

// ✅ Setup logout
setupLogout();

// ✅ Load stats
async function loadDashboardStats() {
  try {
    const stats = await API.get('/api/attendance/stats/today');

    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('presentToday').textContent = stats.present || 0;
    document.getElementById('absentToday').textContent = stats.absent || 0;
    document.getElementById('lateToday').textContent = stats.late || 0;

  } catch (error) {
    console.error('Error loading stats:', error);
    showToast(error.message, 'absent');
  }
}

loadDashboardStats();