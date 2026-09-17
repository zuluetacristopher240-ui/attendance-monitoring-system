/**
 * dashboard.js
 * Admin at Teacher Dashboard logic.
 */

// ✅ Auth check gamit ang bagong helper
const user = requireAuth(['admin', 'teacher']);
if (!user) throw new Error('Not authenticated');

// ✅ Setup logout button
setupLogout();

// ✅ Load dashboard stats gamit ang API helper
async function loadDashboardStats() {
  try {
    const stats = await API.get('/api/attendance/stats/today');

    document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
    document.getElementById('presentToday').textContent = stats.present || 0;
    document.getElementById('absentToday').textContent = stats.absent || 0;
    document.getElementById('lateToday').textContent = stats.late || 0;

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    showToast(error.message, 'absent');
  }
}

// ✅ I-load sa page load
loadDashboardStats();