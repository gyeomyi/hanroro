/* 공연까지 남은 날. 날짜는 HTML에 그대로 적혀 있고 여기서는 배지 한 줄만 덧붙인다.
   JS가 죽어도 날짜는 그대로 보인다. */
(() => {
  const gigs = document.querySelectorAll('.gig');
  if (!gigs.length) return;

  // 자정 기준으로 자른다 — 시각까지 넣으면 '오늘 공연'이 D-0이 아니라 D-1로 나온다
  const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = midnight(new Date());
  const DAY = 86400000;

  for (const gig of gigs) {
    const when = gig.querySelector('[data-date]');
    if (!when) continue;

    const [y, m, d] = when.dataset.date.split('-').map(Number);
    const left = Math.round((new Date(y, m - 1, d) - today) / DAY);

    const tag = document.createElement('span');
    tag.className = 'gig-dday';
    if (left > 0)       { tag.textContent = `D-${left}`; }
    else if (left === 0){ tag.textContent = '오늘'; tag.classList.add('is-today'); }
    else                { tag.textContent = '지난 공연'; gig.classList.add('is-past'); }

    when.after(tag);
  }
})();
