/**
 * student-dashboard.js
 * Student Dashboard — My Attendance + Check-in.
 */

// ✅ Auth check — student lang
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

// ✅ Load my attendance
async function loadMyAttendance(notify = false) {
  const tableBody = document.getElementById('myAttendanceTableBody');

  try {
    const records = await API.get('/api/attendance/my');

    tableBody.innerHTML = '';

    if (!records || records.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No attendance records yet</p>
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Records will appear here once your teacher marks your attendance.
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

      // Date cell
      const dateTd = document.createElement('td');
      dateTd.textContent = record.date || '-';
      row.appendChild(dateTd);

      // Status badge cell
      const statusTd = document.createElement('td');
      let badgeClass = 'status-none';
      let badgeText = record.status;
      if (record.status === 'present') { badgeClass = 'status-present'; badgeText = 'Present'; }
      else if (record.status === 'absent') { badgeClass = 'status-absent'; badgeText = 'Absent'; }
      else if (record.status === 'late') { badgeClass = 'status-late'; badgeText = 'Late'; }
      statusTd.innerHTML = `<span class="status-badge ${badgeClass}">${escapeHtml(badgeText)}</span>`;
      row.appendChild(statusTd);

      // Time In cell
      const timeTd = document.createElement('td');
      timeTd.textContent = record.time_in || '-';
      row.appendChild(timeTd);

      // Remarks cell
      const remarksTd = document.createElement('td');
      remarksTd.textContent = record.remarks || '-';
      row.appendChild(remarksTd);

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading attendance:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

// ✅ Initial load
loadMyAttendance(false);

// ✅ Auto-refresh every 5 seconds
pollInterval = setInterval(() => {
  if (document.hidden) return;
  loadMyAttendance(true);
}, 5000);

// ✅ Clear interval kapag mag-navigate
window.addEventListener('beforeunload', () => {
  if (pollInterval) clearInterval(pollInterval);
});

// ✅ Check-in button
document.getElementById('checkInBtn').addEventListener('click', async function() {
  const btn = this;
  const code = document.getElementById('checkInCode').value.trim();
  const message = document.getElementById('checkInMessage');

  if (!code) {
    message.textContent = 'Please enter a code.';
    message.style.color = '#D64550';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Checking in...';

  try {
    const data = await API.post('/api/attendance/check-in', { code });

    message.textContent = data.message;
    message.style.color = '#2F9E67';
    document.getElementById('checkInCode').value = '';

    loadMyAttendance(false);

  } catch (error) {
    console.error('Error checking in:', error);
    message.textContent = error.message || 'Check-in failed.';
    message.style.color = '#D64550';

  } finally {
    btn.disabled = false;
    btn.textContent = 'Check In';
  }
});