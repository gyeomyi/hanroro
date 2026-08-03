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

/* 모달 공통 설정.
   buttonsStyling:false — SweetAlert의 인라인 색상을 끄고 CSS로만 그린다.
   인라인 색을 쓰면 테마를 바꿔도 모달만 옛날 색으로 남는다. */
const SWAL = {
  buttonsStyling: false,
  showClass: { popup: 'hr-swal-in', backdrop: '', icon: '' },
  hideClass: { popup: 'hr-swal-out', backdrop: '' },
  customClass: {
    popup: 'hr-swal',
    title: 'hr-swal-title',
    htmlContainer: 'hr-swal-text',
    input: 'hr-swal-input',
    actions: 'hr-swal-actions',
    confirmButton: 'hr-swal-confirm',
    cancelButton: 'hr-swal-cancel',
    validationMessage: 'hr-swal-invalid'
  }
};

const gbList = document.getElementById('gbList');
const gbForm = document.getElementById('gbForm');
const gbNameInput = document.getElementById('gbName');
const gbMessageInput = document.getElementById('gbMessage');
const gbPasswordInput = document.getElementById('gbPassword');
const gbCount = document.getElementById('gbCount');

/* maxlength는 한도에 닿으면 조용히 잘라낸다. 그러면 "글이 더 안 써진다"로 읽히므로
   남은 자리를 눈에 보이게 둔다. 길이 검증 자체는 여전히 서버(RPC)가 한다 */
const LIMIT = Number(gbMessageInput.getAttribute('maxlength'));
const drawCount = () => {
  const n = gbMessageInput.value.length; // maxlength와 같은 단위(UTF-16)로 센다
  gbCount.textContent = `${n} / ${LIMIT}`;
  gbCount.classList.toggle('is-full', n >= LIMIT);
};
gbMessageInput.addEventListener('input', drawCount);
drawCount();

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
  Swal.fire({
    ...SWAL,
    toast:true, position:'top-end',
    icon:'success', title,
    timer:1800, timerProgressBar:true, showConfirmButton:false,
    customClass:{ ...SWAL.customClass, popup:'hr-swal hr-swal-toast' }
  });
}

/* 빈 칸을 조용히 무시하면 "눌러도 아무 일도 안 난다"로 보인다.
   브라우저 기본 말풍선으로 어느 칸이 문제인지 그 자리에서 알려준다.
   maxlength와 달리 이건 안내일 뿐이고, 진짜 검증은 서버(RPC)가 한다 */
function complain(el, msg) {
  el.setCustomValidity(msg);
  el.reportValidity();
  el.addEventListener('input', () => el.setCustomValidity(''), { once: true });
}

function alertError(title, text) {
  Swal.fire({ ...SWAL, icon:'error', title, text, confirmButtonText:'확인' });
}

async function loadGuestbook() {
  const { data, error } = await supabaseClient
    .from('guestbook')
    .select('id, name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) { console.error('방명록 불러오기 실패:', error); return; }
  if (!data || data.length === 0) {
    gbList.innerHTML = '<div class="gb-empty">아직 아무도 쓰지 않았습니다.<br>첫 줄이 비어 있습니다.</div>';
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
  if (error) { console.error('방명록 저장 실패:', error); alertError('저장하지 못했습니다', '잠시 뒤에 다시 해주세요.'); return false; }
  if (data && !data.success) { alertError('저장하지 못했습니다', data.error || '잠시 뒤에 다시 해주세요.'); return false; }
  return true;
}

async function updateEntry(id, password, message) {
  const { data, error } = await supabaseClient.rpc('edit_guestbook', {
    p_id: id, p_password: password, p_message: message.trim()
  });
  if (error) { console.error('방명록 수정 실패:', error); alertError('고치지 못했습니다', '잠시 뒤에 다시 해주세요.'); return false; }
  if (data && !data.success) { alertError('고치지 못했습니다', data.error || '비밀번호를 다시 확인해주세요.'); return false; }
  return true;
}

async function deleteEntry(id, password) {
  const { data, error } = await supabaseClient.rpc('remove_guestbook', {
    p_id: id, p_password: password
  });
  if (error) { console.error('방명록 삭제 실패:', error); alertError('지우지 못했습니다', '잠시 뒤에 다시 해주세요.'); return false; }
  if (data && !data.success) { alertError('지우지 못했습니다', data.error || '비밀번호를 다시 확인해주세요.'); return false; }
  return true;
}

gbForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = gbNameInput.value.trim();
  const message = gbMessageInput.value.trim();
  const password = gbPasswordInput.value;
  if (!name) return complain(gbNameInput, '이름을 적어주세요.');
  if (!message) return complain(gbMessageInput, '내용을 적어주세요.');
  if (!password) return complain(gbPasswordInput, '비밀번호를 정해주세요.');
  const ok = await insertEntry(name, message, password);
  if (ok) {
    gbNameInput.value = '';
    gbMessageInput.value = '';
    gbPasswordInput.value = '';
    drawCount();
    toastSuccess('남겼습니다');
    await loadGuestbook();
  }
});

gbList.addEventListener('click', async (e) => {
  const target = e.target;
  const entry = target.closest('.gb-entry');
  if (!entry) return;
  const id = entry.dataset.id;

  if (target.classList.contains('gb-btn-delete')) {
    const name = entry.querySelector('.gb-entry-name')?.textContent ?? '';
    const result = await Swal.fire({
      ...SWAL,
      icon:'warning',
      title:'이 글을 지울까요?',
      html:`<strong>${escapeHtml(name)}</strong> 님이 남긴 글입니다.<br>지우면 되돌릴 수 없습니다.`,
      input:'password',
      inputPlaceholder:'글을 쓸 때 정한 비밀번호',
      inputAttributes:{ maxlength:30, autocomplete:'off', spellcheck:'false' },
      showCancelButton:true,
      reverseButtons:true,
      focusCancel:true,
      confirmButtonText:'지우기',
      cancelButtonText:'그대로 두기',
      inputValidator:(value) => { if (!value) return '비밀번호를 입력해주세요'; }
    });
    if (!result.isConfirmed) return;
    const ok = await deleteEntry(id, result.value);
    if (ok) { toastSuccess('지웠습니다'); await loadGuestbook(); }
  } else if (target.classList.contains('gb-btn-edit')) {
    // 편집은 한 번에 하나만. 저장·취소가 목록을 통째로 다시 그리므로,
    // 두 개를 열어두면 한쪽을 저장하는 순간 다른 쪽에 쓰던 글이 날아간다
    if (gbList.querySelector('.gb-edit-textarea')) await loadGuestbook();
    const row = gbList.querySelector(`.gb-entry[data-id="${id}"]`);
    if (!row) return;
    const msgDiv = row.querySelector('.gb-entry-msg');
    const original = msgDiv.textContent;
    row.querySelector('.gb-entry-actions').style.display = 'none';
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
    if (!message) return complain(textarea, '내용을 적어주세요.');
    if (!password) return complain(passwordInput, '비밀번호를 입력해주세요.');
    const ok = await updateEntry(id, password, message);
    if (ok) { toastSuccess('저장했습니다'); await loadGuestbook(); }
  } else if (target.classList.contains('gb-btn-cancel')) {
    await loadGuestbook();
  }
});

/* 비밀번호 칸에서 Enter — 폼이 아니라서 기본 제출이 없다. 손으로 이어준다 */
gbList.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || !e.target.classList.contains('gb-edit-password')) return;
  e.preventDefault();
  e.target.closest('.gb-entry').querySelector('.gb-btn-save').click();
});

loadGuestbook();
