// I-check kung naka-login
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
  window.location.href = '/pages/login.html';
} else {
  document.getElementById('welcomeUser').textContent = `Welcome, ${user.full_name}!`;
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
});

const dateInput = document.getElementById('attendanceDate');
const tableBody = document.getElementById('attendanceTableBody');
const summaryText = document.getElementById('summaryText');

// I-SET ANG DEFAULT DATE PAPUNTA SA NGAYON
function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

dateInput.value = getTodayDate();

// I-LOAD ANG ATTENDANCE PARA SA PINILING PETSA
async function loadAttendance() {
  const selectedDate = dateInput.value;

  try {
    const response = await fetch(`/api/attendance/${selectedDate}`);
    const students = await response.json();

    tableBody.innerHTML = '';

    if (students.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #999;">No students found. Add students first.</td></tr>';
      summaryText.textContent = '';
      return;
    }

    let presentCount = 0, absentCount = 0, lateCount = 0, noneCount = 0;

    students.forEach(student => {
      const status = student.status; // 'present', 'absent', 'late', o null

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
        <td>${student.student_number}</td>
        <td>${student.full_name}</td>
        <td>${student.year_level} - ${student.section}</td>
        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        <td>${student.time_in || '-'}</td>
        <td class="attendance-actions">
          <button class="btn-present" onclick="markStudent(${student.student_id}, 'present')">Present</button>
          <button class="btn-late" onclick="markStudent(${student.student_id}, 'late')">Late</button>
          <button class="btn-absent" onclick="markStudent(${student.student_id}, 'absent')">Absent</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    summaryText.textContent = `Present: ${presentCount} | Late: ${lateCount} | Absent: ${absentCount} | Not Marked: ${noneCount}`;

  } catch (error) {
    console.error('Error loading attendance:', error);
  }
}

// I-MARK ANG STUDENT (tinatawag mula sa Present/Late/Absent buttons)
async function markStudent(studentId, status) {
  const selectedDate = dateInput.value;

  let timeIn = null;
  if (status === 'present' || status === 'late') {
    const now = new Date();
    timeIn = now.toTimeString().split(' ')[0]; // format: HH:MM:SS
  }

  try {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        date: selectedDate,
        status: status,
        time_in: timeIn
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Something went wrong.');
      return;
    }

    loadAttendance(); // I-refresh ang table
  } catch (error) {
    console.error('Error marking attendance:', error);
    alert('Server error. Please try again.');
  }
}

// PAG PALITAN ANG PETSA, I-RELOAD ANG TABLE
dateInput.addEventListener('change', loadAttendance);

// I-LOAD ANG ATTENDANCE PAGKA-BUKAS NG PAGE
loadAttendance();