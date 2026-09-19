/**
 * student-dashboard.js
 * Student Dashboard — My Subjects, Join Class, Attendance History.
 */

// ✅ Auth check — student lang
const user = requireAuth(['student']);
if (!user) throw new Error('Not authenticated');

setupLogout();

let lastKnownStatus = null;
let hasInitialized = false;
let pollInterval = null;
let currentJoinSubjectId = null;

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ============================================
// ✅ LOAD MY SUBJECTS (with active session info)
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
          <p style="color: #666; font-size: 14px; font-weight: 500;">You haven't joined any subject yet.</p>
          <p style="color: #999; font-size: 12px; margin-top: 4px;">
            Enter a code from your teacher below to get started.
          </p>
        </div>
      `;
      return;
    }

    subjects.forEach(s => {
      const hasActive = s.active_session_id && s.active_session_end_time;
      const card = document.createElement('div');
      card.className = 'subject-card';

      card.innerHTML = `
        <div class="subject-info">
          <p class="subject-title">
            ${escapeHtml(s.subject_code)} — ${escapeHtml(s.subject_name)}
          </p>
          <p class="subject-meta">
            ${escapeHtml(s.class_code)} (${escapeHtml(s.year_level)} - ${escapeHtml(s.section)})
          </p>
          <p class="subject-meta">
            Teacher: ${escapeHtml(s.teacher_name) || 'N/A'}
          </p>
          ${hasActive 
            ? `<p class="subject-status-active">
                 🟢 Active session ${s.active_session_end_time ? `(until ${s.active_session_end_time})` : ''}
               </p>` 
            : `<p class="subject-status-none">⚪ No active session</p>`
          }
        </div>
        <button class="btn-primary join-btn" data-subject-id="${s.subject_id}" data-subject-name="${escapeHtml(s.subject_code)} — ${escapeHtml(s.subject_name)}">
          Join Class
        </button>
      `;
      list.appendChild(card);
    });

    // ✅ Attach click handlers sa Join buttons
    list.querySelectorAll('.join-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openJoinModal(
          parseInt(btn.dataset.subjectId, 10),
          btn.dataset.subjectName
        );
      });
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
// ✅ JOIN MODAL
// ============================================
function openJoinModal(subjectId, subjectName) {
  currentJoinSubjectId = subjectId;
  document.getElementById('joinModalTitle').textContent = `Join: ${subjectName}`;
  document.getElementById('joinModalSubtitle').textContent = 'Enter the code from your teacher to check in.';
  document.getElementById('joinModalCode').value = '';
  document.getElementById('joinModal').classList.remove('hidden');
}

document.getElementById('cancelJoinBtn').addEventListener('click', () => {
  document.getElementById('joinModal').classList.add('hidden');
  currentJoinSubjectId = null;
});

// ============================================
// ✅ JOIN FORM SUBMIT (for specific subject)
// ============================================
document.getElementById('joinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('joinModalCode').value.trim();

  if (!code) {
    showToast('Please enter a code.', 'late');
    return;
  }

  await performCheckIn(code);
  document.getElementById('joinModal').classList.add('hidden');
  currentJoinSubjectId = null;
});

// ============================================
// ✅ JOIN NEW SUBJECT (general)
// ============================================
document.getElementById('joinNewBtn').addEventListener('click', async function() {
  const btn = this;
  const code = document.getElementById('joinNewCode').value.trim();
  const message = document.getElementById('joinNewMessage');

  if (!code) {
    message.textContent = 'Please enter a code.';
    message.style.color = '#D64550';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Joining...';
  message.textContent = '';

  try {
    const data = await API.post('/api/attendance/check-in', { code });

    message.textContent = data.message;
    message.style.color = '#2F9E67';
    document.getElementById('joinNewCode').value = '';

    showToast(data.message, data.status || 'present');

    loadMySubjects();
    loadMyAttendance(false);

  } catch (error) {
    console.error('Error joining:', error);
    message.textContent = error.message || 'Join failed.';
    message.style.color = '#D64550';
    showToast(error.message, 'absent');

  } finally {
    btn.disabled = false;
    btn.textContent = 'Join';
  }
});

// ============================================
// ✅ PERFORM CHECK-IN (shared function)
// ============================================
async function performCheckIn(code) {
  try {
    const data = await API.post('/api/attendance/check-in', { code });
    showToast(data.message, data.status || 'present');
    loadMySubjects();
    loadMyAttendance(false);
  } catch (error) {
    console.error('Error checking in:', error);
    showToast(error.message, 'absent');
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
loadMySubjects();
loadMyAttendance(false);

// ✅ Auto-refresh attendance every 5 seconds
pollInterval = setInterval(() => {
  if (document.hidden) return;
  loadMyAttendance(true);
}, 5000);

window.addEventListener('beforeunload', () => {
  if (pollInterval) clearInterval(pollInterval);
});