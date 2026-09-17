/**
 * attendance.js
 * Admin/Teacher attendance monitoring logic.
 */

// ✅ Auth check — admin o teacher
const user = requireAuth(['admin', 'teacher']);
if (!user) throw new Error('Not authenticated');

// ✅ Setup logout
setupLogout();

const dateInput = document.getElementById('attendanceDate');
const tableBody = document.getElementById('attendanceTableBody');
const summaryText = document.getElementById('summaryText');

// ✅ Helper: today's date
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

dateInput.value = getTodayDate();

// ✅ Load attendance for selected date
async function loadAttendance() {
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
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Add students first to start tracking attendance.
            </p>
          </td>
        </tr>
      `;
      summaryText.textContent = '';
      return;
    }

    let presentCount = 0, absentCount = 0, lateCount = 0, noneCount = 0;

    students.forEach(student => {
      const status = student.status;

      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'late') lateCount++;
      else noneCount++;

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

    summaryText.textContent = `Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount} | Not Marked: ${noneCount}`;

  } catch (error) {
    console.error('Error loading attendance:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

// ✅ Mark student — gamit ang API helper
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

    loadAttendance();

  } catch (error) {
    console.error('Error marking attendance:', error);
    showToast(error.message, 'absent');
  }
}

// ✅ Event delegation para sa mark buttons
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-status]');
  if (!btn) return;

  const studentId = parseInt(btn.dataset.studentId, 10);
  const status = btn.dataset.status;

  markStudent(studentId, status);
});

// ✅ Reload sa date change
dateInput.addEventListener('change', loadAttendance);

// ✅ Initial load
loadAttendance();