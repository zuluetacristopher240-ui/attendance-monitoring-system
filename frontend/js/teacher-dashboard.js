/**
 * teacher-dashboard.js
 * Teacher Dashboard — stats + heatmap.
 */

// ✅ Auth check — teacher only
const user = requireAuth(['teacher']);
if (!user) throw new Error('Not authenticated');

setupLogout();

// ============================================
// ✅ LOAD STATS (today)
// ============================================
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

// ============================================
// ✅ LOAD HEATMAP
// ============================================
async function loadHeatmap() {
  const grid = document.getElementById('heatmapGrid');
  const monthLabel = document.getElementById('heatmapMonth');

  try {
    const data = await API.get('/api/attendance/heatmap');

    monthLabel.textContent = `${data.monthName} ${data.year}`;

    if (!data.days || data.days.length === 0) {
      grid.innerHTML = `<p style="color: #999; font-size: 13px;">Walang data pa.</p>`;
      return;
    }

    grid.innerHTML = '';

    const firstDayDate = new Date(data.year, data.month - 1, 1);
    const firstDayOfWeek = firstDayDate.getDay();
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement('div');
      empty.className = 'heatmap-cell empty';
      grid.appendChild(empty);
    }

    function getLevel(rate, marked) {
      if (marked === 0) return 'level-empty';
      if (rate >= 80) return 'level-4';
      if (rate >= 60) return 'level-3';
      if (rate >= 40) return 'level-2';
      if (rate >= 1) return 'level-1';
      return 'level-empty';
    }

    data.days.forEach(d => {
      const cell = document.createElement('div');
      const level = getLevel(d.rate, d.marked);
      cell.className = `heatmap-cell ${level}`;
      cell.textContent = d.day;

      const tooltip = document.createElement('div');
      tooltip.className = 'heatmap-tooltip';
      if (d.marked === 0) {
        tooltip.innerHTML = `
          <strong>${d.date}</strong><br>
          Walang attendance record
        `;
      } else {
        tooltip.innerHTML = `
          <strong>${d.date}</strong><br>
          Rate: ${d.rate}%<br>
          ✅ Present: ${d.present}<br>
          ⏰ Late: ${d.late}<br>
          ❌ Absent: ${d.absent}
        `;
      }
      cell.appendChild(tooltip);

      grid.appendChild(cell);
    });

  } catch (error) {
    console.error('Error loading heatmap:', error);
    grid.innerHTML = `<p style="color: #D64550; font-size: 13px;">${escapeHtml(error.message)}</p>`;
  }
}

// ============================================
// ✅ INITIAL LOAD
// ============================================
loadDashboardStats();
loadHeatmap();