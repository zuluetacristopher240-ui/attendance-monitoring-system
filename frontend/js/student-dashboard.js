/**
 * student-dashboard.js
 * Student Dashboard — My Attendance + Check-in + My Subjects.
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

// ============================================
// ✅ LOAD MY SUBJECTS (student)
// ============================================
async function loadMySubjects() {
  const list = document.getElementById('subjectsList');

  try {
    const subjects = await API.get('/api/subjects/my');

    list.innerHTML = '';

    if (!subjects || subjects.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 36px; margin-bottom: 8px;">📚</div>
          <p style="color: #666; font-size: 14px; font-weight: 500;">No subjects enrolled</p>
          <p style="color: #999; font-size: 12px; margin-top: 4px;">
            Ask your teacher to enroll you in a subject.
          </p>
        </div>
      `;
      return;
    }

    subjects.forEach(s => {
      const card = document.createElement('div');
      card.style.cssText = `
        padding: 12px 14px;
        border: 1px solid #E7E3DA;
        border-radius: 8px;
        margin-bottom: 8px;
        background: #F7F5F1;
      `;

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
          <div>
            <p style="font-weight: 600; color: #1B2A4A; font-size: 14px; margin: 0;">
              ${escapeHtml(s.subject_code)} — ${escapeHtml(s.subject_name)}
            </p>
            <p style="color: #6B7280; font-size: 12px; margin: 4px 0 0 0;">
              ${escapeHtml(s.class_code)} (${escapeHtml(s.year_level)} - ${escapeHtml(s.section)})
            </p>
            <p style="color: #6B7280; font-size: 12px; margin: 2px 0 0 0;">
              Teacher: ${escapeHtml(s.teacher_name) || 'N/A'}
            </p>
          </div>
        </div>
      `;
      list.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading subjects:', error);
    list.innerHTML = `
      <p style="color: #D64550; font-size: 13px; text-align: center;">
        ${escapeHtml(error.message)}
      </p>
    `;
  }
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
          <td colspan="4" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No attendance records yet</p>
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Records will appear here once you check in or your teacher marks your attendance.
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
      dateTd.textContent = record.date || '-';
      row.appendChild(dateTd);

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
        <td colspan="4" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

// ✅ Initial load
loadMySubjects();
loadMyAttendance(false);

// ✅ Auto-refresh every 5 seconds
pollInterval = setInterval(() => {
  if (document.hidden) return;
  loadMyAttendance(true);
}, 5000);

window.addEventListener('beforeunload', () => {
  if (pollInterval) clearInterval(pollInterval);
});

// ============================================
// ✅ CHECK-IN BUTTON
// ============================================
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

    showToast(data.message, data.status || 'present');

    loadMyAttendance(false);

  } catch (error) {
    console.error('Error checking in:', error);
    message.textContent = error.message || 'Check-in failed.';
    message.style.color = '#D64550';
    showToast(error.message, 'absent');

  } finally {
    btn.disabled = false;
    btn.textContent = 'Check In';
  }
});