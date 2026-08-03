/* 무대 — 다가오는 공연을 DB에서 그리고 남은 날을 붙인다. index 전용.

   일정은 Supabase의 public.gig에서 온다. 지난 공연은 서버가 걸러낸다
   (until = coalesce(ends_on, starts_on) 생성 열이 오늘 이후인 것만).
   그래서 공연이 끝나면 손대지 않아도 목록에서 빠지고, 새 공연은 대시보드에서 행 하나면 된다.

   날짜와 D-day가 같은 값에서 나오므로 둘이 어긋날 수가 없다 —
   예전에는 화면에 적은 날짜와 data-date를 손으로 맞춰야 했다.

   ⚠️ 파일을 새로 만들어 데이터 로딩만 분리하지 말 것 (js/disco.js의 같은 경고 참고).
      스크립트 요청 하나가 늘면 Lighthouse 성능이 90 → 55로 무너진다. */
(() => {
  const list = document.querySelector('.gig-list');

  // 자정 기준으로 자른다 — 시각까지 넣으면 '오늘 공연'이 D-0이 아니라 D-1로 나온다
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const DAY = 86400000;

  const mark = () => {
    const today = midnight(new Date());

    for (const gig of document.querySelectorAll('.gig')) {
      const when = gig.querySelector('[data-date]');
      if (!when) continue;
      gig.querySelector('.gig-dday')?.remove(); // 다시 그려도 배지가 겹치지 않게

      const [y, m, d] = when.dataset.date.split('-').map(Number);
      const left = Math.round((new Date(y, m - 1, d) - today) / DAY);

      const tag = document.createElement('span');
      tag.className = 'gig-dday';
      if (left > 0)       { tag.textContent = `D-${left}`; }
      else if (left === 0){ tag.textContent = '오늘'; tag.classList.add('is-today'); }
      else                { tag.textContent = '지난 공연'; gig.classList.add('is-past'); }

      when.after(tag);
    }
  };

  mark(); // HTML에 .gig가 직접 적혀 있어도 그대로 동작한다
  if (!list) return;

  const SUPABASE_URL = 'https://avsnujrdogkxvhtelrzx.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2c251anJkb2dreHZodGVscnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDExNzAsImV4cCI6MjEwMDc3NzE3MH0.effnEFNSApyy1qJ5Z8ykHgLiXz-N36xjRsGuZxL6UUE';

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // 이틀 이상이면 기간을 한 줄로 덧붙인다. 큰 날짜는 왼쪽 time이 이미 보여준다
  const spanText = (s, e) => {
    if (!e || e === s) return '';
    const [, sm, sd] = s.split('-').map(Number);
    const [, em, ed] = e.split('-').map(Number);
    return sm === em ? `${sm}월 ${sd}–${ed}일.` : `${sm}월 ${sd}일 – ${em}월 ${ed}일.`;
  };

  const gigItem = (g) => {
    const li = el('li', 'gig');
    li.dataset.aos = 'fade-up';

    const [yy, mm, dd] = g.starts_on.split('-');
    const when = el('time', 'gig-when');
    when.dateTime = g.starts_on;
    when.dataset.date = g.starts_on; // 위 mark()가 여기서 남은 날을 읽는다
    when.append(el('span', 'gig-mm', mm), el('span', 'gig-dd', dd), el('span', 'gig-yy', yy));

    const body = el('div', 'gig-body');
    body.append(el('h3', 'gig-title', g.title), el('p', 'gig-place', g.venue));
    const note = [g.note, spanText(g.starts_on, g.ends_on)].filter(Boolean).join(' ');
    if (note) body.append(el('p', 'gig-note', note));

    li.append(when, body);
    if (g.tag) li.append(el('span', 'gig-tag', g.tag));
    return li;
  };

  const load = () => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    fetch(`${SUPABASE_URL}/rest/v1/gig?select=id,title,venue,note,starts_on,ends_on,tag&until=gte.${iso}&order=starts_on.asc`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, priority: 'low' })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(rows => {
        list.replaceChildren(...rows.map(gigItem));
        // 안내 문구는 목록이 실제로 붙었을 때만 걷는다
        document.querySelector('#live [data-fallback]')?.remove();
        mark();
        if (window.AOS) AOS.refresh();
      })
      .catch(e => console.error('공연 일정 불러오기 실패:', e));
  };
  // 첫 페인트 뒤로 미룬다 (js/disco.js의 긴 주석 참고)
  const kick = () => requestAnimationFrame(() => setTimeout(load, 0));
  if (document.readyState === 'complete') kick();
  else addEventListener('load', kick, { once: true });
})();
