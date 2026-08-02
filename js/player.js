/* 듣기 — 유튜브 파사드.
   임베드 하나가 800KB에 쿠키까지 싣는다. 표지 그림만 깔아두고 누를 때 iframe을 만든다.
   ponytail: 재생 상태는 DOM(있으면 재생 중)으로만 판단한다. 상태 객체가 필요할 만큼 복잡해지면 그때 두자. */
(() => {
  const stage = document.querySelector('.pl-stage');
  if (!stage) return;

  const caption = stage.querySelector('.pl-caption');
  const items = [...document.querySelectorAll('.pl-item')];

  const embed = (id, title) => {
    const f = document.createElement('iframe');
    f.className = 'pl-frame';
    // nocookie 도메인 — 재생 전까지 추적 쿠키를 심지 않는다
    f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    f.title = `${title} — 유튜브 영상`;
    f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    stage.querySelector('.pl-facade, .pl-frame').replaceWith(f);
  };

  const facade = (id, title) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pl-facade';
    b.dataset.id = id;
    b.setAttribute('aria-label', `'${title}' 재생 — 유튜브가 여기서 열립니다`);
    b.innerHTML = `<img class="pl-thumb" src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg"
        alt="" width="1280" height="720" loading="lazy"
        onerror="this.src=this.src.replace('maxresdefault','hqdefault')">
      <span class="pl-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></span>`;
    stage.querySelector('.pl-facade, .pl-frame').replaceWith(b);
    return b;
  };

  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.pl-facade');
    if (b) embed(b.dataset.id, caption.querySelector('b').textContent);
  });

  for (const item of items) {
    item.addEventListener('click', () => {
      const { id, title, sub } = item.dataset;
      // 이미 재생 중이었다면 고른 곡도 바로 튼다 — 두 번 누르게 하지 않는다
      const playing = !!stage.querySelector('.pl-frame');

      caption.innerHTML = '';
      caption.append(
        Object.assign(document.createElement('b'), { textContent: title }),
        Object.assign(document.createElement('span'), { textContent: sub })
      );

      if (playing) embed(id, title);
      else facade(id, title);

      for (const other of items) {
        const isOn = other === item;
        other.classList.toggle('is-on', isOn);
        other.setAttribute('aria-current', isOn ? 'true' : 'false');
      }
    });
    item.setAttribute('aria-current', String(item.classList.contains('is-on')));
  }
})();
