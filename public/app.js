// The live prompt at the bottom of the page. Everything it prints about the
// projects, the bio, the CV and the contacts is read from the page itself, so
// index.html stays the one place to edit content.
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const root = document.documentElement;
  const term = $('#term');
  const session = $('#session');
  const form = $('#prompt');
  const input = $('#cmd');

  // ---------- small helpers ----------

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  const link = (href, text) => {
    const a = el('a', null, text || href.replace(/^https?:\/\/|\/$/g, ''));
    a.href = href;
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  };

  // print('text'), print(['a ', node, ' b']), print(node)
  const print = (content, cls) => {
    const line = el('p', 'line' + (cls ? ' ' + cls : ''));
    (Array.isArray(content) ? content : [content]).forEach((part) =>
      line.append(typeof part === 'string' ? document.createTextNode(part) : part));
    session.append(line);
    return line;
  };

  const ps1 = () => {
    const p = el('span', 'ps1');
    p.append(el('b', null, 'guest@mrpia'), ':', el('i', null, '~'), '$ ');
    return p;
  };

  // Re-print a static section's output block (whoami, cv, contact).
  const reprint = (sel) => {
    const src = $(sel);
    if (src) session.append(src.cloneNode(true));
  };

  const open = (url) => {
    print(['opening ', link(url), ' …'], 'dim');
    window.open(url, '_blank', 'noopener');
  };

  // ---------- data read from the page ----------

  const projects = [...document.querySelectorAll('.card[data-name]')].map((card) => ({
    name: card.dataset.name,
    play: $('a.play', card)?.href,
    src: $('a.src', card)?.href,
    blurb: $('.blurb', card)?.textContent.trim().split(/(?<=\.)\s/)[0],
  }));
  // Accepts "geo-quizz", "~/stuff/geo-quizz/" or any unique prefix like "geo".
  // Prints the error itself (prefixed like the shell would) and returns undefined on a miss.
  const project = (name, who) => {
    const n = (name || '').toLowerCase().replace(/^~?\/?(stuff\/)?|\/$/g, '');
    const exact = projects.find((p) => p.name === n);
    if (exact) return exact;
    const hits = n ? projects.filter((p) => p.name.startsWith(n)) : [];
    if (hits.length === 1) return hits[0];
    if (hits.length > 1) print(`${who}: ${name}: which one? ${hits.map((p) => p.name).join('  ')}`, 'err');
    else print(`${who}: ${name}: No such file or directory. try: ls`, 'err');
  };

  // ---------- theme ----------

  const effectiveTheme = () =>
    root.dataset.theme ||
    (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

  const setTheme = (t) => {
    if (t === 'auto') delete root.dataset.theme;
    else root.dataset.theme = t;
    try {
      if (t === 'auto') localStorage.removeItem('theme');
      else localStorage.setItem('theme', t);
    } catch (e) { /* not persisted, still applied */ }
  };

  $('.theme-toggle')?.addEventListener('click', () =>
    setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark'));

  // ---------- commands ----------

  const HELP = [
    ['whoami', 'who runs this place'],
    ['ls', 'list ~/stuff'],
    ['open <name>', 'launch a project (Tab completes)'],
    ['src <name>', 'read its source on GitHub'],
    ['cv', 'the résumé'],
    ['contact', 'ways to reach me'],
    ['coffee', 'buy me one ☕'],
    ['theme <dark|light|auto>', 'repaint'],
    ['clear, reset', 'wipe the screen, or bring the page back'],
    ['date, echo, history', 'the usual'],
  ];

  const commands = {
    help() {
      print('available commands:');
      const dl = el('dl', 'kv help');
      HELP.forEach(([c, d]) => dl.append(el('dt', null, c), el('dd', 'dim', d)));
      session.append(dl);
    },
    whoami() { reprint('#whoami .out'); },
    ls(args) {
      if (args.some((a) => a.startsWith('-') && a.includes('l'))) {
        projects.forEach((p) => print([link(p.play, p.name + '/'), '  ', el('span', 'dim', p.blurb)]));
      } else {
        const parts = [];
        projects.forEach((p, i) => parts.push(i ? '  ' : '', link(p.play, p.name + '/')));
        print(parts);
      }
    },
    open([name]) {
      if (!name) return print('usage: open <name>   (try: ls)');
      const p = project(name, 'open');
      if (p) open(p.play);
    },
    cd([dir]) {
      if (!dir || dir === '~' || dir === '/' || dir === '..') return print('you are already home.', 'dim');
      if (dir === 'stuff' || dir === '~/stuff') return commands.ls(['-l']);
      const p = project(dir, 'bash: cd');
      if (p) open(p.play);
    },
    src([name]) {
      if (!name) return open('https://github.com/mrpia/mrpia-home');
      const p = project(name, 'src');
      if (p) open(p.src);
    },
    cat([file]) {
      if (!file) return print('usage: cat <file>   (try: cat cv.md)');
      if (/cv/.test(file)) return reprint('#cv .out');
      if (/contact/.test(file)) return reprint('#contact .kv');
      if (/whoami|about|readme/i.test(file)) return reprint('#whoami .out');
      print(`cat: ${file}: No such file or directory`, 'err');
    },
    cv() { reprint('#cv .out'); },
    contact() { reprint('#contact .kv'); },
    coffee() { open('https://buymeacoffee.com/mrpia'); },
    theme([t]) {
      if (!['dark', 'light', 'auto'].includes(t)) return print(`theme is ${effectiveTheme()}. usage: theme <dark|light|auto>`);
      setTheme(t);
      print(`theme set to ${t}.`, 'dim');
    },
    date() { print(new Date().toString()); },
    echo(args) { print(args.join(' ')); },
    pwd() { print('/home/guest'); },
    history() { history.forEach((h, i) => print(`${String(i + 1).padStart(4)}  ${h}`)); },
    clear() {
      session.replaceChildren();
      term.classList.add('cleared');
      input.scrollIntoView({ block: 'nearest' });
    },
    reset() {
      session.replaceChildren();
      term.classList.remove('cleared');
      window.scrollTo({ top: 0 });
    },
    uname() { print('mrpia.ch static-html firebase-hosting'); },
    sudo() { print('guest is not in the sudoers file. This incident will be reported.', 'err'); },
    rm() { print('rm: cannot remove: the kids are still using it', 'err'); },
    vim() { print('vim: no. you would never find the way out.', 'dim'); },
    exit() { print('logout… just kidding. close the tab whenever you like 👋', 'dim'); },
  };
  commands.ll = () => commands.ls(['-l']);
  commands.dir = commands.ls;
  commands.vi = commands.nvim = commands.emacs = commands.nano = commands.vim;
  commands.logout = commands.exit;
  commands.man = () => commands.help();

  // Names offered by Tab: the documented ones, not the easter eggs.
  const COMPLETABLE = ['help', 'whoami', 'ls', 'open', 'src', 'cv', 'contact', 'coffee', 'theme', 'date', 'echo', 'history', 'clear', 'reset', 'cd', 'cat'];
  const ARG_COMPLETIONS = {
    open: () => projects.map((p) => p.name),
    src: () => projects.map((p) => p.name),
    cd: () => projects.map((p) => p.name),
    cat: () => ['cv.md', '.contact'],
    theme: () => ['dark', 'light', 'auto'],
  };

  // ---------- running a line ----------

  const history = [];
  let cursor = 0;

  const run = (raw) => {
    const line = raw.trim();
    const echoLine = print([ps1(), raw], 'cmdline');
    if (!line) return;
    history.push(line);
    const [name, ...args] = line.split(/\s+/);
    const fn = commands[name.toLowerCase()];
    if (fn) fn(args);
    else print(`${name}: command not found. try: help`, 'err');
    echoLine.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value;
    input.value = '';
    run(value);
    cursor = history.length;
    input.scrollIntoView({ block: 'nearest' });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (!history.length) return;
      e.preventDefault();
      cursor = Math.max(0, Math.min(history.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[cursor] || '';
      return;
    }
    if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); commands.clear(); return; }
    // Tab completes only when there is something to complete, so an empty
    // prompt never traps keyboard focus.
    if (e.key === 'Tab' && !e.shiftKey && input.value.trim()) {
      e.preventDefault();
      const words = input.value.replace(/^\s+/, '').split(/\s+/);
      const last = words[words.length - 1];
      const pool = words.length === 1
        ? COMPLETABLE
        : (ARG_COMPLETIONS[words[0]] || (() => []))();
      const hits = pool.filter((c) => c.startsWith(last));
      if (hits.length === 1) {
        words[words.length - 1] = hits[0];
        input.value = words.join(' ') + ' ';
      } else if (hits.length > 1) {
        print([ps1(), input.value], 'cmdline');
        print(hits.join('  '));
        input.scrollIntoView({ block: 'nearest' });
      }
    }
  });

  form.addEventListener('click', () => input.focus());

  // ---------- small touches ----------

  const ll = $('#last-login');
  if (ll) {
    const d = new Date();
    ll.textContent = `${d.toDateString().slice(0, 10)} ${d.toTimeString().slice(0, 8)}`;
  }
})();
