/**
 * teacher-attendance.js
 * Teacher "Take Attendance" logic with class/subject selection.
 */

// ✅ Auth check — teacher lang
const user = requireAuth(['teacher']);
if (!user) throw new Error('Not authenticated');

setupLogout();

const dateInput = document.getElementById('attendanceDate');
const tableBody = document.getElementById('attendanceTableBody');
const summaryText = document.getElementById('summaryText');

const classSelect = document.getElementById('classSelect');
const subjectSelect = document.getElementById('subjectSelect');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');

let lastKnownTimeIn = {};
let pollInterval = null;
let codeCountdownInterval = null;

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

dateInput.value = getTodayDate();

// ============================================
// ✅ LOAD CLASSES (teacher)
// ============================================
async function loadClasses() {
  try {
    const classes = await API.get('/api/classes/my');

    classSelect.innerHTML = '<option value="">-- Select Class --</option>';

    if (!classes || classes.length === 0) {
      classSelect.innerHTML = '<option value="">No classes found</option>';
      return;
    }

    classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.class_code} — ${c.class_name}`;
      classSelect.appendChild(opt);
    });

  } catch (error) {
    console.error('Error loading classes:', error);
    showToast(error.message, 'absent');
  }
}

// ============================================
// ✅ LOAD SUBJECTS (per class)
// ============================================
async function loadSubjects(classId) {
  subjectSelect.innerHTML = '<option value="">Loading...</option>';
  subjectSelect.disabled = true;

  try {
    const subjects = await API.get(`/api/classes/${classId}/subjects`);

    subjectSelect.innerHTML = '<option value="">-- Select Subject --</option>';

    if (!subjects || subjects.length === 0) {
      subjectSelect.innerHTML = '<option value="">No subjects found</option>';
      return;
    }

    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.subject_code} — ${s.subject_name}`;
      subjectSelect.appendChild(opt);
    });

    subjectSelect.disabled = false;

  } catch (error) {
    console.error('Error loading subjects:', error);
    subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
    showToast(error.message, 'absent');
  }
}

// ✅ Pag-pili ng class → load subjects
classSelect.addEventListener('change', function() {
  const classId = this.value;
  if (!classId) {
    subjectSelect.innerHTML = '<option value="">-- Select Class First --</option>';
    subjectSelect.disabled = true;
    return;
  }
  loadSubjects(classId);
});

// ============================================
// ✅ LOAD ATTENDANCE
// ============================================
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

// ============================================
// ✅ MARK STUDENT
// ============================================
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

// ✅ Auto-refresh every 5 seconds
pollInterval = setInterval(() => {
  if (document.hidden) return;
  if (dateInput.value === getTodayDate()) {
    loadAttendance(true);
  }
}, 5000);

window.addEventListener('beforeunload', () => {
  if (pollInterval) clearInterval(pollInterval);
  if (codeCountdownInterval) clearInterval(codeCountdownInterval);
});

// ============================================
// ✅ GENERATE CHECK-IN CODE (UPDATED)
// ============================================
document.getElementById('generateCodeBtn').addEventListener('click', async function() {
  const btn = this;

  const classId = classSelect.value;
  const subjectId = subjectSelect.value;
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  // ✅ Validation
  if (!classId) {
    showToast('Please select a class.', 'late');
    return;
  }
  if (!subjectId) {
    showToast('Please select a subject.', 'late');
    return;
  }
  if (!startTime || !endTime) {
    showToast('Please set start time and end time.', 'late');
    return;
  }
  if (startTime >= endTime) {
    showToast('End time must be after start time.', 'late');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    const data = await API.post('/api/attendance/generate-code', {
      class_id: parseInt(classId, 10),
      subject_id: parseInt(subjectId, 10),
      start_time: startTime,
      end_time: endTime
    });

    const codeDisplay = document.getElementById('codeDisplay');
    const codeText = document.getElementById('codeText');
    const codeTimer = document.getElementById('codeTimer');

    codeText.textContent = data.code;
    codeDisplay.classList.remove('hidden');

    // ✅ 10-minute countdown (600 seconds)
    let secondsLeft = 600;
    codeTimer.textContent = `Expires in 10:00`;

    if (codeCountdownInterval) clearInterval(codeCountdownInterval);
    codeCountdownInterval = setInterval(() => {
      secondsLeft--;
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      codeTimer.textContent = `Expires in ${mins}:${secs.toString().padStart(2, '0')}`;

      if (secondsLeft <= 0) {
        clearInterval(codeCountdownInterval);
        codeDisplay.classList.add('hidden');
        loadAttendance(false);
      }
    }, 1000);

    showToast(`Code generated: ${data.code}`, 'present');

  } catch (error) {
    console.error('Error generating code:', error);
    showToast(error.message, 'absent');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Check-In Code';
  }
});

// ✅ Initial load ng classes
loadClasses();