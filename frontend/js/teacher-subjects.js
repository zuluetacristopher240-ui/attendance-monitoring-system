/**
 * teacher-subjects.js
 * Teacher — manage own subjects.
 */

// ✅ Auth check — teacher only
const user = requireAuth(['teacher']);
if (!user) throw new Error('Not authenticated');

setupLogout();

const subjectsTableBody = document.getElementById('subjectsTableBody');
const subjectModal = document.getElementById('subjectModal');
const subjectModalTitle = document.getElementById('subjectModalTitle');
const subjectForm = document.getElementById('subjectForm');
const subjectClassSelect = document.getElementById('subjectClass');

let allClasses = [];

// ============================================
// ✅ LOAD CLASSES (for dropdown)
// ============================================
async function loadClasses() {
  try {
    allClasses = await API.get('/api/teacher/classes');

    subjectClassSelect.innerHTML = '<option value="">-- Select Class --</option>';

    if (!allClasses || allClasses.length === 0) {
      subjectClassSelect.innerHTML = '<option value="">No classes available</option>';
      return;
    }

    allClasses.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.class_code} — ${c.class_name}`;
      subjectClassSelect.appendChild(opt);
    });

  } catch (error) {
    console.error('Error loading classes:', error);
    showToast(error.message, 'absent');
  }
}

// ============================================
// ✅ LOAD SUBJECTS (teacher's own)
// ============================================
async function loadSubjects() {
  try {
    const subjects = await API.get('/api/teacher/subjects');

    subjectsTableBody.innerHTML = '';

    if (!subjects || subjects.length === 0) {
      subjectsTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 12px;">📚</div>
            <p style="color: #666; font-size: 15px; font-weight: 500;">Wala ka pang subjects</p>
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
        <td><code style="background:#FAFAFA; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${escapeHtml(s.enrollment_code)}</code></td>
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
// ✅ OPEN MODAL — Add
// ============================================
document.getElementById('addSubjectBtn').addEventListener('click', () => {
  subjectModalTitle.textContent = 'Add Subject';
  subjectForm.reset();
  document.getElementById('subjectDbId').value = '';
  subjectClassSelect.disabled = false;
  subjectModal.classList.remove('hidden');
});

// ============================================
// ✅ EVENT DELEGATION — Edit / Delete
// ============================================
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

// ============================================
// ✅ CANCEL MODAL
// ============================================
document.getElementById('cancelSubjectBtn').addEventListener('click', () => {
  subjectModal.classList.add('hidden');
  subjectClassSelect.disabled = false;
});

// ============================================
// ✅ SUBMIT FORM (Add / Edit)
// ============================================
subjectForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const dbId = document.getElementById('subjectDbId').value;
  const data = {
    class_id: parseInt(subjectClassSelect.value, 10),
    subject_code: document.getElementById('subjectCode').value.trim(),
    subject_name: document.getElementById('subjectName').value.trim(),
    enrollment_code: document.getElementById('subjectEnrollmentCode').value.trim()
  };

  if (!data.class_id) {
    showToast('Please select a class.', 'late');
    return;
  }

  try {
    if (dbId) {
      await API.put(`/api/teacher/subjects/${dbId}`, data);
      showToast('✅ Subject updated!', 'present');
    } else {
      const result = await API.post('/api/teacher/subjects', data);
      showToast(`✅ Subject created! Code: ${result.enrollment_code}`, 'present');
    }
    subjectModal.classList.add('hidden');
    subjectClassSelect.disabled = false;
    loadSubjects();
  } catch (error) {
    console.error('Error saving subject:', error);
    showToast('❌ ' + error.message, 'absent');
  }
});

// ============================================
// ✅ DELETE SUBJECT
// ============================================
async function deleteSubject(id) {
  if (!confirm('Sigurado ka bang gusto mong i-delete ang subject na ito?')) return;
  try {
    await API.delete(`/api/teacher/subjects/${id}`);
    showToast('✅ Subject deleted!', 'present');
    loadSubjects();
  } catch (error) {
    console.error('Error deleting subject:', error);
    showToast('❌ ' + error.message, 'absent');
  }
}

// ============================================
// ✅ INITIAL LOAD
// ============================================
loadClasses();
loadSubjects();