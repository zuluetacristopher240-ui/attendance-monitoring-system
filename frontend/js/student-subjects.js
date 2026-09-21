/**
 * student-subjects.js
 * Student — My Subjects + Join Class.
 */

// ✅ Auth check — student only
const user = requireAuth(['student']);
if (!user) throw new Error('Not authenticated');

setupLogout();

let currentJoinSubjectId = null;

// ============================================
// ✅ LOAD MY SUBJECTS
// ============================================
async function loadMySubjects() {
  const list = document.getElementById('subjectsList');

  try {
    const subjects = await API.get('/api/subjects/my');

    list.innerHTML = '';

    if (!subjects || subjects.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 36px; margin-bottom: 8px;">📚</div>
          <p style="color: #666; font-size: 14px; font-weight: 500;">You haven't joined any subject yet.</p>
          <p style="color: #999; font-size: 12px; margin-top: 4px;">
            Enter a code from your teacher below to get started.
          </p>
        </div>
      `;
      return;
    }

    subjects.forEach(s => {
      const hasActive = s.active_session_id && s.active_session_end_time;
      const card = document.createElement('div');
      card.className = 'subject-card';

      card.innerHTML = `
        <div class="subject-info">
          <p class="subject-title">
            ${escapeHtml(s.subject_code)} — ${escapeHtml(s.subject_name)}
          </p>
          <p class="subject-meta">
            ${escapeHtml(s.class_code)} (${escapeHtml(s.year_level)} - ${escapeHtml(s.section)})
          </p>
          <p class="subject-meta">
            Teacher: ${escapeHtml(s.teacher_name) || 'N/A'}
          </p>
          ${hasActive 
            ? `<p class="subject-status-active">
                 🟢 Active session ${s.active_session_end_time ? `(until ${s.active_session_end_time})` : ''}
               </p>` 
            : `<p class="subject-status-none">⚪ No active session</p>`
          }
        </div>
        <button class="btn-primary join-btn" data-subject-id="${s.subject_id}" data-subject-name="${escapeHtml(s.subject_code)} — ${escapeHtml(s.subject_name)}">
          Join Class
        </button>
      `;
      list.appendChild(card);
    });

    // ✅ Attach click handlers
    list.querySelectorAll('.join-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openJoinModal(
          parseInt(btn.dataset.subjectId, 10),
          btn.dataset.subjectName
        );
      });
    });

  } catch (error) {
    console.error('Error loading subjects:', error);
    list.innerHTML = `
      <p style="color: #D64550; font-size: 13px; text-align: center;">
        ${escapeHtml(error.message)}
      </p>
    `;
  }
}

// ============================================
// ✅ JOIN MODAL
// ============================================
function openJoinModal(subjectId, subjectName) {
  currentJoinSubjectId = subjectId;
  document.getElementById('joinModalTitle').textContent = `Join: ${subjectName}`;
  document.getElementById('joinModalSubtitle').textContent = 'Enter the code from your teacher to check in.';
  document.getElementById('joinModalCode').value = '';
  document.getElementById('joinModal').classList.remove('hidden');
}

document.getElementById('cancelJoinBtn').addEventListener('click', () => {
  document.getElementById('joinModal').classList.add('hidden');
  currentJoinSubjectId = null;
});

// ============================================
// ✅ JOIN FORM SUBMIT (specific subject)
// ============================================
document.getElementById('joinForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('joinModalCode').value.trim();

  if (!code) {
    showToast('Please enter a code.', 'late');
    return;
  }

  await performCheckIn(code);
  document.getElementById('joinModal').classList.add('hidden');
  currentJoinSubjectId = null;
});

// ============================================
// ✅ JOIN NEW SUBJECT (general)
// ============================================
document.getElementById('joinNewBtn').addEventListener('click', async function() {
  const btn = this;
  const code = document.getElementById('joinNewCode').value.trim();
  const message = document.getElementById('joinNewMessage');

  if (!code) {
    message.textContent = 'Please enter a code.';
    message.style.color = '#D64550';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Joining...';
  message.textContent = '';

  try {
    const data = await API.post('/api/attendance/check-in', { code });

    message.textContent = data.message;
    message.style.color = '#2F9E67';
    document.getElementById('joinNewCode').value = '';

    showToast(data.message, data.status || 'present');

    loadMySubjects();

  } catch (error) {
    console.error('Error joining:', error);
    message.textContent = error.message || 'Join failed.';
    message.style.color = '#D64550';
    showToast(error.message, 'absent');

  } finally {
    btn.disabled = false;
    btn.textContent = 'Join';
  }
});

// ============================================
// ✅ PERFORM CHECK-IN
// ============================================
async function performCheckIn(code) {
  try {
    const data = await API.post('/api/attendance/check-in', { code });
    showToast(data.message, data.status || 'present');
    loadMySubjects();
  } catch (error) {
    console.error('Error checking in:', error);
    showToast(error.message, 'absent');
  }
}

// ============================================
// ✅ INITIAL LOAD
// ============================================
loadMySubjects();