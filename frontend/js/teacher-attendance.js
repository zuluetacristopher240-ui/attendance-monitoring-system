/**
 * teacher-attendance.js
 * Teacher "Take Attendance" logic with live polling.
 */

// ✅ Auth check — teacher lang
const user = requireAuth(['teacher']);
if (!user) throw new Error('Not authenticated');

setupLogout();

const dateInput = document.getElementById('attendanceDate');
const tableBody = document.getElementById('attendanceTableBody');
const summaryText = document.getElementById('summaryText');

let lastKnownTimeIn = {};
let pollInterval = null;

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

dateInput.value = getTodayDate();

// ✅ Load attendance
async function loadAttendance(notify = false) {
  const selectedDate = dateInput.value;

  try {
    const students = await API.get(`/api/attendance/${selectedDate}`);

    tableBody.innerHTML = '';

    if (!students || students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No students found</p>
          </td>
        </tr>
      `;
      summaryText.textContent = '';
      return;
    }

    let presentCount = 0, absentCount = 0, lateCount = 0, noneCount = 0;
    const newTimeIn = {};

    students.forEach(student => {
      const status = student.status;

      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'late') lateCount++;
      else noneCount++;

      newTimeIn[student.student_id] = student.time_in;

      // ✅ Toast kung may bagong check-in
      if (notify && student.time_in && student.time_in !== lastKnownTimeIn[student.student_id]) {
        showToast(`✓ ${student.full_name} checked in at ${student.time_in}`, 'present');
      }

      let badgeClass = 'status-none';
      let badgeText = 'Not Marked';
      if (status === 'present') { badgeClass = 'status-present'; badgeText = 'Present'; }
      else if (status === 'absent') { badgeClass = 'status-absent'; badgeText = 'Absent'; }
      else if (status === 'late') { badgeClass = 'status-late'; badgeText = 'Late'; }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(student.student_number)}</td>
        <td>${escapeHtml(student.full_name)}</td>
        <td>${escapeHtml(student.year_level)} - ${escapeHtml(student.section)}</td>
        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        <td>${escapeHtml(student.time_in) || '-'}</td>
        <td class="attendance-actions">
          <button class="btn-present" data-student-id="${student.student_id}" data-status="present">Present</button>
          <button class="btn-late" data-student-id="${student.student_id}" data-status="late">Late</button>
          <button class="btn-absent" data-student-id="${student.student_id}" data-status="absent">Absent</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    lastKnownTimeIn = newTimeIn;
    summaryText.textContent = `Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount} | Not Marked: ${noneCount}`;

  } catch (error) {
    console.error('Error loading attendance:', error);
  }
}

// ✅ Mark student
async function markStudent(studentId, status) {
  const selectedDate = dateInput.value;

  let timeIn = null;
  if (status === 'present' || status === 'late') {
    const now = new Date();
    timeIn = now.toTimeString().split(' ')[0];
  }

  try {
    await API.post('/api/attendance', {
      student_id: studentId,
      date: selectedDate,
      status: status,
      time_in: timeIn
    });

    loadAttendance(false);

  } catch (error) {
    console.error('Error marking attendance:', error);
    showToast(error.message, 'absent');
  }
}

// ✅ Event delegation
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-status]');
  if (!btn) return;

  const studentId = parseInt(btn.dataset.studentId, 10);
  const status = btn.dataset.status;

  markStudent(studentId, status);
});

dateInput.addEventListener('change', () => loadAttendance(false));

// ✅ Initial load
loadAttendance(false);

// ✅ Auto-refresh every 5 seconds (kung today ang selected date)
pollInterval = setInterval(() => {
  if (document.hidden) return;
  if (dateInput.value === getTodayDate()) {
    loadAttendance(true);
  }
}, 5000);

// ✅ Clear interval kapag mag-navigate
window.addEventListener('beforeunload', () => {
  if (pollInterval) clearInterval(pollInterval);
});

// ✅ Generate Check-In Code
document.getElementById('generateCodeBtn').addEventListener('click', async function() {
  const btn = this;
  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    const data = await API.post('/api/attendance/generate-code', {
      teacher_id: user.id
    });

    const codeDisplay = document.getElementById('codeDisplay');
    const codeText = document.getElementById('codeText');
    const codeTimer = document.getElementById('codeTimer');

    codeText.textContent = data.code;
    codeDisplay.classList.remove('hidden');

    let secondsLeft = 300;
    codeTimer.textContent = `Expires in 5:00`;

    const interval = setInterval(() => {
      secondsLeft--;
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      codeTimer.textContent = `Expires in ${mins}:${secs.toString().padStart(2, '0')}`;

      if (secondsLeft <= 0) {
        clearInterval(interval);
        codeDisplay.classList.add('hidden');
        loadAttendance(false);
      }
    }, 1000);

  } catch (error) {
    console.error('Error generating code:', error);
    showToast(error.message, 'absent');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Check-In Code';
  }
});