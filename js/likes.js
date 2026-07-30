/* 앨범 좋아요 — 앨범 페이지에서만 돈다.
   supabase-js를 싣지 않고 REST를 직접 부른다. 버튼 하나 때문에 라이브러리를
   통째로 받을 이유가 없다. anon 키는 공개용이고 방어는 RLS·컬럼 권한이 한다.

   ponytail: 중복은 localStorage로만 막는다. 서버는 호출자를 구분하지 않으니
   작정하면 얼마든지 올릴 수 있다. 실제로 어뷰징이 보이면 IP 기준 rate limit을 붙일 것. */
(() => {
  const SUPABASE_URL = 'https://avsnujrdogkxvhtelrzx.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2c251anJkb2dreHZodGVscnp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMDExNzAsImV4cCI6MjEwMDc3NzE3MH0.effnEFNSApyy1qJ5Z8ykHgLiXz-N36xjRsGuZxL6UUE';
  const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

  const btn = document.querySelector('.like');
  const album = document.documentElement.dataset.album;
  if (!btn || !album) return;

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

  // 현재 수 읽기. 실패해도 버튼은 그대로 둔다 (누르면 그때 다시 시도된다)
  fetch(`${SUPABASE_URL}/rest/v1/album_like?select=likes&album=eq.${album}`, { headers: HEADERS })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(rows => { count = rows[0]?.likes ?? 0; render(); })
    .catch(() => { countEl.textContent = '–'; });

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
