/* 음반 거르기 — 종류(EP/싱글/OST) × 연도.
   목록 스물두 장은 index.html에 그대로 적혀 있고 여기서는 hidden만 토글한다.
   데이터를 JS 배열로 옮기면 검색엔진이 목록을 못 읽고 코드만 늘어난다. 얻는 게 없다. */
(() => {
  const root = document.querySelector('.records');
  if (!root) return;

  const items  = [...root.querySelectorAll('[data-kind]')];
  const groups = [...root.querySelectorAll('[data-group]')];
  const chips  = [...root.querySelectorAll('.chip')];
  const count  = root.querySelector('.dfil-count');
  const empty  = root.querySelector('.disc-empty');
  const on = { kind: 'all', year: 'all' };

  const apply = () => {
    let shown = 0;
    for (const el of items) {
      const ok = (on.kind === 'all' || el.dataset.kind === on.kind) &&
                 (on.year === 'all' || el.dataset.year === on.year);
      el.hidden = !ok;
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

  apply();
})();
