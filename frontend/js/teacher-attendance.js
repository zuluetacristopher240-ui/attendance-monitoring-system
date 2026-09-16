const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user || user.role !== 'teacher') {
  window.location.href = '/pages/login.html';
} else {
  document.getElementById('welcomeUser').textContent = `Welcome, ${user.full_name}!`;
}

document.getElementById('logoutBtn').addEventListener('click', function(e) {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/login.html';
});

const dateInput = document.getElementById('attendanceDate');
const tableBody = document.getElementById('attendanceTableBody');
const summaryText = document.getElementById('summaryText');

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

dateInput.value = getTodayDate();

async function loadAttendance() {
  const selectedDate = dateInput.value;

  try {
    const response = await fetch(`/api/attendance/${selectedDate}`);
    const students = await response.json();

    tableBody.innerHTML = '';

    if (students.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #999;">No students found.</td></tr>';
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

async function markStudent(studentId, status) {
  const selectedDate = dateInput.value;

  let timeIn = null;
  if (status === 'present' || status === 'late') {
    const now = new Date();
    timeIn = now.toTimeString().split(' ')[0];
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

    loadAttendance();
  } catch (error) {
    console.error('Error marking attendance:', error);
    alert('Server error. Please try again.');
  }
}

dateInput.addEventListener('change', loadAttendance);
loadAttendance();

document.getElementById('generateCodeBtn').addEventListener('click', async function() {
  try {
    const response = await fetch('/api/attendance/generate-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: user.id })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Failed to generate code.');
      return;
    }

    const codeDisplay = document.getElementById('codeDisplay');
    const codeText = document.getElementById('codeText');
    const codeTimer = document.getElementById('codeTimer');

    codeText.textContent = data.code;
    codeDisplay.classList.remove('hidden');

    let secondsLeft = 300; // 5 minuto = 300 segundo
    codeTimer.textContent = `Expires in 5:00`;

    const interval = setInterval(() => {
      secondsLeft--;
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      codeTimer.textContent = `Expires in ${mins}:${secs.toString().padStart(2, '0')}`;

      if (secondsLeft <= 0) {
        clearInterval(interval);
        codeDisplay.classList.add('hidden');
        loadAttendance(); // i-refresh para makita kung sino ang na-check in
      }
    }, 1000);

  } catch (error) {
    console.error('Error generating code:', error);
    alert('Server error. Please try again.');
  }
});