// Runs before first paint (loaded without defer) so a stored theme never flashes.
// Also marks the page as JS-capable, which swaps the static cursor for the live prompt.
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  try {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t);
  } catch (e) { /* storage blocked: follow the system theme */ }
})();
