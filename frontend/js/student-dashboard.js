/**
 * student-dashboard.js
 * Student Dashboard — My Attendance History only.
 */

// ✅ Auth check — student only
const user = requireAuth(['student']);
if (!user) throw new Error('Not authenticated');

setupLogout();

let lastKnownStatus = null;
let hasInitialized = false;
let pollInterval = null;

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ============================================
// ✅ LOAD MY ATTENDANCE
// ============================================
async function loadMyAttendance(notify = false) {
  const tableBody = document.getElementById('myAttendanceTableBody');

  try {
    const records = await API.get('/api/attendance/my');

    tableBody.innerHTML = '';

    if (!records || records.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No attendance records yet</p>
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Your records will appear here once you join a class and check in.
            </p>
          </td>
        </tr>
      `;
      hasInitialized = true;
      return;
    }

    const todayRecord = records.find(r => r.date && r.date.split('T')[0] === getTodayDate());
    const todayStatus = todayRecord ? todayRecord.status : null;

    if (notify && hasInitialized && todayStatus && todayStatus !== lastKnownStatus) {
      const labelMap = { present: 'marked Present', late: 'marked Late', absent: 'marked Absent' };
      showToast(`Your teacher ${labelMap[todayStatus] || 'updated your status'} today.`, todayStatus);
    }
    lastKnownStatus = todayStatus;
    hasInitialized = true;

    records.forEach(record => {
      const row = document.createElement('tr');

      const dateTd = document.createElement('td');
      const d = record.date ? record.date.split('T')[0] : '-';
      dateTd.textContent = d;
      row.appendChild(dateTd);

      const subjectTd = document.createElement('td');
      subjectTd.textContent = record.subject_code 
        ? `${record.subject_code} — ${record.subject_name}` 
        : '-';
      row.appendChild(subjectTd);

      const statusTd = document.createElement('td');
      let badgeClass = 'status-none';
      let badgeText = record.status;
      if (record.status === 'present') { badgeClass = 'status-present'; badgeText = 'Present'; }
      else if (record.status === 'absent') { badgeClass = 'status-absent'; badgeText = 'Absent'; }
      else if (record.status === 'late') { badgeClass = 'status-late'; badgeText = 'Late'; }
      statusTd.innerHTML = `<span class="status-badge ${badgeClass}">${escapeHtml(badgeText)}</span>`;
      row.appendChild(statusTd);

      const timeTd = document.createElement('td');
      timeTd.textContent = record.time_in || '-';
      row.appendChild(timeTd);

      const remarksTd = document.createElement('td');
      remarksTd.textContent = record.remarks || '-';
      row.appendChild(remarksTd);

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading attendance:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

// ============================================
// ✅ INITIAL LOAD
// ============================================
loadMyAttendance(false);

// ✅ Auto-refresh every 5 seconds
pollInterval = setInterval(() => {
  if (document.hidden) return;
  loadMyAttendance(true);
}, 5000);

window.addEventListener('beforeunload', () => {
  if (pollInterval) clearInterval(pollInterval);
});