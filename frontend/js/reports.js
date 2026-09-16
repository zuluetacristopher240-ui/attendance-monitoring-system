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

const tableBody = document.getElementById('reportsTableBody');

// I-LOAD ANG REPORT (may option na i-filter by date range)
async function loadReport(startDate, endDate) {
  try {
    let url = '/api/attendance/summary/report';
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await fetch(url);
    const students = await response.json();

    tableBody.innerHTML = '';

    if (students.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #999;">No data found.</td></tr>';
      return;
    }

    students.forEach(student => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${student.student_number}</td>
        <td>${student.full_name}</td>
        <td>${student.year_level} - ${student.section}</td>
        <td class="count-present">${student.present_count}</td>
        <td class="count-late">${student.late_count}</td>
        <td class="count-absent">${student.absent_count}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading report:', error);
  }
}

// FILTER BUTTON
document.getElementById('filterBtn').addEventListener('click', function() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert('Please select both start and end dates.');
    return;
  }

  loadReport(startDate, endDate);
});

// SHOW ALL BUTTON (clear filter)
document.getElementById('clearFilterBtn').addEventListener('click', function() {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  loadReport();
});

// I-LOAD LAHAT PAGKA-BUKAS NG PAGE
loadReport();