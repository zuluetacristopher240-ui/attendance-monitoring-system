/**
 * reports.js
 * Attendance Reports logic.
 */

// ✅ Auth check — admin o teacher
const user = requireAuth(['admin', 'teacher']);
if (!user) throw new Error('Not authenticated');

setupLogout();

const tableBody = document.getElementById('reportsTableBody');

// ✅ Load report (may optional date filter)
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

// ✅ Filter button
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

// ✅ Clear filter button
document.getElementById('clearFilterBtn').addEventListener('click', function() {
  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  loadReport();
});

// ✅ Initial load
loadReport();