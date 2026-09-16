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

const modal = document.getElementById('studentModal');
const modalTitle = document.getElementById('modalTitle');
const studentForm = document.getElementById('studentForm');
const tableBody = document.getElementById('studentsTableBody');

// I-LOAD ANG LAHAT NG STUDENTS PAGKA-OPEN NG PAGE
async function loadStudents() {
  try {
    const response = await fetch('/api/students');
    const students = await response.json();

    tableBody.innerHTML = '';

    if (students.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #999;">No students yet. Click "Add Student" to get started.</td></tr>';
      return;
    }

    students.forEach(student => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${student.student_id}</td>
        <td>${student.full_name}</td>
        <td>${student.year_level}</td>
        <td>${student.section}</td>
        <td>${student.email || '-'}</td>
        <td>
          <button class="btn-edit" onclick="openEditModal(${student.id}, '${student.student_id}', '${student.full_name}', '${student.year_level}', '${student.section}', '${student.email || ''}')">Edit</button>
          <button class="btn-delete" onclick="deleteStudent(${student.id})">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error('Error loading students:', error);
  }
}

// I-OPEN ANG MODAL PARA MAG-ADD
document.getElementById('addStudentBtn').addEventListener('click', function() {
  modalTitle.textContent = 'Add Student';
  studentForm.reset();
  document.getElementById('studentDbId').value = '';
  modal.classList.remove('hidden');
});

// I-OPEN ANG MODAL PARA MAG-EDIT
function openEditModal(id, studentId, fullName, yearLevel, section, email) {
  modalTitle.textContent = 'Edit Student';
  document.getElementById('studentDbId').value = id;
  document.getElementById('studentId').value = studentId;
  document.getElementById('fullName').value = fullName;
  document.getElementById('yearLevel').value = yearLevel;
  document.getElementById('section').value = section;
  document.getElementById('email').value = email;
  modal.classList.remove('hidden');
}

// I-CANCEL / ISARA ANG MODAL
document.getElementById('cancelBtn').addEventListener('click', function() {
  modal.classList.add('hidden');
});

// I-SUBMIT ANG FORM (Add o Edit)
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
    let response;
    if (dbId) {
      response = await fetch(`/api/students/${dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
    } else {
      response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
    }

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Something went wrong.');
      return;
    }

    modal.classList.add('hidden');
    loadStudents();
  } catch (error) {
    console.error('Error saving student:', error);
    alert('Server error. Please try again.');
  }
});

// I-DELETE ANG STUDENT
async function deleteStudent(id) {
  if (!confirm('Are you sure you want to delete this student?')) {
    return;
  }

  try {
    const response = await fetch(`/api/students/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || 'Something went wrong.');
      return;
    }

    loadStudents();
  } catch (error) {
    console.error('Error deleting student:', error);
    alert('Server error. Please try again.');
  }
}

// I-LOAD ANG STUDENTS PAGKA-BUKAS NG PAGE
loadStudents();