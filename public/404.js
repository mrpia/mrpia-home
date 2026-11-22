// Show the path the visitor asked for. textContent, never innerHTML: the path is user input.
(() => {
  let path = location.pathname;
  try { path = decodeURIComponent(path); } catch (e) { /* keep it encoded */ }
  for (const id of ['path', 'path2']) {
    const n = document.getElementById(id);
    if (n) n.textContent = path;
  }
})();
