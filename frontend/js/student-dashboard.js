const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// I-PROTECT ANG PAGE — student lang ang makaka-access
if (!token || !user || user.role !== 'student') {
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

let lastKnownStatus = null;

function getTodayDate() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function showToast(message, type = 'present') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

async function loadMyAttendance(notify = false) {
  const tableBody = document.getElementById('myAttendanceTableBody');

  try {
    const response = await fetch(`/api/attendance/my/${user.id}`);
    const records = await response.json();

    tableBody.innerHTML = '';

    if (records.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #999;">No attendance records yet.</td></tr>';
      return;
    }

    const todayRecord = records.find(r => r.date === getTodayDate() || (r.date && r.date.split('T')[0] === getTodayDate()));

    if (notify && todayRecord && todayRecord.status && todayRecord.status !== lastKnownStatus && lastKnownStatus !== null) {
      const labelMap = { present: 'marked Present', late: 'marked Late', absent: 'marked Absent' };
      showToast(`Your teacher ${labelMap[todayRecord.status] || 'updated your status'} today.`, todayRecord.status);
    }
    lastKnownStatus = todayRecord ? todayRecord.status : lastKnownStatus;

    records.forEach(record => {
      let badgeClass = 'status-none';
      let badgeText = record.status;
      if (record.status === 'present') { badgeClass = 'status-present'; badgeText = 'Present'; }
      else if (record.status === 'absent') { badgeClass = 'status-absent'; badgeText = 'Absent'; }
      else if (record.status === 'late') { badgeClass = 'status-late'; badgeText = 'Late'; }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.date}</td>
        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
        <td>${record.time_in || '-'}</td>
        <td>${record.remarks || '-'}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading attendance:', error);
  }
}

loadMyAttendance(false);

setInterval(() => {
  loadMyAttendance(true);
}, 5000);

document.getElementById('checkInBtn').addEventListener('click', async function() {
  const code = document.getElementById('checkInCode').value.trim();
  const message = document.getElementById('checkInMessage');

  if (!code) {
    message.textContent = 'Please enter a code.';
    message.style.color = '#D64550';
    return;
  }

  try {
    const response = await fetch('/api/attendance/check-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, user_id: user.id })
    });

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.message || 'Check-in failed.';
      message.style.color = '#D64550';
      return;
    }

    message.textContent = data.message;
    message.style.color = '#2F9E67';
    document.getElementById('checkInCode').value = '';
    loadMyAttendance(false);
  } catch (error) {
    console.error('Error checking in:', error);
    message.textContent = 'Server error. Please try again.';
    message.style.color = '#D64550';
  }
});