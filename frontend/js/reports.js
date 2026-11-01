const user = requireAuth(['admin', 'teacher']);
if (!user) throw new Error('Not authenticated');

setupLogout();

const tableBody = document.getElementById('reportsTableBody');

async function loadReport(startDate, endDate) {
  try {
    let url = '/api/attendance/summary/report';
    if (startDate && endDate) {
      url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }

    const students = await API.get(url);

    tableBody.innerHTML = '';

    if (!students || students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📊</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No data found</p>
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Try adjusting your date range.
            </p>
          </td>
        </tr>
      `;
      return;
    }

    students.forEach(student => {
      const row = document.createElement('tr');

      const cells = [
        { text: student.student_number },
        { text: student.full_name },
        { text: `${student.year_level} - ${student.section}` },
        { text: student.present_count, className: 'count-present' },
        { text: student.late_count, className: 'count-late' },
        { text: student.absent_count, className: 'count-absent' }
      ];

      cells.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell.text ?? 0;
        if (cell.className) td.className = cell.className;
        row.appendChild(td);
      });

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading report:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

document.getElementById('filterBtn').addEventListener('click', function() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    showToast('Please select both start and end dates.', 'late');
    return;
  }

  if (startDate > endDate) {
    showToast('Start date must be before end date.', 'late');
    return;
  }

  loadReport(startDate, endDate);
});

document.getElementById('clearFilterBtn').addEventListener('click', function() {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  loadReport();
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  const table = document.getElementById('reportsTable');
  const rows = table.querySelectorAll('tr');
  
  if (rows.length <= 1) {
    showToast('No data to export.', 'late');
    return;
  }

  let csvContent = '';
  const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText);
  csvContent += headers.join(',') + '\n';

  const dataRows = table.querySelectorAll('tbody tr');
  dataRows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td')).map(td => {
      let text = td.innerText.replace(/,/g, '');
      return `"${text}"`;
    });
    csvContent += cells.join(',') + '\n';
  });

  const encodedUri = encodeURIComponent(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodedUri);
  link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('✅ Exported to CSV!', 'present');
});

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  const actionBar = document.querySelector('.date-bar');
  const sidebar = document.querySelector('.sidebar');
  const topbar = document.querySelector('.topbar');
  
  actionBar.style.display = 'none';
  sidebar.style.display = 'none';
  topbar.style.display = 'none';

  window.print();

  actionBar.style.display = 'flex';
  sidebar.style.display = 'flex';
  topbar.style.display = 'flex';
});

loadReport();