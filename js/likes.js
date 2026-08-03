/* 앨범 좋아요 — 앨범 페이지에서만 돈다.
   supabase-js를 싣지 않고 REST를 직접 부른다. 버튼 하나 때문에 라이브러리를
   통째로 받을 이유가 없다. anon 키는 공개용이고 방어는 RLS·컬럼 권한이 한다.

   ponytail: 중복은 localStorage로만 막는다. 서버는 호출자를 구분하지 않으니
   작정하면 얼마든지 올릴 수 있다. 실제로 어뷰징이 보이면 IP 기준 rate limit을 붙일 것. */
(() => {
  const SUPABASE_URL = 'https://avsnujrdogkxvhtelrzx.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2c251anJkb2dreHZodGVscnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDExNzAsImV4cCI6MjEwMDc3NzE3MH0.effnEFNSApyy1qJ5Z8ykHgLiXz-N36xjRsGuZxL6UUE';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

  /* 메인 음반 목록의 읽기 전용 숫자. .record 카드 전체가 <a>라 버튼은 못 넣는다
     (중첩 링크). 숫자만 얹고 누르는 건 앨범 페이지에서. 요청은 한 번으로 끝난다 */
  /* 남이 누른 것도 새로고침 없이 보이게 한다.
     Realtime 채널 대신 폴링이다 — 앨범 페이지는 supabase-js를 싣지 않고(버튼 하나에 40KB),
     좋아요 수는 초 단위 정확도가 필요한 값이 아니다.
     탭이 숨으면 멈춘다: 배경 탭이 15초마다 요청을 날리면 그건 그냥 낭비다. */
  const POLL = 15000;
  const pollers = [];
  let timer = null;
  const tick = () => pollers.forEach(f => f());
  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => { if (!timer && pollers.length) timer = setInterval(tick, POLL); };
  addEventListener('visibilitychange', () => {
    if (document.hidden) { stop(); return; }
    tick();   // 돌아온 순간 한 번 맞춘다
    start();
  });
  addEventListener('pagehide', stop);

  const chips = document.querySelectorAll('.record-likes');
  if (chips.length) {
    const refreshChips = () =>
      fetch(`${SUPABASE_URL}/rest/v1/album_like?select=album,likes`, { headers: HEADERS })
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(rows => {
          const by = Object.fromEntries(rows.map(r => [r.album, r.likes]));
          chips.forEach(el => {
            const n = by[el.dataset.album];
            if (!n) return; // 0은 붙이지 않는다 — '♥ 0'은 알려주는 게 없다
            el.querySelector('b').textContent = n.toLocaleString('ko-KR');
            el.setAttribute('aria-label', `좋아요 ${n} — 앨범 페이지에서 누를 수 있습니다`);
            el.hidden = false;
          });
        })
        .catch(() => {}); // 못 읽으면 그냥 숨은 채로 둔다
    pollers.push(refreshChips);
    // 첫 화면 밖의 숫자다. 첫 페인트를 그린 뒤에 받는다 (js/content.js의 긴 주석 참고)
    const kick = () => requestAnimationFrame(() => setTimeout(refreshChips, 0));
    if (document.readyState === 'complete') kick();
    else addEventListener('load', kick, { once: true });
  }

  const btn = document.querySelector('.like');
  const album = document.documentElement.dataset.album;
  if (!btn || !album) { start(); return; }

  const countEl = btn.querySelector('.like-count');
  const storeKey = `hanroro-like-${album}`;
  let liked = localStorage.getItem(storeKey) === '1';
  let count = null;
  let busy = false;

  const render = () => {
    btn.classList.toggle('is-liked', liked);
    btn.setAttribute('aria-pressed', String(liked));
    countEl.textContent = count === null ? '–' : count.toLocaleString('ko-KR');
  };

  // 현재 수 읽기. 실패해도 버튼은 그대로 둔다 (누르면 그때 다시 시도된다).
  // 누르는 중(busy)에는 건드리지 않는다 — 낙관적으로 올려둔 값을 서버 응답 전에 덮어쓴다
  const refresh = () => {
    if (busy) return;
    return fetch(`${SUPABASE_URL}/rest/v1/album_like?select=likes&album=eq.${album}`, { headers: HEADERS })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(rows => { count = rows[0]?.likes ?? 0; render(); })
      .catch(() => { if (count === null) countEl.textContent = '–'; });
  };
  pollers.push(refresh);
  refresh();
  start();

  btn.addEventListener('click', async () => {
    if (busy) return;
    busy = true;

    // 낙관적 반영 — 실패하면 되돌린다
    const prev = { liked, count };
    liked = !liked;
    if (count !== null) count = Math.max(0, count + (liked ? 1 : -1));
    render();

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/like_album`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_album: album, p_on: liked })
      });
      if (!res.ok) throw new Error(res.status);
      count = await res.json();
      localStorage.setItem(storeKey, liked ? '1' : '0');
    } catch {
      liked = prev.liked;
      count = prev.count;
      btn.classList.add('is-failed');
      setTimeout(() => btn.classList.remove('is-failed'), 1200);
    }
    render();
    busy = false;
  });

  render();
})();
