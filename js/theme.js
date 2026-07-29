/* 테마 전환 — 밤(dark) / 낮(light)
   <head>에서 동기 로드된다. 첫 페인트 전에 테마를 확정해야
   새로고침 때 잘못된 색이 번쩍이지 않는다. */
(function () {
  var KEY = 'hanroro-theme';

  function preferred() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) { /* 시크릿 모드 등 — 저장소 접근 불가 */ }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    var toDark = theme === 'light';
    btn.setAttribute('aria-label', toDark ? '어두운 화면으로 전환' : '밝은 화면으로 전환');
    btn.setAttribute('aria-pressed', String(toDark));
  }

  apply(preferred());

  document.addEventListener('DOMContentLoaded', function () {
    apply(document.documentElement.getAttribute('data-theme'));

    var btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* 저장 실패해도 전환은 동작 */ }
    });
  });
})();
