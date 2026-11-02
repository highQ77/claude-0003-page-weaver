const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const escText = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const STORAGE_KEY = 'tw-builder:v1';
const TAILWIND_SRC = 'https://cdn.tailwindcss.com/3.4.17';
const IMG_PH = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'><rect width='100%' height='100%' fill='%23e2e8f0'/><text x='50%' y='50%' fill='%2394a3b8' font-family='sans-serif' font-size='32' text-anchor='middle' dominant-baseline='middle'>800 x 450</text></svg>`;

const VOID = new Set(['AREA','BASE','BR','COL','EMBED','HR','IMG','INPUT','LINK','META','SOURCE','TRACK','WBR']);
const INLINE = new Set(['A','SPAN','STRONG','EM','B','I','U','S','SMALL','CODE','BR','SUP','SUB','MARK']);
const CONTAINERS = new Set(['BODY','DIV','SECTION','HEADER','FOOTER','MAIN','NAV','ARTICLE','ASIDE','FORM','UL','OL','LI','FIGURE','BLOCKQUOTE','FIELDSET']);
const TEXT_TAGS = new Set(['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','LI','LABEL','BLOCKQUOTE','STRONG','EM','SMALL','FIGCAPTION','CODE','TD','TH']);
const isContainer = el => CONTAINERS.has(el.tagName);

const ico = p => `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

const BLOCKS = [
  { cat: '版面', label: '區段', icon: ico('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>'),
    html: '<section class="px-8 py-16"><div class="max-w-5xl mx-auto"></div></section>' },
  { cat: '版面', label: '容器', icon: ico('<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 2"/>'),
    html: '<div class="p-4"></div>' },
  { cat: '版面', label: '兩欄', icon: ico('<rect x="3" y="5" width="8" height="14" rx="1"/><rect x="13" y="5" width="8" height="14" rx="1"/>'),
    html: '<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="p-4"></div><div class="p-4"></div></div>' },
  { cat: '版面', label: '三欄', icon: ico('<rect x="2" y="5" width="5.5" height="14" rx="1"/><rect x="9.25" y="5" width="5.5" height="14" rx="1"/><rect x="16.5" y="5" width="5.5" height="14" rx="1"/>'),
    html: '<div class="grid grid-cols-1 md:grid-cols-3 gap-6"><div class="p-4"></div><div class="p-4"></div><div class="p-4"></div></div>' },
  { cat: '版面', label: 'Flex 列', icon: ico('<rect x="3" y="8" width="5" height="8" rx="1"/><rect x="10" y="8" width="5" height="8" rx="1"/><rect x="17" y="8" width="4" height="8" rx="1"/>'),
    html: '<div class="flex flex-wrap items-center gap-4 p-4"></div>' },
  { cat: '基本', label: '標題', icon: ico('<path d="M6 4v16M18 4v16M6 12h12"/>'),
    html: '<h2 class="text-3xl font-bold text-slate-900">標題文字</h2>' },
  { cat: '基本', label: '段落', icon: ico('<path d="M4 6h16M4 10h16M4 14h12M4 18h8"/>'),
    html: '<p class="text-base text-slate-600 leading-relaxed">這是一段文字，雙擊即可直接編輯內容。</p>' },
  { cat: '基本', label: '按鈕', icon: ico('<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M9 12h6"/>'),
    html: '<button class="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">按鈕</button>' },
  { cat: '基本', label: '連結', icon: ico('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    html: '<a href="#" class="text-blue-600 hover:underline">連結文字</a>' },
  { cat: '基本', label: '圖片', icon: ico('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-8 8"/>'),
    html: `<img src="${IMG_PH}" alt="圖片" class="w-full h-auto rounded-lg">` },
  { cat: '基本', label: '清單', icon: ico('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="18" r=".8"/>'),
    html: '<ul class="list-disc pl-6 space-y-1 text-slate-700"><li>項目一</li><li>項目二</li><li>項目三</li></ul>' },
  { cat: '基本', label: '引言', icon: ico('<path d="M7 7h4v4H8l-1 4M15 7h4v4h-3l-1 4"/>'),
    html: '<blockquote class="border-l-4 border-blue-500 pl-4 italic text-slate-600">設計不只是外觀，而是運作方式。</blockquote>' },
  { cat: '基本', label: '分隔線', icon: ico('<path d="M3 12h18"/>'),
    html: '<hr class="my-8 border-slate-200">' },
  { cat: '表單', label: '表單', icon: ico('<rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="16" width="8" height="4" rx="1"/>'),
    html: '<form class="space-y-4 max-w-md"><div><label class="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" placeholder="you@example.com" class="w-full rounded-lg border border-slate-300 px-3 py-2"></div><div><label class="block text-sm font-medium text-slate-700 mb-1">訊息</label><textarea rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2"></textarea></div><button type="submit" class="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium">送出</button></form>' },
  { cat: '表單', label: '輸入框', icon: ico('<rect x="3" y="8" width="18" height="8" rx="1"/><path d="M7 11v2"/>'),
    html: '<input type="text" placeholder="請輸入…" class="w-full rounded-lg border border-slate-300 px-3 py-2">' },
  { cat: '表單', label: '文字區域', icon: ico('<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M16 16l2 2M13 16l5 0"/>'),
    html: '<textarea rows="4" placeholder="請輸入…" class="w-full rounded-lg border border-slate-300 px-3 py-2"></textarea>' },
  { cat: '區塊', label: '導覽列', icon: ico('<rect x="2" y="6" width="20" height="5" rx="1"/><path d="M5 8.5h3M13 8.5h2M17 8.5h2"/>'),
    html: '<nav class="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200"><a href="#" class="text-xl font-bold text-slate-900">Brand</a><ul class="flex gap-6 text-sm text-slate-600"><li><a href="#">首頁</a></li><li><a href="#">功能</a></li><li><a href="#">聯絡</a></li></ul></nav>' },
  { cat: '區塊', label: 'Hero', icon: ico('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 10h10M9 13h6"/><rect x="10" y="15" width="4" height="2" rx="1"/>'),
    html: '<section class="px-8 py-24 text-center bg-slate-900 text-white"><h1 class="text-5xl font-extrabold tracking-tight">大標題放這裡</h1><p class="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">用一句話說明你的產品價值。</p><div class="mt-8 flex justify-center gap-3"><a href="#" class="px-6 py-3 rounded-lg bg-white text-slate-900 font-medium">立即開始</a></div></section>' },
  { cat: '區塊', label: '卡片', icon: ico('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 10h16M7 14h10M7 17h6"/>'),
    html: `<div class="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm"><img src="${IMG_PH}" alt="" class="w-full h-40 object-cover"><div class="p-5"><h3 class="text-lg font-semibold text-slate-900">卡片標題</h3><p class="mt-2 text-sm text-slate-600">卡片的描述文字。</p><button class="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">查看更多</button></div></div>` },
  { cat: '區塊', label: '頁尾', icon: ico('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 15h20"/>'),
    html: '<footer class="px-8 py-10 bg-slate-100 text-center text-sm text-slate-500"><p>© 2026 Brand. All rights reserved.</p></footer>' },
];

const DEFAULT_HTML = `
<nav class="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
  <a href="#" class="text-xl font-bold text-slate-900">Brand</a>
  <ul class="flex gap-6 text-sm text-slate-600"><li><a href="#">首頁</a></li><li><a href="#">功能</a></li><li><a href="#">價格</a></li></ul>
</nav>
<section class="px-8 py-24 text-center bg-gradient-to-b from-blue-50 to-white">
  <h1 class="text-5xl font-extrabold text-slate-900 tracking-tight">打造你的下一個網站</h1>
  <p class="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">從左側拖曳元件到畫布，點選元素後在右側編輯屬性，雙擊文字即可直接修改。</p>
  <div class="mt-8 flex justify-center gap-3">
    <button class="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">開始使用</button>
    <button class="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50">了解更多</button>
  </div>
</section>
<section class="px-8 py-16">
  <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="p-6 rounded-xl border border-slate-200"><h3 class="text-lg font-semibold text-slate-900">拖放編輯</h3><p class="mt-2 text-sm text-slate-600">元件、畫布與圖層之間都能自由拖曳。</p></div>
    <div class="p-6 rounded-xl border border-slate-200"><h3 class="text-lg font-semibold text-slate-900">Tailwind 原生</h3><p class="mt-2 text-sm text-slate-600">直接編輯 utility class，即時預覽。</p></div>
    <div class="p-6 rounded-xl border border-slate-200"><h3 class="text-lg font-semibold text-slate-900">Design / Code</h3><p class="mt-2 text-sm text-slate-600">隨時切換到原始碼模式手動調整。</p></div>
  </div>
</section>`;

const CANVAS_CSS = `
  body { min-height: 100vh; }
  * { cursor: default; }
  [contenteditable="true"] { cursor: text; outline: 2px solid #f59e0b !important; outline-offset: 2px; }
  :is(div,section,header,footer,main,nav,article,aside,form,ul,ol,figure,fieldset):empty { min-height: 56px; outline: 1px dashed #94a3b8; outline-offset: -4px; }
`;

const COLORS = ['white','black','slate-50','slate-100','slate-200','slate-400','slate-500','slate-700','slate-900','red-500','orange-500','amber-400','green-500','emerald-600','teal-500','sky-500','blue-500','blue-600','indigo-600','violet-600','purple-600','pink-500','rose-500'];
const PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const CLASS_GROUPS = [
  { label: '文字大小', re: /^text-(xs|sm|base|lg|xl|[2-9]xl)$/, opts: ['text-xs','text-sm','text-base','text-lg','text-xl','text-2xl','text-3xl','text-4xl','text-5xl','text-6xl'] },
  { label: '字重', re: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/, opts: ['font-light','font-normal','font-medium','font-semibold','font-bold','font-extrabold'] },
  { label: '對齊', re: /^text-(left|center|right|justify)$/, opts: ['text-left','text-center','text-right','text-justify'] },
  { label: '文字顏色', re: new RegExp(`^text-(white|black|(${PALETTE})-\\d{2,3})$`), opts: COLORS.map(c => 'text-' + c) },
  { label: '背景色', re: new RegExp(`^bg-(white|black|transparent|(${PALETTE})-\\d{2,3})$`), opts: ['bg-transparent', ...COLORS.map(c => 'bg-' + c)] },
  { label: '內距', re: /^p-(\d+(\.5)?|px)$/, opts: ['p-0','p-1','p-2','p-3','p-4','p-6','p-8','p-10','p-12','p-16'] },
  { label: '外距', re: /^m-(\d+(\.5)?|px|auto)$/, opts: ['m-0','m-1','m-2','m-4','m-6','m-8','m-auto'] },
  { label: '圓角', re: /^rounded(-(none|sm|md|lg|xl|2xl|3xl|full))?$/, opts: ['rounded-none','rounded-sm','rounded','rounded-md','rounded-lg','rounded-xl','rounded-2xl','rounded-full'] },
  { label: '陰影', re: /^shadow(-(none|sm|md|lg|xl|2xl|inner))?$/, opts: ['shadow-none','shadow-sm','shadow','shadow-md','shadow-lg','shadow-xl','shadow-2xl'] },
  { label: '顯示', re: /^(block|inline-block|inline|flex|inline-flex|grid|hidden)$/, opts: ['block','inline-block','inline','flex','inline-flex','grid','hidden'] },
];
const SUGGEST_ATTRS = {
  IMG: ['src','alt'], A: ['href','target','title'], INPUT: ['type','name','placeholder','value'],
  BUTTON: ['type'], TEXTAREA: ['name','placeholder','rows'], FORM: ['action','method'],
  LABEL: ['for'], IFRAME: ['src'], VIDEO: ['src','controls'], SELECT: ['name'],
};
const STYLE_PROPS = [
  ['width','寬度'], ['height','高度'], ['min-height','最小高度'], ['margin','外距'], ['padding','內距'],
  ['color','文字色',true], ['background-color','背景色',true], ['font-size','字級'], ['line-height','行高'],
  ['border','邊框'], ['border-radius','圓角'], ['opacity','透明度'],
];

const state = {
  doc: null, body: null, win: null,
  selected: null, hover: null, editing: null,
  mode: 'design', drag: null, canvasDrop: null, treeDrop: null,
  undo: [], redo: [], collapsed: new WeakSet(), treeMap: new Map(), codeBaseline: '',
};

/* ---------- 儲存 / 歷史 ---------- */
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function save(snap) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ html: snap.html, bodyClass: snap.bodyClass })); } catch {}
}
function cleanHTML() {
  const c = state.body.cloneNode(true);
  c.querySelectorAll('[contenteditable]').forEach(n => n.removeAttribute('contenteditable'));
  return c.innerHTML;
}
const takeSnap = () => ({ html: cleanHTML(), bodyClass: state.body.className, sel: pathOf(state.selected) });

function commit() {
  const snap = takeSnap();
  const last = state.undo.at(-1);
  if (!last || last.html !== snap.html || last.bodyClass !== snap.bodyClass) {
    state.undo.push(snap);
    if (state.undo.length > 100) state.undo.shift();
    state.redo = [];
    save(snap);
  } else last.sel = snap.sel;
  renderTree();
  renderBreadcrumb();
  updateHistoryButtons();
}
function restore(snap) {
  state.editing = null;
  state.body.innerHTML = snap.html;
  state.body.className = snap.bodyClass;
  state.selected = elAt(snap.sel);
  save(snap);
  if (state.mode === 'code') setCode(formatHTML(state.body));
  renderAll();
}
function undo() {
  if (state.undo.length <= 1) return;
  state.redo.push(state.undo.pop());
  restore(state.undo.at(-1));
}
function redo() {
  const s = state.redo.pop();
  if (!s) return;
  state.undo.push(s);
  restore(s);
}
function updateHistoryButtons() {
  $('#btn-undo').disabled = state.undo.length <= 1;
  $('#btn-redo').disabled = !state.redo.length;
}
function pathOf(el) {
  if (!el || !state.body.contains(el)) return null;
  const path = [];
  while (el !== state.body) { path.unshift([...el.parentElement.children].indexOf(el)); el = el.parentElement; }
  return path;
}
function elAt(path) {
  if (!path) return null;
  let el = state.body;
  for (const i of path) { el = el.children[i]; if (!el) return null; }
  return el;
}

/* ---------- Canvas ---------- */
const frame = $('#frame');
frame.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="${TAILWIND_SRC}"><\/script><style>${CANVAS_CSS}</style><\/head><body><\/body><\/html>`;
frame.addEventListener('load', initCanvas, { once: true });

function initCanvas() {
  state.doc = frame.contentDocument;
  state.win = frame.contentWindow;
  state.body = state.doc.body;
  const saved = load();
  state.body.innerHTML = saved?.html ?? DEFAULT_HTML.trim();
  state.body.className = saved?.bodyClass ?? 'bg-white text-slate-800 antialiased';
  bindCanvas(state.doc);
  state.undo = [takeSnap()];
  renderAll();
  requestAnimationFrame(tick);
}

function bindCanvas(doc) {
  doc.addEventListener('mouseover', e => {
    if (state.drag) return;
    state.hover = e.target === doc.documentElement ? null : e.target;
  });
  doc.documentElement.addEventListener('mouseleave', () => state.hover = null);
  doc.addEventListener('mousedown', e => {
    if (state.editing?.contains(e.target)) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) e.preventDefault();
  });
  doc.addEventListener('click', e => {
    if (state.editing?.contains(e.target)) return;
    e.preventDefault();
    select(e.target === doc.documentElement ? state.body : e.target);
  }, true);
  doc.addEventListener('dblclick', e => {
    if (isTextEditable(e.target)) startEditing(e.target);
  });
  doc.addEventListener('submit', e => e.preventDefault(), true);
  doc.addEventListener('dragstart', e => { if (!state.drag) e.preventDefault(); });
  doc.addEventListener('dragover', e => {
    e.preventDefault();
    clearTreeIndicator();
    if (!state.drag) return;
    const drop = computeCanvasDrop(e.clientX, e.clientY);
    if (drop && validDrop(drop)) {
      state.canvasDrop = drop;
      e.dataTransfer.dropEffect = state.drag.type === 'move' ? 'move' : 'copy';
      showPlaceholder(drop);
    } else {
      state.canvasDrop = null;
      e.dataTransfer.dropEffect = 'none';
      hidePlaceholder();
    }
  });
  doc.addEventListener('drop', e => {
    e.preventDefault();
    if (state.drag) performDrop(state.canvasDrop);
  });
  doc.addEventListener('keydown', onKey);
}

const movingEl = () => state.drag?.type === 'move' ? state.drag.el : null;

function isHorizontal(el) {
  if (!el) return false;
  const cs = state.win.getComputedStyle(el);
  if (cs.display.includes('flex')) return !cs.flexDirection.startsWith('column');
  if (cs.display.includes('grid')) return cs.gridTemplateColumns.trim().split(/\s+/).length > 1;
  return false;
}

function childBefore(container, x, y) {
  const horiz = isHorizontal(container);
  const moving = movingEl();
  for (const c of container.children) {
    if (c === moving) continue;
    const r = c.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    if (horiz) {
      if (y >= r.top && y <= r.bottom ? x < r.left + r.width / 2 : y < r.top) return c;
    } else if (y < r.top + r.height / 2) return c;
  }
  return null;
}

function computeCanvasDrop(x, y) {
  const body = state.body;
  let t = state.doc.elementFromPoint(x, y);
  if (!t || t === state.doc.documentElement) t = body;
  const moving = movingEl();
  if (moving && moving.contains(t)) t = moving;
  if (t === body) return { parent: body, before: childBefore(body, x, y) };
  // 非容器元素往上找到直接位於容器內的那層
  while (!isContainer(t) && t.parentElement !== body && !isContainer(t.parentElement)) t = t.parentElement;

  const parent = t.parentElement;
  const r = t.getBoundingClientRect();
  const horiz = isHorizontal(parent);
  const pos = horiz ? x - r.left : y - r.top;
  const size = horiz ? r.width : r.height;
  if (t !== moving && isContainer(t)) {
    const edge = Math.min(Math.max(size * 0.2, 6), 16);
    if (pos < edge) return { parent, before: t };
    if (pos > size - edge) return { parent, before: t.nextElementSibling };
    return { parent: t, before: childBefore(t, x, y) };
  }
  return { parent, before: pos < size / 2 ? t : t.nextElementSibling };
}

function validDrop(drop) {
  if (!drop?.parent || !state.body.contains(drop.parent) || VOID.has(drop.parent.tagName)) return false;
  const m = movingEl();
  return !(m && (m === drop.parent || m.contains(drop.parent)));
}

function performDrop(drop) {
  const drag = state.drag;
  endDrag();
  if (!drag || !validDrop(drop)) return;
  const el = drag.type === 'block' ? createFromHTML(drag.html) : drag.el;
  if (drag.type === 'move' && (el === drop.parent || el.contains(drop.parent))) return;
  let before = drop.before;
  if (before === el) before = el.nextElementSibling;
  drop.parent.insertBefore(el, before);
  select(el);
  commit();
}

function createFromHTML(html) {
  const t = state.doc.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function showPlaceholder({ parent, before }) {
  const ph = $('#ph'), pp = $('#ph-parent');
  const horiz = isHorizontal(parent);
  const kids = [...parent.children].filter(c => c !== movingEl());
  const pr = parent.getBoundingClientRect();
  box(pp, pr);
  pp.style.display = parent === state.body ? 'none' : '';
  const T = 3;
  let s;
  if (before || kids.length) {
    const r = (before ?? kids.at(-1)).getBoundingClientRect();
    const edge = before ? (horiz ? r.left : r.top) : (horiz ? r.right : r.bottom);
    s = horiz
      ? { left: edge - T / 2, top: r.top, width: T, height: r.height }
      : { left: r.left, top: edge - T / 2, width: r.width, height: T };
    ph.className = 'absolute bg-emerald-500 rounded-full';
  } else {
    s = { left: pr.left + 4, top: pr.top + 4, width: pr.width - 8, height: Math.max(pr.height - 8, 8) };
    ph.className = 'absolute bg-emerald-500/20 border-2 border-emerald-500 rounded';
  }
  box(ph, s);
  ph.style.display = '';
}
function hidePlaceholder() {
  $('#ph').style.display = 'none';
  $('#ph-parent').style.display = 'none';
}
function box(node, r) {
  Object.assign(node.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
}

/* ---------- Overlay（每幀更新位置） ---------- */
const tagOf = el => el.tagName.toLowerCase();
function place(node, el) {
  if (!el || !el.isConnected) { node.style.display = 'none'; return null; }
  const r = el.getBoundingClientRect();
  box(node, r);
  node.style.display = '';
  return r;
}
function tick() {
  if (state.mode === 'design' && state.body) {
    const hov = !state.drag && state.hover !== state.selected ? state.hover : null;
    if (place($('#hover-box'), hov)) {
      const lbl = $('#hover-label'), t = tagOf(hov);
      if (lbl.textContent !== t) lbl.textContent = t;
    }
    const r = place($('#sel-box'), state.selected);
    const tb = $('#sel-toolbar');
    if (r) {
      tb.style.display = '';
      tb.style.opacity = state.drag ? '0' : '1';
      tb.style.pointerEvents = state.drag ? 'none' : '';
      const isBody = state.selected === state.body;
      $$('[data-act]', tb).forEach(b => b.style.display = isBody ? 'none' : '');
      const lbl = $('#sel-label'), t = tagOf(state.selected);
      if (lbl.textContent !== t) lbl.textContent = t;
      const ow = $('#overlay').clientWidth, w = tb.offsetWidth;
      const top = r.top >= 24 ? r.top - 24 : Math.max(r.top, 0) + 2;
      tb.style.top = top + 'px';
      tb.style.left = Math.max(0, Math.min(r.right - w, ow - w)) + 'px';
    } else tb.style.display = 'none';
  }
  requestAnimationFrame(tick);
}

$('#sel-toolbar').addEventListener('click', e => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  const el = state.selected;
  if (!el || el === state.body) return;
  if (act === 'parent') select(el.parentElement);
  if (act === 'dup') duplicate();
  if (act === 'del') removeSelected();
});
$('[data-act="drag"]').addEventListener('dragstart', e => {
  if (!state.selected || state.selected === state.body) return e.preventDefault();
  startDrag(e, { type: 'move', el: state.selected }, '<' + tagOf(state.selected) + '>');
});
frame.addEventListener('mouseleave', () => state.hover = null);

/* ---------- 拖曳共用 ---------- */
function startDrag(e, data, ghostText) {
  stopEditing();
  state.drag = data;
  state.hover = null;
  e.dataTransfer.setData('text/plain', '');
  e.dataTransfer.effectAllowed = data.type === 'move' ? 'move' : 'copy';
  const g = $('#drag-ghost');
  g.textContent = ghostText;
  e.dataTransfer.setDragImage(g, -8, -8);
}
function endDrag() {
  state.drag = null;
  state.canvasDrop = state.treeDrop = null;
  hidePlaceholder();
  clearTreeIndicator();
}
document.addEventListener('dragend', endDrag);
document.addEventListener('dragover', e => {
  if (!e.target.closest('#tree')) { hidePlaceholder(); clearTreeIndicator(); }
});

/* ---------- 元件面板 ---------- */
function renderBlocks(filter = '') {
  const f = filter.trim().toLowerCase();
  const cats = [...new Set(BLOCKS.map(b => b.cat))];
  $('#blocks').innerHTML = cats.map(cat => {
    const items = BLOCKS.map((b, i) => ({ ...b, i })).filter(b => b.cat === cat && (!f || b.label.toLowerCase().includes(f)));
    if (!items.length) return '';
    return `<div class="mt-2 mb-1.5 text-[11px] text-slate-500">${cat}</div>
      <div class="grid grid-cols-3 gap-1.5">${items.map(b => `
        <div draggable="true" data-block="${b.i}" title="拖曳到畫布，或點擊加入"
             class="aspect-square flex flex-col items-center justify-center gap-1 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 hover:border-blue-500 hover:text-white cursor-grab active:cursor-grabbing select-none">
          ${b.icon}<span class="text-[11px]">${b.label}</span>
        </div>`).join('')}</div>`;
  }).join('') || '<div class="p-4 text-center text-xs text-slate-500">找不到元件</div>';
}
$('#block-search').addEventListener('input', e => renderBlocks(e.target.value));
$('#blocks').addEventListener('dragstart', e => {
  const tile = e.target.closest('[data-block]');
  if (!tile) return;
  const b = BLOCKS[tile.dataset.block];
  startDrag(e, { type: 'block', html: b.html }, '+ ' + b.label);
});
$('#blocks').addEventListener('click', e => {
  const tile = e.target.closest('[data-block]');
  if (!tile || !state.body) return;
  const el = createFromHTML(BLOCKS[tile.dataset.block].html);
  const s = state.selected;
  if (s && isContainer(s)) s.appendChild(el);
  else if (s && s !== state.body) s.after(el);
  else state.body.appendChild(el);
  select(el);
  commit();
  el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});

/* ---------- 圖層樹 ---------- */
function nodeLabel(el) {
  if (el.id) return '#' + el.id;
  if (!el.children.length && el.textContent.trim()) return el.textContent.trim().slice(0, 28);
  if (el.tagName === 'IMG') return el.getAttribute('alt') || 'image';
  const c = el.classList[0];
  return c ? '.' + c : '';
}
function renderTree() {
  const root = $('#tree');
  const map = state.treeMap = new Map();
  let n = 0, html = '';
  const walk = (el, depth) => {
    const id = String(++n);
    map.set(id, el);
    const kids = [...el.children];
    const collapsed = state.collapsed.has(el);
    const sel = el === state.selected;
    html += `<div class="tree-row flex items-center gap-1 h-7 pr-2 rounded cursor-pointer select-none ${sel ? 'bg-blue-600/30 text-white' : 'hover:bg-slate-800'}"
      data-id="${id}" draggable="${el !== state.body}" style="padding-left:${depth * 12 + 2}px">
      <span class="caret w-4 h-4 shrink-0 inline-flex items-center justify-center text-slate-500 hover:text-white ${kids.length ? '' : 'invisible'}">${collapsed ? '▸' : '▾'}</span>
      <span class="font-mono text-sky-300 shrink-0">${tagOf(el)}</span>
      <span class="truncate text-slate-500">${esc(nodeLabel(el))}</span>
      ${kids.length && collapsed ? `<span class="ml-auto text-[10px] text-slate-600">${kids.length}</span>` : ''}
    </div>`;
    if (!collapsed) kids.forEach(k => walk(k, depth + 1));
  };
  walk(state.body, 0);
  root.innerHTML = html;
  root.querySelector('.bg-blue-600\\/30')?.scrollIntoView({ block: 'nearest' });
}
function clearTreeIndicator() {
  $$('#tree .drop-before, #tree .drop-after, #tree .drop-inside').forEach(r => r.classList.remove('drop-before', 'drop-after', 'drop-inside'));
}
const tree = $('#tree');
const rowEl = e => { const r = e.target.closest('.tree-row'); return r ? [r, state.treeMap.get(r.dataset.id)] : [null, null]; };
tree.addEventListener('click', e => {
  const [row, el] = rowEl(e);
  if (!row) return;
  if (e.target.closest('.caret')) {
    state.collapsed.has(el) ? state.collapsed.delete(el) : state.collapsed.add(el);
    renderTree();
    return;
  }
  select(el);
  if (el !== state.body) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
tree.addEventListener('mouseover', e => { if (!state.drag) state.hover = rowEl(e)[1]; });
tree.addEventListener('mouseleave', () => state.hover = null);
tree.addEventListener('dragstart', e => {
  const [row, el] = rowEl(e);
  if (!row || el === state.body) return e.preventDefault();
  startDrag(e, { type: 'move', el }, '<' + tagOf(el) + '>');
});
tree.addEventListener('dragover', e => {
  clearTreeIndicator();
  state.treeDrop = null;
  hidePlaceholder();
  const [row, el] = rowEl(e);
  if (!row || !state.drag) return;
  const r = row.getBoundingClientRect();
  const ratio = (e.clientY - r.top) / r.height;
  let pos;
  if (el === state.body) pos = 'inside';
  else if (isContainer(el)) pos = ratio < 0.25 ? 'before' : ratio > 0.75 ? 'after' : 'inside';
  else pos = ratio < 0.5 ? 'before' : 'after';
  const drop = pos === 'inside'
    ? { parent: el, before: null }
    : { parent: el.parentElement, before: pos === 'before' ? el : el.nextElementSibling };
  if (!validDrop(drop)) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = state.drag.type === 'move' ? 'move' : 'copy';
  row.classList.add('drop-' + pos);
  state.treeDrop = drop;
  if (pos === 'inside') state.collapsed.delete(el);
});
tree.addEventListener('drop', e => {
  e.preventDefault();
  performDrop(state.treeDrop);
});

/* ---------- 選取 / 編輯 ---------- */
function select(el) {
  if (state.editing && state.editing !== el) stopEditing();
  state.selected = el;
  renderTree();
  renderProps();
  renderBreadcrumb();
}
function isTextEditable(el) {
  return el !== state.body && !VOID.has(el.tagName) &&
    (TEXT_TAGS.has(el.tagName) || (!el.children.length && el.textContent.trim()));
}
function startEditing(el) {
  if (state.editing === el) return;
  stopEditing();
  state.selected = el;
  state.editing = el;
  el.setAttribute('contenteditable', 'true');
  el.focus();
  el.addEventListener('blur', stopEditing, { once: true });
  renderProps();
}
function stopEditing() {
  const el = state.editing;
  if (!el) return;
  state.editing = null;
  el.removeAttribute('contenteditable');
  commit();
  renderProps();
}
function duplicate() {
  const el = state.selected;
  if (!el || el === state.body) return;
  const c = el.cloneNode(true);
  el.after(c);
  select(c);
  commit();
}
function removeSelected() {
  const el = state.selected;
  if (!el || el === state.body) return;
  const next = el.nextElementSibling || el.previousElementSibling || el.parentElement;
  el.remove();
  state.hover = null;
  select(next === state.body ? null : next);
  commit();
}
function replaceTag(el, tag) {
  if (!/^[a-z][a-z0-9-]*$/i.test(tag) || tag.toUpperCase() === el.tagName) return renderProps();
  const n = state.doc.createElement(tag);
  for (const a of el.attributes) n.setAttribute(a.name, a.value);
  if (!VOID.has(n.tagName)) while (el.firstChild) n.appendChild(el.firstChild);
  el.replaceWith(n);
  select(n);
  commit();
}

/* ---------- 麵包屑 ---------- */
function renderBreadcrumb() {
  const bc = $('#breadcrumb');
  let el = state.selected;
  if (!el || !state.body.contains(el)) { bc.innerHTML = '<span class="text-slate-600">未選取元素</span>'; return; }
  const chain = [];
  while (el) { chain.unshift(el); if (el === state.body) break; el = el.parentElement; }
  bc._chain = chain;
  bc.innerHTML = chain.map((n, i) => `<button data-i="${i}" class="px-1.5 py-0.5 rounded font-mono hover:bg-slate-800 ${i === chain.length - 1 ? 'text-sky-300' : ''}">${tagOf(n)}${n.id ? '#' + esc(n.id) : ''}</button>`).join('<span class="text-slate-600">›</span>');
}
$('#breadcrumb').addEventListener('click', e => {
  const b = e.target.closest('[data-i]');
  if (b) select($('#breadcrumb')._chain[b.dataset.i]);
});

/* ---------- 屬性面板 ---------- */
const section = (title, body) => `<div class="border-b border-slate-800 px-3 py-3"><div class="text-[11px] font-semibold text-slate-300 mb-2">${title}</div>${body}</div>`;
const field = (label, input) => `<label class="block mb-2"><span class="lbl">${label}</span>${input}</label>`;

function toHex(v) {
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  const m = v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? '#' + m.slice(1, 4).map(n => (+n).toString(16).padStart(2, '0')).join('') : '#000000';
}

function renderProps() {
  const p = $('#props');
  const el = state.selected;
  if (!el || !el.isConnected) {
    p.innerHTML = `<div class="p-8 text-center text-xs text-slate-500 leading-relaxed">在畫布或圖層中選取元素<br>以檢視與編輯屬性</div>`;
    return;
  }
  const isBody = el === state.body;
  const tag = tagOf(el);
  let h = section('元素', `
    <div class="flex items-center gap-2 mb-3">
      <span class="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 font-mono text-xs">&lt;${tag}&gt;</span>
      <span class="text-[11px] text-slate-500">${el.children.length} 個子元素</span>
    </div>
    ${isBody ? '' : `<div class="grid grid-cols-2 gap-2">
      ${field('標籤', `<input data-k="tag" value="${tag}" class="inp font-mono">`)}
      ${field('ID', `<input data-k="id" value="${esc(el.id)}" placeholder="—" class="inp font-mono">`)}
    </div>`}`);

  if (!isBody && !VOID.has(el.tagName) && !el.children.length && (TEXT_TAGS.has(el.tagName) || el.textContent.trim())) {
    h += section('文字內容', `<textarea data-k="text" rows="3" class="inp resize-y">${esc(el.textContent)}</textarea>
      <div class="mt-1 text-[10px] text-slate-600">也可在畫布上雙擊直接編輯，Esc 結束</div>`);
  }

  const classes = [...el.classList];
  const groups = CLASS_GROUPS.map((g, gi) => {
    const cur = classes.find(c => g.re.test(c)) || '';
    const opts = cur && !g.opts.includes(cur) ? [cur, ...g.opts] : g.opts;
    return `<label class="block"><span class="lbl">${g.label}</span>
      <select data-group="${gi}" class="inp font-mono">
        <option value="">—</option>${opts.map(o => `<option ${o === cur ? 'selected' : ''}>${o}</option>`).join('')}
      </select></label>`;
  }).join('');
  h += section('Tailwind Class', `
    <div class="flex flex-wrap gap-1 mb-2">${classes.map(c => `
      <span class="inline-flex items-center gap-1 pl-1.5 pr-0.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200">${esc(c)}
        <button data-rm-class="${esc(c)}" class="w-4 h-4 rounded text-slate-500 hover:text-white hover:bg-red-500/70">×</button></span>`).join('') || '<span class="text-[11px] text-slate-600">沒有 class</span>'}
    </div>
    <input data-k="add-class" class="inp font-mono mb-3" placeholder="輸入 class 後按 Enter（可用空白分隔多個）">
    <div class="grid grid-cols-2 gap-2">${groups}</div>`);

  if (!isBody) {
    const skip = new Set(['id', 'class', 'style', 'contenteditable']);
    const names = [...new Set([...(SUGGEST_ATTRS[el.tagName] || []), ...[...el.attributes].map(a => a.name).filter(n => !skip.has(n))])];
    h += section('屬性', `
      ${names.map(n => `<div class="flex items-center gap-1.5 mb-1.5">
        <span class="w-20 shrink-0 truncate font-mono text-[11px] text-slate-400" title="${esc(n)}">${esc(n)}</span>
        <input data-attr="${esc(n)}" value="${esc(el.getAttribute(n) ?? '')}" placeholder="${el.hasAttribute(n) ? '' : '未設定'}" class="inp font-mono">
        <button data-rm-attr="${esc(n)}" class="w-6 h-6 shrink-0 rounded text-slate-500 hover:text-white hover:bg-red-500/70 ${el.hasAttribute(n) ? '' : 'invisible'}">×</button>
      </div>`).join('') || '<div class="text-[11px] text-slate-600 mb-2">沒有其他屬性</div>'}
      <div class="flex gap-1.5 mt-2">
        <input id="new-attr-name" class="inp font-mono w-24" placeholder="名稱">
        <input id="new-attr-value" class="inp font-mono" placeholder="值">
        <button data-add-attr class="px-2 shrink-0 rounded bg-slate-700 hover:bg-slate-600 text-xs">新增</button>
      </div>`);
  }

  h += section('行內樣式 (style)', `<div class="grid grid-cols-2 gap-2">${STYLE_PROPS.map(([prop, label, color]) => {
    const v = el.style.getPropertyValue(prop);
    return `<label class="block"><span class="lbl">${label} <span class="text-slate-600 font-mono">${prop}</span></span>
      <span class="flex gap-1">${color ? `<input type="color" data-style-color="${prop}" value="${toHex(v)}" class="w-7 h-[26px] shrink-0 rounded bg-transparent border border-slate-700 cursor-pointer">` : ''}
      <input data-style="${prop}" value="${esc(v)}" class="inp font-mono" placeholder="—"></span></label>`;
  }).join('')}</div>`);

  if (!isBody) {
    h += `<div class="p-3 flex gap-2">
      <button data-action="dup" class="flex-1 h-8 rounded bg-slate-800 hover:bg-slate-700 text-xs">複製元素</button>
      <button data-action="del" class="flex-1 h-8 rounded bg-red-600/80 hover:bg-red-600 text-xs text-white">刪除元素</button>
    </div>`;
  }
  p.innerHTML = h;
}

const props = $('#props');
props.addEventListener('input', e => {
  const t = e.target, el = state.selected;
  if (!el) return;
  if (t.dataset.k === 'id') t.value ? el.id = t.value : el.removeAttribute('id');
  else if (t.dataset.k === 'text') el.textContent = t.value;
  else if (t.dataset.attr) el.setAttribute(t.dataset.attr, t.value);
  else if (t.dataset.style) setStyle(el, t.dataset.style, t.value);
  else if (t.dataset.styleColor) {
    setStyle(el, t.dataset.styleColor, t.value);
    const txt = props.querySelector(`[data-style="${t.dataset.styleColor}"]`);
    if (txt) txt.value = t.value;
  }
});
props.addEventListener('change', e => {
  const t = e.target, el = state.selected;
  if (!el) return;
  if (t.dataset.k === 'tag') return replaceTag(el, t.value.trim());
  if (t.dataset.group !== undefined) {
    const g = CLASS_GROUPS[t.dataset.group];
    [...el.classList].filter(c => g.re.test(c)).forEach(c => el.classList.remove(c));
    if (t.value) el.classList.add(t.value);
    commit();
    return renderProps();
  }
  if (t.dataset.k === 'id' || t.dataset.k === 'text' || t.dataset.attr || t.dataset.style || t.dataset.styleColor) {
    if (t.dataset.style && t.value && !el.style.getPropertyValue(t.dataset.style)) toast('無效的 CSS 值');
    commit();
    if (t.dataset.attr) renderProps();
  }
});
props.addEventListener('keydown', e => {
  const t = e.target, el = state.selected;
  if (e.key !== 'Enter' || !el) return;
  if (t.dataset.k === 'add-class') {
    e.preventDefault();
    const list = t.value.split(/\s+/).filter(Boolean);
    if (!list.length) return;
    el.classList.add(...list);
    commit();
    renderProps();
    props.querySelector('[data-k="add-class"]').focus();
  } else if (t.id === 'new-attr-name' || t.id === 'new-attr-value') {
    e.preventDefault();
    addAttr();
  } else if (t.tagName === 'INPUT') t.blur();
});
props.addEventListener('click', e => {
  const t = e.target.closest('button');
  const el = state.selected;
  if (!t || !el) return;
  if (t.dataset.rmClass) { el.classList.remove(t.dataset.rmClass); if (!el.classList.length) el.removeAttribute('class'); commit(); renderProps(); }
  else if (t.dataset.rmAttr) { el.removeAttribute(t.dataset.rmAttr); commit(); renderProps(); }
  else if (t.hasAttribute('data-add-attr')) addAttr();
  else if (t.dataset.action === 'dup') duplicate();
  else if (t.dataset.action === 'del') removeSelected();
});
function addAttr() {
  const name = $('#new-attr-name').value.trim();
  const value = $('#new-attr-value').value;
  if (!/^[a-z_:][\w:.-]*$/i.test(name)) return toast('屬性名稱不合法');
  if (['class', 'style', 'contenteditable'].includes(name.toLowerCase())) return toast('請使用對應區塊編輯 ' + name);
  try { state.selected.setAttribute(name, value); } catch { return toast('屬性名稱不合法'); }
  commit();
  renderProps();
  $('#new-attr-name')?.focus();
}
function setStyle(el, prop, v) {
  el.style.setProperty(prop, v);
  if (!el.getAttribute('style')?.trim()) el.removeAttribute('style');
}

/* ---------- Code 模式 ---------- */
function attrsStr(el) {
  return [...el.attributes].filter(a => a.name !== 'contenteditable')
    .map(a => a.value === '' ? ` ${a.name}` : ` ${a.name}="${a.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`).join('');
}
function inlineHTML(n) {
  return [...n.childNodes].map(c => {
    if (c.nodeType === 3) return escText(c.textContent.replace(/\s+/g, ' '));
    if (c.nodeType !== 1) return '';
    const t = tagOf(c);
    return VOID.has(c.tagName) ? `<${t}${attrsStr(c)}>` : `<${t}${attrsStr(c)}>${inlineHTML(c)}</${t}>`;
  }).join('');
}
const isInlineTree = n => n.nodeType === 3 || (n.nodeType === 1 && INLINE.has(n.tagName) && [...n.children].every(isInlineTree));
function fmtNode(n, d) {
  const ind = '  '.repeat(d);
  if (n.nodeType === 3) { const t = n.textContent.replace(/\s+/g, ' ').trim(); return t ? ind + escText(t) : ''; }
  if (n.nodeType === 8) return `${ind}<!--${n.data}-->`;
  if (n.nodeType !== 1) return '';
  const tag = tagOf(n), open = `<${tag}${attrsStr(n)}>`;
  if (VOID.has(n.tagName)) return ind + open;
  if ([...n.childNodes].every(isInlineTree)) {
    const line = `${ind}${open}${inlineHTML(n).trim()}</${tag}>`;
    if (line.length <= 120 || !n.children.length) return line;
  }
  const kids = [...n.childNodes].map(c => fmtNode(c, d + 1)).filter(Boolean);
  return kids.length ? `${ind}${open}\n${kids.join('\n')}\n${ind}</${tag}>` : `${ind}${open}</${tag}>`;
}
const formatHTML = (root, depth = 0) => [...root.childNodes].map(c => fmtNode(c, depth)).filter(Boolean).join('\n');

let cm = null;
function initCode() {
  if (cm !== null) return;
  const host = $('#code-host');
  if (window.CodeMirror) {
    cm = CodeMirror(host, { mode: 'htmlmixed', theme: 'material-darker', lineNumbers: true, lineWrapping: true, tabSize: 2, autoCloseTags: true });
    cm.setSize('100%', '100%');
  } else {
    host.innerHTML = '<textarea class="w-full h-full p-4 bg-slate-950 text-slate-200 font-mono text-[13px] outline-none resize-none" spellcheck="false"></textarea>';
    const ta = host.firstChild;
    cm = { getValue: () => ta.value, setValue: v => ta.value = v, refresh() {}, focus: () => ta.focus() };
  }
}
function setCode(v) { initCode(); cm.setValue(v); state.codeBaseline = v; }
function applyCode() {
  const v = cm.getValue();
  if (v === state.codeBaseline) return;
  const path = pathOf(state.selected);
  state.body.innerHTML = v;
  state.selected = elAt(path);
  commit();
  renderProps();
  state.codeBaseline = v;
}
function setMode(m) {
  if (m === state.mode || !state.body) return;
  if (m === 'code') {
    stopEditing();
    setCode(formatHTML(state.body));
    $('#design-pane').classList.add('hidden');
    $('#code-pane').classList.replace('hidden', 'flex');
    cm.refresh();
    cm.focus();
  } else {
    applyCode();
    $('#code-pane').classList.replace('flex', 'hidden');
    $('#design-pane').classList.remove('hidden');
  }
  state.mode = m;
  $$('[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
}
$$('[data-mode]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
$('#btn-apply').addEventListener('click', () => { applyCode(); setCode(formatHTML(state.body)); toast('已套用'); });
$('#btn-copy').addEventListener('click', () => navigator.clipboard.writeText(cm.getValue()).then(() => toast('已複製'), () => toast('複製失敗')));

/* ---------- 工具列 ---------- */
$$('[data-device]').forEach(b => b.addEventListener('click', () => {
  $('#frame-box').style.width = b.dataset.device;
  $$('[data-device]').forEach(x => x.classList.toggle('active', x === b));
}));
$('#btn-undo').addEventListener('click', undo);
$('#btn-redo').addEventListener('click', redo);
$('#btn-clear').addEventListener('click', () => {
  if (!confirm('確定要清空畫布？（可用復原救回）')) return;
  if (state.mode === 'code') setMode('design');
  state.body.innerHTML = '';
  select(null);
  commit();
});
function pageHTML() {
  if (state.mode === 'code') applyCode();
  const cls = state.body.className ? ` class="${esc(state.body.className)}"` : '';
  return `<!doctype html>\n<html lang="zh-Hant">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>My Page</title>\n  <script src="${TAILWIND_SRC}"><\/script>\n<\/head>\n<body${cls}>\n${formatHTML(state.body, 1)}\n<\/body>\n<\/html>\n`;
}
$('#btn-export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([pageHTML()], { type: 'text/html' }));
  a.download = 'page.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('#btn-preview').addEventListener('click', () => {
  window.open(URL.createObjectURL(new Blob([pageHTML()], { type: 'text/html' })), '_blank');
});

/* ---------- 快捷鍵 ---------- */
function onKey(e) {
  if (state.editing) {
    if (e.key === 'Escape') { e.preventDefault(); state.editing.blur(); }
    return;
  }
  const t = e.target;
  if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest?.('.CodeMirror')) return;
  if (state.mode !== 'design') return;
  const mod = e.metaKey || e.ctrlKey, k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (mod && k === 'y') { e.preventDefault(); redo(); }
  else if (mod && k === 'd') { e.preventDefault(); duplicate(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') { if (state.selected) { e.preventDefault(); removeSelected(); } }
  else if (e.key === 'Escape') select(null);
  else if (e.key === 'Enter' && state.selected && isTextEditable(state.selected)) { e.preventDefault(); startEditing(state.selected); }
}
document.addEventListener('keydown', onKey);

let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.style.opacity = '0', 1600);
}

function renderAll() {
  renderTree();
  renderProps();
  renderBreadcrumb();
  updateHistoryButtons();
}
renderBlocks();
