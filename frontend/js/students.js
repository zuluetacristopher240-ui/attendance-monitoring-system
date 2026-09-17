/**
 * students.js
 * Manage Students — safe event delegation.
 */

// ✅ Auth check — admin lang (o teacher kung gusto mo)
const user = requireAuth(['admin']);
if (!user) throw new Error('Not authenticated');

setupLogout();

const modal = document.getElementById('studentModal');
const modalTitle = document.getElementById('modalTitle');
const studentForm = document.getElementById('studentForm');
const tableBody = document.getElementById('studentsTableBody');

// ✅ Load all students
async function loadStudents() {
  try {
    const students = await API.get('/api/students');

    tableBody.innerHTML = '';

    if (!students || students.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px 20px;">
            <div style="font-size: 48px; margin-bottom: 12px;">👥</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No students yet</p>
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Click "Add Student" to get started.
            </p>
          </td>
        </tr>
      `;
      return;
    }

    students.forEach(student => {
      const row = document.createElement('tr');

      // Safe textContent approach
      const cells = [
        student.student_id,
        student.full_name,
        student.year_level,
        student.section,
        student.email || '-'
      ];

      cells.forEach(text => {
        const td = document.createElement('td');
        td.textContent = text;
        row.appendChild(td);
      });

      // Actions column with event delegation
      const actionTd = document.createElement('td');

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = 'Edit';
      editBtn.dataset.action = 'edit';
      editBtn.dataset.id = student.id;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.dataset.action = 'delete';
      deleteBtn.dataset.id = student.id;

      actionTd.appendChild(editBtn);
      actionTd.appendChild(deleteBtn);
      row.appendChild(actionTd);

      // Store full student data sa dataset
      row.dataset.student = JSON.stringify(student);

      tableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading students:', error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

// ✅ Event delegation para sa edit/delete buttons
tableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = parseInt(btn.dataset.id, 10);
  const action = btn.dataset.action;
  const row = btn.closest('tr');
  const student = JSON.parse(row.dataset.student);

  if (action === 'edit') {
    openEditModal(student);
  } else if (action === 'delete') {
    deleteStudent(id);
  }
});

// ✅ Open modal para mag-add
document.getElementById('addStudentBtn').addEventListener('click', function() {
  modalTitle.textContent = 'Add Student';
  studentForm.reset();
  document.getElementById('studentDbId').value = '';
  modal.classList.remove('hidden');
});

// ✅ Open modal para mag-edit
function openEditModal(student) {
  modalTitle.textContent = 'Edit Student';
  document.getElementById('studentDbId').value = student.id;
  document.getElementById('studentId').value = student.student_id;
  document.getElementById('fullName').value = student.full_name;
  document.getElementById('yearLevel').value = student.year_level;
  document.getElementById('section').value = student.section;
  document.getElementById('email').value = student.email || '';
  modal.classList.remove('hidden');
}

// ✅ Cancel modal
document.getElementById('cancelBtn').addEventListener('click', function() {
  modal.classList.add('hidden');
});

// ✅ Submit form (Add o Edit)
studentForm.addEventListener('submit', async function(e) {
  e.preventDefault();

  const dbId = document.getElementById('studentDbId').value;
  const studentData = {
    student_id: document.getElementById('studentId').value,
    full_name: document.getElementById('fullName').value,
    year_level: document.getElementById('yearLevel').value,
    section: document.getElementById('section').value,
    email: document.getElementById('email').value,
    username: document.getElementById('loginUsername').value,
    password: document.getElementById('loginPassword').value
  };

  try {
    if (dbId) {
      await API.put(`/api/students/${dbId}`, studentData);
      showToast('Student updated successfully!', 'present');
    } else {
      await API.post('/api/students', studentData);
      showToast('Student added successfully!', 'present');
    }

    modal.classList.add('hidden');
    loadStudents();

  } catch (error) {
    console.error('Error saving student:', error);
    showToast(error.message, 'absent');
  }
});

// ✅ Delete student
async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) return;

  try {
    await API.delete(`/api/students/${id}`);
    showToast('Student deleted successfully!', 'present');
    loadStudents();

  } catch (error) {
    console.error('Error deleting student:', error);
    showToast(error.message, 'absent');
  }
}

// ✅ Initial load
loadStudents();