/* 음반 — 목록을 DB에서 그리고, 종류(EP/싱글/OST) × 연도로 거른다. index 전용.

   전용 페이지가 있는 다섯 장(.record)은 서사가 있어 index.html에 그대로 있다.
   나머지 열일곱 장은 Supabase의 public.discography에서 온다 —
   새 발매작은 대시보드에서 행 하나만 넣으면 배포 없이 목록에 붙는다.
   목록을 이 파일 안의 JS 배열로 옮기지는 말 것. 데이터의 자리는 DB나 HTML이지 코드가 아니다.

   supabase-js는 싣지 않는다 — 읽기 한 번에 라이브러리 40KB는 과하다 (js/likes.js와 같은 판단).
   anon 키는 공개용이고, 방어는 RLS와 컬럼 단위 SELECT가 한다. anon에게 쓰기 권한은 없다.
   DB 문자열은 전부 textContent로만 넣는다 — innerHTML로 넣기 시작하면 표지가 바뀌는 날 XSS가 된다.

   ⚠️ 파일을 새로 만들어 여기서 분리하지 말 것. 스크립트 요청이 하나 늘면 폰트
      스타일시트가 먼저 활성화되면서 한글 서브셋 69개가 통째로 FCP 앞으로 끌려오고,
      Lighthouse 성능이 90 → 55로 무너진다 (관측 FCP는 1.3s 그대로, 시뮬레이션만 폭발).
      섹션을 맡은 파일이 그 섹션의 데이터도 가져온다. js/live.js도 같은 이유로 그렇게 한다. */
(() => {
  const root = document.querySelector('.records');
  if (!root) return;

  const groups = [...root.querySelectorAll('[data-group]')];
  const chips  = [...root.querySelectorAll('.chip')];
  const count  = root.querySelector('.dfil-count');
  const empty  = root.querySelector('.disc-empty');
  const on = { kind: 'all', year: 'all' };
  let items = [];

  /* ── DB에서 그리기 ───────────────────────────────────────── */

  const SUPABASE_URL = 'https://avsnujrdogkxvhtelrzx.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2c251anJkb2dreHZodGVscnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDExNzAsImV4cCI6MjEwMDc3NzE3MH0.effnEFNSApyy1qJ5Z8ykHgLiXz-N36xjRsGuZxL6UUE';

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const discItem = (r) => {
    const li = el('li');
    li.dataset.kind = r.kind;
    li.dataset.year = r.released.slice(0, 4);

    const a = el('a', 'disc');
    a.href = `https://music.bugs.co.kr/album/${r.bugs_id}`;
    a.target = '_blank';
    a.rel = 'noopener';

    const cover = el('span', 'cover cover-sm');
    cover.setAttribute('aria-hidden', 'true');
    if (r.cover) {
      const img = el('img');
      img.src = r.cover;
      img.alt = '';
      img.loading = 'lazy';
      cover.append(img);
    }

    const title = el('span', 'disc-title', r.title);
    if (r.tag) title.append(' ', el('span', 'disc-tag', r.tag));

    const body = el('span', 'disc-body');
    body.append(title, el('span', 'disc-sub', r.subtitle ?? ''));

    a.append(cover, body, el('span', 'disc-date', r.released.replaceAll('-', '.')));
    li.append(a);
    return li;
  };

  const draw = (rows) => {
    for (const kind of ['single', 'ost']) {
      const ul = root.querySelector(`.disc-list[data-list="${kind}"]`);
      if (!ul) continue;
      ul.replaceChildren(...rows.filter(r => r.kind === kind).map(discItem));
      // 안내 문구는 목록이 실제로 붙었을 때만 걷는다 (JS가 죽으면 그대로 남아 벅스로 보낸다)
      ul.closest('[data-group]')?.querySelector('[data-fallback]')?.remove();
    }
  };

  /* ── 거르기 ─────────────────────────────────────────────── */

  /* 칩의 개수(<b>)는 HTML에 비어 있다. 실제로 그려진 항목을 세어 채운다 —
     열일곱 장이 DB에서 오므로 손으로 적어두면 행 하나 추가되는 순간 어긋난다 */
  const drawChipCounts = () => {
    for (const chip of chips) {
      const b = chip.querySelector('b');
      if (!b) continue;
      const { axis, value } = chip.dataset;
      b.textContent = value === 'all'
        ? items.length
        : items.filter(node => node.dataset[axis] === value).length;
    }
  };

  const apply = () => {
    let shown = 0;
    for (const node of items) {
      const ok = (on.kind === 'all' || node.dataset.kind === on.kind) &&
                 (on.year === 'all' || node.dataset.year === on.year);
      node.hidden = !ok;
      if (ok) shown++;
    }
    // 목록이 통째로 비면 그 제목·설명까지 숨긴다 (빈 '그 밖의 싱글' 머리글만 남는 걸 막는다)
    for (const g of groups) g.hidden = !g.querySelector('[data-kind]:not([hidden])');

    empty.hidden = shown > 0;
    count.textContent = shown === items.length
      ? `${items.length}장 전부`
      : `${items.length}장 중 ${shown}장`;

    // 걸러내면 아래에 있던 카드가 화면 위로 올라온다 — AOS가 위치를 다시 재야 뜬다
    if (window.AOS) AOS.refresh();
  };

  const recount = () => {
    items = [...root.querySelectorAll('[data-kind]')];
    drawChipCounts();
    apply();
  };

  for (const chip of chips) {
    chip.addEventListener('click', () => {
      const { axis, value } = chip.dataset;
      on[axis] = value;
      for (const c of chips) {
        if (c.dataset.axis !== axis) continue;
        const isOn = c === chip;
        c.classList.toggle('is-on', isOn);
        c.setAttribute('aria-pressed', String(isOn));
      }
      apply();
    });
  }

  /* ── 실행 ───────────────────────────────────────────────── */

  /* ⚠️ 첫 프레임을 그리기 전에는 요청도 DOM 조작도 하지 않는다. 순서를 바꾸지 말 것.
     load만으로는 부족하다 — 표지가 전부 lazy라 load가 340ms에 먼저 떨어진다.
     document.fonts.ready도 안 된다 — 그걸 건드리는 것 자체가 폰트를 앞당긴다.
     rAF로 첫 페인트를 기다린 뒤 다음 태스크로 넘긴다. 이 목록은 첫 화면 밖이다. */
  const load = () => {
    fetch(`${SUPABASE_URL}/rest/v1/discography?select=slug,title,subtitle,tag,kind,released,bugs_id,cover&order=released.desc`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, priority: 'low' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(draw)
      .catch(e => console.error('디스코그래피 불러오기 실패:', e))
      // 실패해도 거르기는 살려둔다 — 전용 페이지 다섯 장만으로도 칩은 동작해야 한다
      .finally(recount);
  };
  const kick = () => requestAnimationFrame(() => setTimeout(load, 0));
  if (document.readyState === 'complete') kick();
  else addEventListener('load', kick, { once: true });
})();
