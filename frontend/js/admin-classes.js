/**
 * admin-classes.js
 * Admin — Manage Classes & Subjects CRUD.
 */

// ✅ Auth check — admin only
const user = requireAuth(['admin']);
if (!user) throw new Error('Not authenticated');

setupLogout();

const classesTableBody = document.getElementById('classesTableBody');
const subjectsTableBody = document.getElementById('subjectsTableBody');
const filterClassSelect = document.getElementById('filterClassSelect');

const classModal = document.getElementById('classModal');
const classModalTitle = document.getElementById('classModalTitle');
const classForm = document.getElementById('classForm');
const classTeacherSelect = document.getElementById('classTeacher');

const subjectModal = document.getElementById('subjectModal');
const subjectModalTitle = document.getElementById('subjectModalTitle');
const subjectForm = document.getElementById('subjectForm');
const subjectClassSelect = document.getElementById('subjectClass');

let allClasses = [];
let allTeachers = [];

// ============================================
// ✅ LOAD TEACHERS (for dropdown)
// ============================================
async function loadTeachers() {
  try {
    allTeachers = await API.get('/api/admin/teachers');

    // ✅ Fill yung class modal dropdown
    classTeacherSelect.innerHTML = '<option value="">-- Select Teacher --</option>';
    allTeachers.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.full_name} (${t.username})`;
      classTeacherSelect.appendChild(opt);
    });
  } catch (error) {
    console.error('Error loading teachers:', error);
    showToast(error.message, 'absent');
  }
}

// ============================================
// ✅ LOAD CLASSES
// ============================================
async function loadClasses() {
  try {
    allClasses = await API.get('/api/admin/classes');

    classesTableBody.innerHTML = '';

    // ✅ Fill yung filter at subject modal dropdown
    filterClassSelect.innerHTML = '<option value="">-- All Classes --</option>';
    subjectClassSelect.innerHTML = '<option value="">-- Select Class --</option>';

    if (!allClasses || allClasses.length === 0) {
      classesTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No classes yet</p>
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Click "Add Class" to get started.
            </p>
          </td>
        </tr>
      `;
      return;
    }

    allClasses.forEach(c => {
      // ✅ Fill filter dropdown
      const opt1 = document.createElement('option');
      opt1.value = c.id;
      opt1.textContent = `${c.class_code} — ${c.class_name}`;
      filterClassSelect.appendChild(opt1);

      // ✅ Fill subject modal dropdown
      const opt2 = document.createElement('option');
      opt2.value = c.id;
      opt2.textContent = `${c.class_code} — ${c.class_name}`;
      subjectClassSelect.appendChild(opt2);

      // ✅ Render row
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(c.class_code)}</td>
        <td>${escapeHtml(c.class_name)}</td>
        <td>${escapeHtml(c.year_level)} - ${escapeHtml(c.section)}</td>
        <td>${escapeHtml(c.teacher_name) || '-'}</td>
        <td>${c.subject_count || 0}</td>
        <td>
          <button class="btn-edit" data-action="edit-class" data-id="${c.id}">Edit</button>
          <button class="btn-delete" data-action="delete-class" data-id="${c.id}">Delete</button>
        </td>
      `;
      row.dataset.classData = JSON.stringify(c);
      classesTableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading classes:', error);
    classesTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

// ============================================
// ✅ LOAD SUBJECTS (optionally by class)
// ============================================
async function loadSubjects(classId = '') {
  try {
    const url = classId ? `/api/admin/subjects?classId=${classId}` : '/api/admin/subjects';
    const subjects = await API.get(url);

    subjectsTableBody.innerHTML = '';

    if (!subjects || subjects.length === 0) {
      subjectsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📚</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">No subjects found</p>
            <p style="color: #999; font-size: 13px; margin-top: 4px;">
              Click "Add Subject" to get started.
            </p>
          </td>
        </tr>
      `;
      return;
    }

    subjects.forEach(s => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(s.subject_code)}</td>
        <td>${escapeHtml(s.subject_name)}</td>
        <td>${escapeHtml(s.class_code)} — ${escapeHtml(s.class_name)}</td>
        <td>${escapeHtml(s.teacher_name) || '-'}</td>
        <td>${s.enrolled_count || 0}</td>
        <td>
          <button class="btn-edit" data-action="edit-subject" data-id="${s.id}">Edit</button>
          <button class="btn-delete" data-action="delete-subject" data-id="${s.id}">Delete</button>
        </td>
      `;
      row.dataset.subjectData = JSON.stringify(s);
      subjectsTableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading subjects:', error);
    subjectsTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 20px; color: #D64550;">
          ${escapeHtml(error.message)}
        </td>
      </tr>
    `;
  }
}

// ============================================
// ✅ CLASS MODAL — OPEN (Add)
// ============================================
document.getElementById('addClassBtn').addEventListener('click', () => {
  classModalTitle.textContent = 'Add Class';
  classForm.reset();
  document.getElementById('classDbId').value = '';
  classModal.classList.remove('hidden');
});

// ✅ CLASS MODAL — OPEN (Edit)
classesTableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest('tr');

  if (action === 'edit-class') {
    const classData = JSON.parse(row.dataset.classData);
    classModalTitle.textContent = 'Edit Class';
    document.getElementById('classDbId').value = classData.id;
    document.getElementById('classCode').value = classData.class_code;
    document.getElementById('className').value = classData.class_name;
    document.getElementById('classYearLevel').value = classData.year_level;
    document.getElementById('classSection').value = classData.section;
    classTeacherSelect.value = classData.teacher_id;
    classModal.classList.remove('hidden');
  } else if (action === 'delete-class') {
    deleteClass(btn.dataset.id);
  }
});

// ✅ CLASS MODAL — Cancel
document.getElementById('cancelClassBtn').addEventListener('click', () => {
  classModal.classList.add('hidden');
});

// ✅ CLASS MODAL — Submit
classForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dbId = document.getElementById('classDbId').value;
  const data = {
    class_code: document.getElementById('classCode').value.trim(),
    class_name: document.getElementById('className').value.trim(),
    year_level: document.getElementById('classYearLevel').value.trim(),
    section: document.getElementById('classSection').value.trim(),
    teacher_id: parseInt(classTeacherSelect.value, 10)
  };

  try {
    if (dbId) {
      await API.put(`/api/admin/classes/${dbId}`, data);
      showToast('Class updated!', 'present');
    } else {
      await API.post('/api/admin/classes', data);
      showToast('Class created!', 'present');
    }
    classModal.classList.add('hidden');
    loadClasses();
  } catch (error) {
    console.error('Error saving class:', error);
    showToast(error.message, 'absent');
  }
});

// ============================================
// ✅ DELETE CLASS
// ============================================
async function deleteClass(id) {
  if (!confirm('Are you sure you want to delete this class?')) return;
  try {
    await API.delete(`/api/admin/classes/${id}`);
    showToast('Class deleted!', 'present');
    loadClasses();
  } catch (error) {
    console.error('Error deleting class:', error);
    showToast(error.message, 'absent');
  }
}

// ============================================
// ✅ SUBJECT MODAL — OPEN (Add)
// ============================================
document.getElementById('addSubjectBtn').addEventListener('click', () => {
  subjectModalTitle.textContent = 'Add Subject';
  subjectForm.reset();
  document.getElementById('subjectDbId').value = '';

  // ✅ Kung may class filter, i-set na
  const filterValue = filterClassSelect.value;
  if (filterValue) subjectClassSelect.value = filterValue;

  subjectModal.classList.remove('hidden');
});

// ✅ SUBJECT MODAL — Event delegation
subjectsTableBody.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const row = btn.closest('tr');

  if (action === 'edit-subject') {
    const subjectData = JSON.parse(row.dataset.subjectData);
    subjectModalTitle.textContent = 'Edit Subject';
    document.getElementById('subjectDbId').value = subjectData.id;
    document.getElementById('subjectCode').value = subjectData.subject_code;
    document.getElementById('subjectName').value = subjectData.subject_name;
    document.getElementById('subjectEnrollmentCode').value = subjectData.enrollment_code || '';
    subjectClassSelect.value = subjectData.class_id;
    subjectClassSelect.disabled = true; // Hindi pwedeng palitan yung class sa edit
    subjectModal.classList.remove('hidden');
  } else if (action === 'delete-subject') {
    deleteSubject(btn.dataset.id);
  }
});

// ✅ SUBJECT MODAL — Cancel
document.getElementById('cancelSubjectBtn').addEventListener('click', () => {
  subjectModal.classList.add('hidden');
  subjectClassSelect.disabled = false;
});

// ✅ SUBJECT MODAL — Submit
subjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dbId = document.getElementById('subjectDbId').value;
  const data = {
    class_id: parseInt(subjectClassSelect.value, 10),
    subject_code: document.getElementById('subjectCode').value.trim(),
    subject_name: document.getElementById('subjectName').value.trim(),
    enrollment_code: document.getElementById('subjectEnrollmentCode').value.trim()
  };

  try {
    if (dbId) {
      await API.put(`/api/admin/subjects/${dbId}`, data);
      showToast('Subject updated!', 'present');
    } else {
      const result = await API.post('/api/admin/subjects', data);
      showToast(`Subject created! Code: ${result.enrollment_code}`, 'present');
    }
    subjectModal.classList.add('hidden');
    subjectClassSelect.disabled = false;
    loadSubjects(filterClassSelect.value);
    loadClasses(); // Refresh para updated yung subject_count
  } catch (error) {
    console.error('Error saving subject:', error);
    showToast(error.message, 'absent');
  }
});

// ============================================
// ✅ DELETE SUBJECT
// ============================================
async function deleteSubject(id) {
  if (!confirm('Are you sure you want to delete this subject?')) return;
  try {
    await API.delete(`/api/admin/subjects/${id}`);
    showToast('Subject deleted!', 'present');
    loadSubjects(filterClassSelect.value);
    loadClasses();
  } catch (error) {
    console.error('Error deleting subject:', error);
    showToast(error.message, 'absent');
  }
}

// ============================================
// ✅ FILTER CHANGE
// ============================================
filterClassSelect.addEventListener('change', (e) => {
  loadSubjects(e.target.value);
});

// ============================================
// ✅ INITIAL LOAD
// ============================================
loadTeachers();
loadClasses();
loadSubjects();