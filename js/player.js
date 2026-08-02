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

  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.pl-facade');
    if (b) embed(b.dataset.id, caption.querySelector('b').textContent);
  });

  for (const item of items) {
    item.addEventListener('click', () => {
      const { id, title, sub } = item.dataset;

      caption.innerHTML = '';
      caption.append(
        Object.assign(document.createElement('b'), { textContent: title }),
        Object.assign(document.createElement('span'), { textContent: sub })
      );

      // 곡 이름을 누른 건 듣겠다는 뜻이다. 파사드를 다시 깔면 한 번 더 눌러야 하고,
      // 휴대폰은 무대가 화면 밖이라 아무 일도 안 일어난 것처럼 보인다.
      // 첫 화면에 임베드를 박지 않는다는 원래 목적은 그대로다 — 누르기 전엔 여전히 표지뿐이다
      embed(id, title);
      stage.scrollIntoView({ block: 'nearest' });

      for (const other of items) {
        const isOn = other === item;
        other.classList.toggle('is-on', isOn);
        other.setAttribute('aria-current', isOn ? 'true' : 'false');
      }
    });
    item.setAttribute('aria-current', String(item.classList.contains('is-on')));
  }
})();
