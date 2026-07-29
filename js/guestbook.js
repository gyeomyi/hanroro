const SUPABASE_URL = 'https://avsnujrdogkxvhtelrzx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2c251anJkb2dreHZodGVscnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDExNzAsImV4cCI6MjEwMDc3NzE3MH0.effnEFNSApyy1qJ5Z8ykHgLiXz-N36xjRsGuZxL6UUE';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

AOS.init({
  once: true,
  duration: 700,
  easing: 'ease-out-cubic',
  offset: 60,
  disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
});
dayjs.extend(dayjs_plugin_relativeTime);
dayjs.locale('ko');

const ACCENT = '#e05a7a';       /* 자몽 */
const ACCENT_MUTED = '#3a3b47'; /* 먹밤 표면 */

const gbList = document.getElementById('gbList');
const gbForm = document.getElementById('gbForm');
const gbNameInput = document.getElementById('gbName');
const gbMessageInput = document.getElementById('gbMessage');
const gbPasswordInput = document.getElementById('gbPassword');

function formatTime(iso) {
  const d = dayjs(iso);
  return d.isValid() ? d.format('YYYY년 M월 D일 HH:mm') : '';
}

function formatRelative(iso) {
  const d = dayjs(iso);
  if (!d.isValid()) return '';
  if (d.diff(dayjs()) > -60000) return '방금 전';
  return d.fromNow();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function toastSuccess(title) {
  Swal.fire({ icon:'success', title, timer:1200, showConfirmButton:false });
}

function alertError(title, text) {
  Swal.fire({ icon:'error', title, text, confirmButtonColor:ACCENT, confirmButtonText:'확인' });
}

async function loadGuestbook() {
  const { data, error } = await supabaseClient
    .from('guestbook')
    .select('id, name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('방명록 불러오기 실패:', error); return; }
  if (!data || data.length === 0) {
    gbList.innerHTML = '<div class="gb-empty">아직 아무도 쓰지 않았습니다.<br>첫 줄을 남겨주세요.</div>';
    return;
  }
  gbList.innerHTML = data.map(e => `
    <div class="gb-entry" data-id="${e.id}">
      <div class="gb-entry-head">
        <span class="gb-entry-name">${escapeHtml(e.name)}</span>
        <span class="gb-entry-time">${formatRelative(e.created_at)} · ${formatTime(e.created_at)}</span>
      </div>
      <div class="gb-entry-msg">${escapeHtml(e.message)}</div>
      <div class="gb-entry-actions">
        <button type="button" class="gb-btn-edit">수정</button>
        <button type="button" class="gb-btn-delete">삭제</button>
      </div>
    </div>`).join('');
}

async function insertEntry(name, message, password) {
  const { data, error } = await supabaseClient.rpc('sign_guestbook', {
    p_name: name.trim(), p_message: message.trim(), p_password: password
  });
  if (error) { console.error('방명록 저장 실패:', error); alertError('저장 실패', '다시 시도해주세요.'); return false; }
  if (data && !data.success) { alertError('저장 실패', data.error || '다시 시도해주세요.'); return false; }
  return true;
}

async function updateEntry(id, password, message) {
  const { data, error } = await supabaseClient.rpc('edit_guestbook', {
    p_id: id, p_password: password, p_message: message.trim()
  });
  if (error) { console.error('방명록 수정 실패:', error); alertError('수정 실패', '다시 시도해주세요.'); return false; }
  if (data && !data.success) { alertError('수정 실패', data.error || '비밀번호를 확인해주세요.'); return false; }
  return true;
}

async function deleteEntry(id, password) {
  const { data, error } = await supabaseClient.rpc('remove_guestbook', {
    p_id: id, p_password: password
  });
  if (error) { console.error('방명록 삭제 실패:', error); alertError('삭제 실패', '다시 시도해주세요.'); return false; }
  if (data && !data.success) { alertError('삭제 실패', data.error || '비밀번호를 확인해주세요.'); return false; }
  return true;
}

gbForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = gbNameInput.value.trim();
  const message = gbMessageInput.value.trim();
  const password = gbPasswordInput.value;
  if (!name || !message || !password) return;
  const ok = await insertEntry(name, message, password);
  if (ok) {
    gbNameInput.value = '';
    gbMessageInput.value = '';
    gbPasswordInput.value = '';
    toastSuccess('남겼어요!');
    await loadGuestbook();
  }
});

gbList.addEventListener('click', async (e) => {
  const target = e.target;
  const entry = target.closest('.gb-entry');
  if (!entry) return;
  const id = entry.dataset.id;

  if (target.classList.contains('gb-btn-delete')) {
    const result = await Swal.fire({
      icon:'warning',
      title:'삭제할까요?',
      input:'password',
      inputPlaceholder:'비밀번호를 입력하세요',
      showCancelButton:true,
      confirmButtonText:'삭제',
      cancelButtonText:'취소',
      confirmButtonColor:ACCENT,
      cancelButtonColor:ACCENT_MUTED,
      inputValidator:(value) => { if (!value) return '비밀번호를 입력하세요'; }
    });
    if (!result.isConfirmed) return;
    const ok = await deleteEntry(id, result.value);
    if (ok) { toastSuccess('삭제됐어요!'); await loadGuestbook(); }
  } else if (target.classList.contains('gb-btn-edit')) {
    const msgDiv = entry.querySelector('.gb-entry-msg');
    const original = msgDiv.textContent;
    entry.querySelector('.gb-entry-actions').style.display = 'none';
    msgDiv.innerHTML = `
      <textarea class="gb-edit-textarea" maxlength="500" spellcheck="false">${escapeHtml(original)}</textarea>
      <input type="password" class="gb-edit-password" placeholder="비밀번호" maxlength="30" spellcheck="false">
      <div class="gb-edit-actions">
        <button type="button" class="gb-btn-cancel">취소</button>
        <button type="button" class="gb-btn-save">저장</button>
      </div>`;
    msgDiv.querySelector('.gb-edit-textarea').focus();
  } else if (target.classList.contains('gb-btn-save')) {
    const textarea = entry.querySelector('.gb-edit-textarea');
    const passwordInput = entry.querySelector('.gb-edit-password');
    const message = textarea.value.trim();
    const password = passwordInput.value;
    if (!message) { textarea.focus(); return; }
    if (!password) { passwordInput.focus(); return; }
    const ok = await updateEntry(id, password, message);
    if (ok) { toastSuccess('수정됐어요!'); await loadGuestbook(); }
  } else if (target.classList.contains('gb-btn-cancel')) {
    await loadGuestbook();
  }
});

loadGuestbook();
