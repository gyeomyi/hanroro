/* 숨은 문장 — 1111.
   생일이자 시그니처 숫자(2000.11.11)를 타이핑하거나,
   자몽살구클럽의 0+0=∞ 식을 네 번 두드리면 열린다.
   두 갈래인 이유: 휴대폰에는 키보드가 없다. 하나만 두면 절반은 영영 못 찾는다. */
(() => {
  const egg = document.querySelector('.egg');
  if (!egg) return;

  let timer;
  const open = () => {
    if (!egg.hidden) return;
    egg.hidden = false;
    // 6초 뒤 알아서 닫힌다 — 닫는 법을 모르는 사람이 갇히지 않게
    timer = setTimeout(close, 6000);
  };
  const close = () => {
    clearTimeout(timer);
    egg.hidden = true;
  };

  egg.addEventListener('click', close);

  // 갈래 1 — '1111' 타이핑. 입력창에 치는 중이면 무시한다
  let typed = '';
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    // target이 늘 Element인 건 아니다 (document·window로 올 수 있다) → closest 유무를 먼저 본다
    if (e.target?.closest?.('input, textarea, [contenteditable]')) return;

    typed = (typed + e.key).slice(-4);
    if (typed === '1111') { typed = ''; open(); }
  });

  // 갈래 2 — 0+0=∞ 를 네 번. 느리게 누르면 처음부터
  const formula = document.querySelector('.formula');
  if (!formula) return;

  let taps = 0, last = 0;
  formula.addEventListener('click', () => {
    const now = Date.now();
    taps = now - last > 1200 ? 1 : taps + 1;
    last = now;
    if (taps >= 4) { taps = 0; open(); }
  });
})();
