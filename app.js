/* Bamako Move — relocation planner. Plain JS, no build step. */
(function () {
'use strict';

const APP_VERSION = '1.0.0';
const KEY = 'bamakoMovePlanner.v1';
const DEPART = '2026-12-31', KIDS_FLY = '2026-12-20', FINAL_START = '2026-12-25';
const SEED_VERSION = window.SEED_VERSION || 1;

/* ---------------- date helpers (local dates as YYYY-MM-DD) ---------------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const add = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const todayISO = () => iso(new Date());
const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const dow = s => parse(s).getDay();
const isWE = s => { const w = dow(s); return w === 0 || w === 6; };
const maxS = (...a) => a.filter(Boolean).sort().pop() || null;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOWL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const fmt = s => { const d = parse(s); return `${DOWS[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`; };
const fmtLong = s => { const d = parse(s); return `${DOWL[d.getDay()]}, ${MONL[d.getMonth()]} ${d.getDate()}`; };
function rel(s) {
  const n = diff(todayISO(), s);
  if (n === 0) return 'Today'; if (n === 1) return 'Tomorrow'; if (n === -1) return 'Yesterday';
  return fmt(s);
}
function fmtDur(m) { m = +m || 0; if (!m) return ''; if (m < 60) return m + 'm'; const h = Math.floor(m / 60), r = m % 60; return h + 'h' + (r ? ' ' + r + 'm' : ''); }
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------------- constants ---------------- */
const CATS = [
  { id: 'vehicle', name: 'Vehicle Sale', short: 'Vehicle', color: '#c2622d' },
  { id: 'freight', name: 'Shipping and Freight', short: 'Freight', color: '#2b7a8c' },
  { id: 'electronics', name: 'Computer and Electronics', short: 'Electronics', color: '#7a5cc0' },
  { id: 'market', name: 'Marketplace Sales', short: 'Marketplace', color: '#b8861b' },
  { id: 'donate', name: 'Donations and Disposal', short: 'Donations', color: '#3f8a4f' },
  { id: 'packing', name: 'Packing and Inventory', short: 'Packing', color: '#9a7b4f' },
  { id: 'apartment', name: 'Apartment and Landlord', short: 'Apartment', color: '#b2475d' },
  { id: 'phone', name: 'Phone and Internet', short: 'Phone & Internet', color: '#3a6fc4' },
  { id: 'banking', name: 'Banking and Address Changes', short: 'Banking', color: '#2f8f86' },
  { id: 'taxes', name: 'Taxes and Professional Advice', short: 'Taxes', color: '#8a5a3c' },
  { id: 'travel', name: 'Travel and Documents', short: 'Travel', color: '#5a5fc4' },
  { id: 'family', name: 'Children and Family', short: 'Family', color: '#c25a9a' },
  { id: 'hotel', name: 'Hotel and Airport', short: 'Hotel', color: '#3b8ab8' },
  { id: 'cleaning', name: 'Cleaning and Handover', short: 'Cleaning', color: '#6f8f2f' },
  { id: 'misc', name: 'Miscellaneous', short: 'Misc', color: '#7a7570' },
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
const catOf = id => CAT[id] || CAT.misc;
const PRIOS = [['critical', 'Critical'], ['high', 'High'], ['normal', 'Normal'], ['low', 'Low']];
const PRANK = { critical: 0, high: 1, normal: 2, low: 3 };
const PMAP = { C: 'critical', H: 'high', N: 'normal', L: 'low' };
const STATUSES = [['todo', 'Not started'], ['doing', 'In progress'], ['waiting', 'Waiting'], ['blocked', 'Blocked'], ['done', 'Completed']];
const STATUS = Object.fromEntries(STATUSES);
const DURS = [5, 10, 15, 20, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360];
const SALE_STATUS = ['Not listed', 'Listed', 'Offer / pending', 'Sold', 'Donated', 'Discarded'];
const DT = {
  heavy: { label: 'Child-free day', load: 'Heavy day' },
  weekend: { label: 'Child-free weekend', load: 'Moving day' },
  light: { label: 'Kids with you', load: 'Light day' },
  protected: { label: "Kids' weekend — protected", load: 'Free' },
  kidsfly: { label: 'Children fly to Mali', load: 'Light day' },
  final: { label: 'Final days — cleaning & handover', load: 'Heavy day' },
  depart: { label: 'Departure day', load: 'Travel' },
  after: { label: 'After departure', load: '' },
};

/* ---------------- state ---------------- */
let S;
const ui = { view: 'today', calMode: 'month', calCursor: null, selDay: null, weekStart: null, taskTab: 'tasks',
  f: { q: '', status: 'open', cat: '', prio: '', when: '', flag: '' }, draft: null, editId: null, edMore: false, lastDeleted: null };

function defaults() {
  return {
    v: 1, tasks: [], sales: [],
    settings: { setupDone: false,
      custody: { mode: 'alternating', anchor: '2026-11-02', anchorKids: false, handoffDow: 1, overrides: {} },
      caps: { heavy: 300, weekend: 240, light: 60 } },
    meta: { seedVersion: 0, seedIds: [], saleSeedIds: [], createdAt: new Date().toISOString(), lastExport: null },
  };
}
function merge(d) {
  const def = defaults(), ds = d.settings || {};
  return { ...def, ...d,
    tasks: Array.isArray(d.tasks) ? d.tasks : [], sales: Array.isArray(d.sales) ? d.sales : [],
    settings: { ...def.settings, ...ds, custody: { ...def.settings.custody, ...(ds.custody || {}) }, caps: { ...def.settings.caps, ...(ds.caps || {}) } },
    meta: { ...def.meta, ...(d.meta || {}) } };
}
function loadState() {
  try { const raw = localStorage.getItem(KEY); if (raw) return merge(JSON.parse(raw)); }
  catch (e) { console.error(e); alert('Saved data could not be read. Restore a backup from Settings if needed.'); }
  return defaults();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('Could not save — browser storage is full or blocked'); }
}
const byId = id => S.tasks.find(t => t.id === id);

function newTask(p = {}) {
  return { id: uid(), sid: null, title: '', desc: '', cat: 'misc', due: null, start: null, duration: 30, priority: 'normal',
    status: 'todo', notes: '', subtasks: [], deps: [], related: [], links: [], kidsOk: null, weekendOk: true, fixed: false,
    ongoing: false, repeat: '', reminder: null, reminded: false, originalDue: null, history: [], completedAt: null,
    createdAt: new Date().toISOString(), updatedAt: null, ...p };
}

/* ---------------- custody & day rules ---------------- */
const weekStartFor = (s, hd) => add(s, -((dow(s) - hd + 7) % 7));
function patternKids(s) {
  const c = S.settings.custody;
  if (c.mode !== 'alternating') return false;
  const k = Math.floor(diff(weekStartFor(c.anchor, c.handoffDow), weekStartFor(s, c.handoffDow)) / 7);
  return ((k % 2) + 2) % 2 === 0 ? !!c.anchorKids : !c.anchorKids;
}
function kidsWithMe(s) {
  if (s >= KIDS_FLY) return s === KIDS_FLY ? true : false; // custody pattern stops on Dec 20
  const o = S.settings.custody.overrides || {};
  return (s in o) ? o[s] : patternKids(s);
}
function dayType(s) {
  if (s > DEPART) return 'after';
  if (s === DEPART) return 'depart';
  if (s >= FINAL_START) return 'final';
  if (s === KIDS_FLY) return 'kidsfly';
  const k = kidsWithMe(s);
  if (k && isWE(s)) return 'protected';
  if (k) return 'light';
  return isWE(s) ? 'weekend' : 'heavy';
}
function cap(s) {
  const c = S.settings.caps;
  return { heavy: +c.heavy, weekend: +c.weekend, light: +c.light, protected: 0, kidsfly: +c.light, final: +c.heavy, depart: 60, after: 0 }[dayType(s)];
}
const isLight = t => t.kidsOk === true || (t.kidsOk == null && (+t.duration || 0) <= 30);
function suits(t, s) {
  const ty = dayType(s);
  if (ty === 'after' || ty === 'protected') return false;
  if (ty === 'depart') return ['travel', 'hotel', 'family'].includes(t.cat);
  if (ty === 'light' || ty === 'kidsfly') return isLight(t);
  if (isWE(s) && t.weekendOk === false) return false;
  return true;
}
function loadMap(exclude) {
  const m = {};
  for (const t of S.tasks) {
    if (t === exclude || t.status === 'done' || !t.due || t.ongoing) continue;
    m[t.due] = (m[t.due] || 0) + (+t.duration || 0);
  }
  return m;
}
const depDate = d => d.ongoing ? (d.start || d.due) : d.due;
function depFloor(t, prop) {
  let f = null;
  for (const id of t.deps || []) {
    const d = byId(id); if (!d || d.status === 'done') continue;
    const dd = (prop && prop[d.id]) || depDate(d);
    if (dd) f = maxS(f, dd);
  }
  return f;
}
const blockers = t => (t.deps || []).map(byId).filter(d => d && d.status !== 'done');
const dependents = t => S.tasks.filter(x => (x.deps || []).includes(t.id));

/* find the first suitable day >= from with free capacity */
function findSlot(t, from, load, prop) {
  load = load || loadMap(t);
  const lo = maxS(from, depFloor(t, prop), (!t.ongoing && t.start) ? t.start : null);
  let fallback = null;
  for (let d = lo; d <= DEPART; d = add(d, 1)) {
    if (!suits(t, d)) continue;
    if (!fallback) fallback = d;
    if ((load[d] || 0) + (+t.duration || 0) <= cap(d)) return { date: d, overloaded: false };
  }
  return fallback ? { date: fallback, overloaded: true } : null;
}
function suggestDates(t, n = 3) {
  const load = loadMap(t), out = [];
  let from = maxS(todayISO(), depFloor(t));
  while (out.length < n) {
    const r = findSlot(t, from, load); if (!r) break;
    out.push(r.date); from = add(r.date, 1);
  }
  return out;
}

/* ---------------- seeding (never overwrites user data) ---------------- */
function placeSeed(t, win, load) {
  const [a, b] = win;
  if (!a) { t.due = null; return; }
  if (t.ongoing) { t.start = a; t.due = b; t.originalDue = b; return; }
  if (t.fixed) { t.due = a; t.originalDue = a; load[a] = (load[a] || 0) + t.duration; return; }
  const lo = maxS(a, depFloor(t));
  const range = b > a;
  const hi = range ? maxS(b, lo) : add(lo, 6);
  let best = null, bs = Infinity, i = 0;
  for (let d = lo; d <= hi && d <= DEPART; d = add(d, 1), i++) {
    if (!suits(t, d)) continue;
    const l = load[d] || 0;
    if (l + t.duration > cap(d)) continue;
    if (!range) { best = d; break; }
    const sc = l + i * 12; // prefer lighter days, then earlier days
    if (sc < bs) { bs = sc; best = d; }
  }
  if (!best) { const r = findSlot(t, lo, load); best = r ? r.date : lo; }
  t.due = best; t.originalDue = best;
  load[best] = (load[best] || 0) + t.duration;
}
function applySeeds() {
  if ((S.meta.seedVersion || 0) >= SEED_VERSION) return 0;
  const known = new Set(S.meta.seedIds || []);
  const rows = (window.SEED_TASKS || []).filter(r => !known.has(r[0]));
  const created = [];
  for (const [sid, cat, win, title, dur, p, o = {}] of rows) {
    const t = newTask({ sid, cat, title, duration: dur, priority: PMAP[p] || 'normal', desc: o.desc || '',
      subtasks: (o.sub || []).map(x => ({ id: uid(), text: x, done: false })),
      kidsOk: o.k === 1 ? true : o.k === 0 ? false : null, weekendOk: o.w === 0 ? false : true,
      fixed: !!o.f, ongoing: !!o.o });
    t._deps = o.d || []; t._win = win ? win.split('..').map(x => '2026-' + x) : [null, null];
    if (t._win.length === 1) t._win.push(t._win[0]);
    S.tasks.push(t); created.push(t);
  }
  for (const t of created) {
    t.deps = t._deps.map(sid => (S.tasks.find(x => x.sid === sid) || {}).id).filter(Boolean);
  }
  const load = loadMap();
  const order = created.map((t, i) => [t, i]).sort((x, y) => (x[0]._win[0] || '9').localeCompare(y[0]._win[0] || '9') || x[1] - y[1]);
  for (const [t] of order) { placeSeed(t, t._win, load); }
  for (const t of created) { delete t._deps; delete t._win; }
  for (const r of window.SEED_TASKS || []) known.add(r[0]);
  S.meta.seedIds = [...known];
  const ks = new Set(S.meta.saleSeedIds || []);
  for (const [id, name, ask, min] of window.SEED_SALES || []) {
    if (ks.has(id)) continue;
    S.sales.push(newSale({ sid: id, name, ask, min })); ks.add(id);
  }
  S.meta.saleSeedIds = [...ks];
  S.meta.seedVersion = SEED_VERSION;
  save();
  return created.length;
}
function newSale(p = {}) {
  return { id: uid(), sid: null, name: '', listed: null, ask: null, min: null, status: 'Not listed', buyer: '', pickup: null, paid: false, final: null, outcome: '', notes: '', ...p };
}

/* ---------------- task state helpers ---------------- */
const isOverdue = t => t.status !== 'done' && t.due && t.due < todayISO();
const sortTasks = (a, b) => ((a.status === 'done') - (b.status === 'done')) || (a.due || '9').localeCompare(b.due || '9') || PRANK[a.priority] - PRANK[b.priority];
const byPrio = (a, b) => PRANK[a.priority] - PRANK[b.priority] || (a.due || '9').localeCompare(b.due || '9');

function nextRepeat(t) {
  if (!t.due) return null;
  let n = t.due;
  if (t.repeat === 'daily') n = add(n, 1);
  else if (t.repeat === 'weekly') n = add(n, 7);
  else if (t.repeat === 'weekdays') { do { n = add(n, 1); } while (isWE(n)); }
  else return null;
  return n <= DEPART ? n : null;
}
function setDone(t, done) {
  if (done) {
    t.status = 'done'; t.completedAt = new Date().toISOString();
    if (t.repeat && !t.spawned) {
      const nx = nextRepeat(t);
      if (nx) {
        const c = clone(t);
        S.tasks.push(Object.assign(c, { id: uid(), sid: null, due: nx, originalDue: nx, status: 'todo', completedAt: null, history: [], spawned: false, reminded: false,
          subtasks: c.subtasks.map(s => ({ ...s, id: uid(), done: false })), createdAt: new Date().toISOString() }));
        t.spawned = true;
      }
    }
  } else { t.status = 'todo'; t.completedAt = null; }
  t.updatedAt = new Date().toISOString();
}
function moveTask(t, to, reason) {
  if (t.due === to) return;
  t.history = [...(t.history || []), { from: t.due, to, at: new Date().toISOString(), reason: reason || 'Moved' }];
  if (!t.originalDue) t.originalDue = t.due || to;
  t.due = to;
  if (t.ongoing && t.start && to && t.start > to) t.start = to;
  t.updatedAt = new Date().toISOString();
}

/* ---------------- rendering: shared pieces ---------------- */
function prioBadge(t) {
  if (t.priority === 'critical') return '<span class="badge crit">Critical</span>';
  if (t.priority === 'high') return '<span class="badge high">High</span>';
  return '';
}
function card(t, opt = {}) {
  const c = catOf(t.cat), od = isOverdue(t), done = t.status === 'done';
  const subs = t.subtasks?.length ? `<span>☑ ${t.subtasks.filter(s => s.done).length}/${t.subtasks.length}</span>` : '';
  let date = '';
  if (opt.showDate !== false) {
    if (!t.due) date = '<span>No date</span>';
    else if (t.ongoing) date = `<span>${fmt(t.start || t.due)} → ${fmt(t.due)}</span>`;
    else date = `<span class="${od ? 'od' : ''}">${od ? 'Was due ' + fmt(t.due) : rel(t.due)}</span>`;
  }
  const st = (t.status === 'waiting' || t.status === 'blocked' || t.status === 'doing') ? `<span class="badge st">${STATUS[t.status]}</span>` : '';
  const bl = !done && t.due && t.due <= todayISO() && blockers(t).length ? '<span class="badge st" title="Has unfinished prerequisites">⛓ waiting on prerequisite</span>' : '';
  const conflict = !done && t.due && !t.ongoing && !t.fixed && t.due >= todayISO() && !suits(t, t.due) ? '<span class="badge warn">Doesn’t fit this day</span>' : '';
  return `<div class="card ${done ? 'done' : ''} ${od ? 'overdue' : ''}" data-id="${t.id}" style="--c:${c.color}">
    <button class="check" data-act="toggle" aria-label="${done ? 'Mark not done' : 'Mark complete'}" aria-pressed="${done}">${done ? '✓' : ''}</button>
    <div class="cbody" data-act="open" role="button" tabindex="0">
      <div class="ctitle">${esc(t.title)}</div>
      <div class="cmeta"><span class="cat"><i></i>${c.short}</span>${date}${t.duration ? `<span>${fmtDur(t.duration)}</span>` : ''}${subs}${prioBadge(t)}${st}${bl}${conflict}</div>
    </div>
    ${od ? '<button class="mini" data-act="resched1">Reschedule</button>' : ''}
  </div>`;
}
const list = (ts, opt) => ts.length ? `<div class="list">${ts.map(t => card(t, opt)).join('')}</div>` : '';
function dayBadge(s) {
  const ty = dayType(s);
  return `<span class="daytype dt-${ty}">${DT[ty].label}</span>`;
}
function progressPct() {
  const all = S.tasks.filter(t => !(t.fixed && !t.duration));
  const done = all.filter(t => t.status === 'done').length;
  return { pct: all.length ? Math.round(done / all.length * 100) : 0, done, total: all.length };
}

/* ---------------- views ---------------- */
function vToday() {
  const td = todayISO(), ty = dayType(td), load = loadMap()[td] || 0;
  const overdue = S.tasks.filter(isOverdue).sort(byPrio);
  const due = S.tasks.filter(t => t.due === td && !t.ongoing).sort(sortTasks);
  const ongoing = S.tasks.filter(t => t.ongoing && t.status !== 'done' && (t.start || t.due) <= td && t.due >= td).sort(byPrio);
  const next = S.tasks.filter(t => !t.ongoing && t.due > td && t.due <= add(td, 7) && t.status !== 'done').sort(sortTasks);
  const P = progressPct();
  const dDep = diff(td, DEPART), dKids = diff(td, KIDS_FLY);
  const loadTxt = ty === 'protected' ? 'Keep today free.' : `${DT[ty].load}${load ? ' · ' + fmtDur(load) + ' planned' : ''}`;
  const lastB = S.meta.lastExport ? diff(S.meta.lastExport.slice(0, 10), td) : diff(S.meta.createdAt.slice(0, 10), td);
  let groups = '';
  let cur = null;
  for (const t of next) {
    if (t.due !== cur) { cur = t.due; groups += `<div class="dayhead"><b>${rel(t.due)}</b>${dayBadge(t.due)}</div>`; }
    groups += card(t, { showDate: false });
  }
  return `
  <header class="today-head">
    <div class="date">${fmtLong(td)}</div>
    <div class="dayline">${dayBadge(td)}<span class="muted">${loadTxt}</span></div>
  </header>
  <section class="stats">
    <div class="stat"><b>${dDep > 0 ? dDep : dDep === 0 ? 'Today' : '—'}</b><span>${dDep > 0 ? 'days to departure' : dDep === 0 ? 'Departure ✈' : 'Departed'}<br><small>Dec 31</small></span></div>
    <div class="stat"><b>${dKids > 0 ? dKids : dKids === 0 ? 'Today' : '✓'}</b><span>${dKids > 0 ? 'days until kids fly' : dKids === 0 ? 'Kids fly' : 'Kids in Mali'}<br><small>Dec 20</small></span></div>
    <a class="stat" href="#progress"><b>${P.pct}%</b><span>move complete<br><small>${P.done}/${P.total} tasks</small></span></a>
  </section>
  ${lastB >= 7 && S.tasks.length ? `<div class="notice"><span>No backup in ${lastB} days.</span><button class="mini" data-act="export">Back up now</button></div>` : ''}
  ${overdue.length ? `<section><div class="sechead od"><h2>Overdue <span class="count">${overdue.length}</span></h2><button class="mini" data-act="wizard">Reschedule unfinished</button></div>${list(overdue)}</section>` : ''}
  <section><div class="sechead"><h2>Today</h2><button class="mini ghost" data-act="add-on" data-date="${td}">+ Add</button></div>
    ${due.length ? list(due, { showDate: false }) : `<p class="empty">${ty === 'protected' ? 'Nothing scheduled — it’s a kids’ weekend. Enjoy it.' : 'Nothing due today.'}</p>`}
  </section>
  ${ongoing.length ? `<section><details class="ongoing"><summary><h2>In progress this period <span class="count">${ongoing.length}</span></h2></summary>${list(ongoing)}</details></section>` : ''}
  <section><div class="sechead"><h2>Next 7 days</h2><a class="mini ghost" href="#calendar">Calendar</a></div>
    ${next.length ? `<div class="list">${groups}</div>` : '<p class="empty">Nothing scheduled in the next 7 days.</p>'}
  </section>`;
}

function monthGrid(monthISO, cellFn) {
  const first = parse(monthISO.slice(0, 7) + '-01');
  const startISO = add(iso(first), -((first.getDay() + 6) % 7));
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const endISO = add(iso(last), (7 - last.getDay()) % 7);
  let h = '<div class="mgrid">' + ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="wd">${d}</div>`).join('');
  for (let d = startISO; d <= endISO; d = add(d, 1)) h += cellFn(d, d.slice(5, 7) === monthISO.slice(5, 7));
  return h + '</div>';
}
function dayPanel(s) {
  const ts = S.tasks.filter(t => t.due === s && !t.ongoing).sort(sortTasks);
  const og = S.tasks.filter(t => t.ongoing && t.status !== 'done' && (t.start || t.due) <= s && t.due >= s);
  const load = loadMap()[s] || 0;
  return `<section class="daypanel">
    <div class="sechead"><h2>${fmtLong(s)}</h2><button class="mini ghost" data-act="add-on" data-date="${s}">+ Add</button></div>
    <div class="dayline">${dayBadge(s)}<span class="muted">${fmtDur(load) || '0m'} planned of ${fmtDur(cap(s)) || '0m'}</span></div>
    ${ts.length ? list(ts, { showDate: false }) : '<p class="empty">No tasks on this day.</p>'}
    ${og.length ? `<details class="ongoing"><summary><h3>Ongoing during this day <span class="count">${og.length}</span></h3></summary>${list(og)}</details>` : ''}
  </section>`;
}
function vCalendar() {
  const td = todayISO();
  ui.calCursor = ui.calCursor || td.slice(0, 7) + '-01';
  ui.selDay = ui.selDay || td;
  ui.weekStart = ui.weekStart || weekStartFor(td, 1);
  const tabs = `<div class="segtabs" role="tablist">${[['month', 'Month'], ['week', 'Week'], ['agenda', 'Agenda']].map(([k, l]) => `<button role="tab" aria-selected="${ui.calMode === k}" data-act="calmode" data-mode="${k}">${l}</button>`).join('')}</div>`;
  const legend = `<div class="legend"><span><i class="lg kids"></i>Kids with you (light)</span><span><i class="lg prot"></i>Kids' weekend (free)</span><span><i class="lg od"></i>Overdue</span></div>`;
  if (ui.calMode === 'month') {
    const m = parse(ui.calCursor);
    const grid = monthGrid(ui.calCursor, (d, inMonth) => {
      const ts = S.tasks.filter(t => t.due === d && !t.ongoing);
      const open = ts.filter(t => t.status !== 'done');
      const cats = [...new Set(open.map(t => t.cat))].slice(0, 4);
      const od = open.some(isOverdue);
      const allDone = ts.length && !open.length;
      const ty = dayType(d);
      const mark = d === KIDS_FLY ? '<em class="mk">kids ✈</em>' : d === DEPART ? '<em class="mk">✈</em>' : '';
      return `<button class="cell dt-${ty} ${inMonth ? '' : 'out'} ${d === td ? 'today' : ''} ${d === ui.selDay ? 'sel' : ''} ${od ? 'hasod' : ''}" data-act="calday" data-date="${d}" aria-label="${fmtLong(d)}, ${open.length} open tasks">
        <span class="num">${parse(d).getDate()}</span>${mark}
        <span class="dots">${cats.map(c => `<i style="background:${catOf(c).color}"></i>`).join('')}${allDone ? '<b class="ok">✓</b>' : ''}</span>
        ${open.length ? `<span class="n">${open.length}</span>` : ''}
      </button>`;
    });
    return `${tabs}<div class="calnav"><button class="iconbtn" data-act="calprev" aria-label="Previous month">‹</button><h2>${MONL[m.getMonth()]} ${m.getFullYear()}</h2><button class="iconbtn" data-act="calnext" aria-label="Next month">›</button><button class="mini ghost" data-act="caltoday">Today</button></div>${grid}${legend}${dayPanel(ui.selDay)}`;
  }
  if (ui.calMode === 'week') {
    const ws = ui.weekStart;
    let h = '';
    for (let i = 0; i < 7; i++) {
      const d = add(ws, i);
      const ts = S.tasks.filter(t => t.due === d && !t.ongoing).sort(sortTasks);
      const load = loadMap()[d] || 0;
      h += `<div class="weekday ${d === td ? 'is-today' : ''}"><div class="dayhead"><b>${fmt(d)}</b>${dayBadge(d)}<span class="muted">${fmtDur(load)}</span><button class="mini ghost" data-act="add-on" data-date="${d}" aria-label="Add task on ${fmt(d)}">+</button></div>${ts.length ? list(ts, { showDate: false }) : '<p class="empty sm">—</p>'}</div>`;
    }
    return `${tabs}<div class="calnav"><button class="iconbtn" data-act="wkprev" aria-label="Previous week">‹</button><h2>${fmt(ws)} – ${fmt(add(ws, 6))}</h2><button class="iconbtn" data-act="wknext" aria-label="Next week">›</button><button class="mini ghost" data-act="wktoday">Today</button></div>${h}`;
  }
  // agenda
  const od = S.tasks.filter(isOverdue).sort(byPrio);
  const fut = S.tasks.filter(t => !t.ongoing && t.due && t.due >= td).sort(sortTasks);
  let h = '', cur = null;
  for (const t of fut) {
    if (t.due !== cur) { cur = t.due; h += `<div class="dayhead ${t.due === td ? 'is-today' : ''}"><b>${rel(t.due)}</b>${dayBadge(t.due)}</div>`; }
    h += card(t, { showDate: false });
  }
  return `${tabs}${od.length ? `<section><div class="sechead od"><h2>Overdue <span class="count">${od.length}</span></h2><button class="mini" data-act="wizard">Reschedule</button></div>${list(od)}</section>` : ''}<section><div class="list">${h || '<p class="empty">No upcoming tasks.</p>'}</div></section>`;
}

function filteredTasks() {
  const f = ui.f, td = todayISO(), q = f.q.trim().toLowerCase();
  return S.tasks.filter(t => {
    if (q && !(t.title + ' ' + t.desc + ' ' + t.notes + ' ' + (t.subtasks || []).map(s => s.text).join(' ')).toLowerCase().includes(q)) return false;
    if (f.status === 'open' && t.status === 'done') return false;
    if (f.status && f.status !== 'open' && t.status !== f.status) return false;
    if (f.cat && t.cat !== f.cat) return false;
    if (f.prio && t.priority !== f.prio) return false;
    if (f.flag === 'overdue' && !isOverdue(t)) return false;
    if (f.flag === 'waiting' && !(t.status === 'waiting' || t.status === 'blocked')) return false;
    if (f.flag === 'completed' && t.status !== 'done') return false;
    if (f.when) {
      if (!t.due) return false;
      if (f.when === 'today' && t.due !== td) return false;
      if (f.when === 'week' && (t.due < td || t.due > add(td, 7))) return false;
      if (f.when === '14' && (t.due < td || t.due > add(td, 14))) return false;
      if (f.when === 'nov' && !t.due.startsWith('2026-11')) return false;
      if (f.when === 'dec' && !t.due.startsWith('2026-12')) return false;
    }
    return t.due || q || f.flag; // unscheduled live in their own tab unless searching
  }).sort((a, b) => (isOverdue(b) - isOverdue(a)) || sortTasks(a, b));
}
function taskListHTML() {
  const ts = filteredTasks();
  if (!ts.length) return '<p class="empty">No tasks match.</p>';
  let h = '', cur = '§';
  for (const t of ts) {
    const g = isOverdue(t) ? 'Overdue' : t.due ? MONL[parse(t.due).getMonth()] + ' — week of ' + fmt(weekStartFor(t.due, 1)) : 'No date';
    if (g !== cur) { cur = g; h += `<div class="grouphead">${g}</div>`; }
    h += card(t);
  }
  return `<div class="list">${h}</div><p class="muted center sm">${ts.length} task${ts.length === 1 ? '' : 's'}</p>`;
}
function vTasks() {
  const unsched = S.tasks.filter(t => !t.due && t.status !== 'done');
  const tabs = `<div class="segtabs">${[['tasks', 'Tasks'], ['ideas', `Unscheduled${unsched.length ? ' (' + unsched.length + ')' : ''}`], ['sales', 'Sale items']].map(([k, l]) => `<button aria-selected="${ui.taskTab === k}" data-act="tasktab" data-tab="${k}">${l}</button>`).join('')}</div>`;
  if (ui.taskTab === 'ideas') {
    return `${tabs}<p class="muted">Ideas and tasks without a date. Nothing here is scheduled until you pick a date.</p>
      ${unsched.length ? `<div class="list">${unsched.sort(byPrio).map(t => card(t, { showDate: false }) + `<div class="suggest" id="sg-${t.id}"><button class="mini ghost" data-act="suggest" data-id="${t.id}">Suggest dates</button></div>`).join('')}</div>` : '<p class="empty">No unscheduled tasks.</p>'}
      <button class="btn wide" data-act="add-on" data-date="">+ Add an idea</button>`;
  }
  if (ui.taskTab === 'sales') return tabs + salesHTML();
  const f = ui.f, sel = (name, opts, v) => `<select data-filter="${name}" aria-label="${name}">${opts.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  return `${tabs}
  <div class="search"><input type="search" id="q" placeholder="Search tasks, notes, checklists" value="${esc(f.q)}" autocomplete="off"></div>
  <div class="filters">
    ${sel('status', [['open', 'Open'], ['', 'All statuses'], ...STATUSES], f.status)}
    ${sel('cat', [['', 'All categories'], ...CATS.map(c => [c.id, c.name])], f.cat)}
    ${sel('prio', [['', 'Any priority'], ...PRIOS], f.prio)}
    ${sel('when', [['', 'Any date'], ['today', 'Today'], ['week', 'Next 7 days'], ['14', 'Next 14 days'], ['nov', 'November'], ['dec', 'December']], f.when)}
  </div>
  <div class="chips">${[['overdue', 'Overdue'], ['waiting', 'Waiting / blocked'], ['completed', 'Completed']].map(([k, l]) => `<button class="chip" aria-pressed="${f.flag === k}" data-act="flag" data-flag="${k}">${l}</button>`).join('')}</div>
  <div id="tasklist">${taskListHTML()}</div>`;
}
function salesHTML() {
  const sold = S.sales.filter(s => s.status === 'Sold');
  const total = sold.reduce((a, s) => a + (+s.final || 0), 0);
  return `<p class="muted">${sold.length}/${S.sales.length} sold${total ? ' · $' + total.toLocaleString() + ' received' : ''}</p>
  <div class="list">${S.sales.map(s => `<button class="sale" data-act="sale" data-id="${s.id}">
    <span class="sname">${esc(s.name) || 'Untitled item'}</span>
    <span class="cmeta"><span class="badge ${s.status === 'Sold' ? 'okb' : s.status === 'Not listed' ? '' : 'st'}">${s.status}</span>${s.ask ? `<span>Ask $${esc(s.ask)}</span>` : ''}${s.min ? `<span>Min $${esc(s.min)}</span>` : ''}${s.pickup ? `<span>Pickup ${fmt(s.pickup)}</span>` : ''}${s.paid ? '<span>Paid ✓</span>' : ''}</span>
  </button>`).join('')}</div>
  <button class="btn wide" data-act="sale" data-id="">+ Add sale item</button>`;
}

function milestoneState(m) {
  const ts = m[2].map(sid => S.tasks.find(t => t.sid === sid)).filter(Boolean);
  if (!ts.length) return { done: false, missing: true, tasks: [] };
  const open = ts.filter(t => t.status !== 'done');
  const due = open.map(t => t.due).filter(Boolean).sort()[0] || null;
  return { done: !open.length, due, overdue: !!(due && due < todayISO()), tasks: ts };
}
function vProgress() {
  const td = todayISO(), P = progressPct();
  const ms = (window.MILESTONES || []).map(m => ({ m, s: milestoneState(m) }));
  const mDone = ms.filter(x => x.s.done).length, behind = ms.some(x => x.s.overdue);
  const state = mDone === ms.length ? ['ready', 'Ready to fly'] : behind ? ['behind', 'Behind on a milestone'] : ['track', 'On track'];
  const overdue = S.tasks.filter(isOverdue).sort(byPrio);
  const crit = S.tasks.filter(t => t.priority === 'critical' && t.status !== 'done' && t.due && t.due >= td && t.due <= add(td, 14)).sort(sortTasks);
  const waiting = S.tasks.filter(t => (t.status === 'waiting' || t.status === 'blocked')).sort(sortTasks);
  const nodate = S.tasks.filter(t => !t.due && t.status !== 'done');
  const completed = S.tasks.filter(t => t.status === 'done').sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
  const cats = CATS.map(c => { const ts = S.tasks.filter(t => t.cat === c.id); return { c, n: ts.length, d: ts.filter(t => t.status === 'done').length }; }).filter(x => x.n);
  // weekly timeline
  let tl = '';
  for (let w = weekStartFor('2026-11-01', 1); w <= DEPART; w = add(w, 7)) {
    const e = add(w, 6), ts = S.tasks.filter(t => !t.ongoing && t.due && t.due >= w && t.due <= e);
    const d = ts.filter(t => t.status === 'done').length;
    const kd = [...Array(7)].map((_, i) => add(w, i)).filter(x => x < KIDS_FLY && kidsWithMe(x)).length;
    const isNow = td >= w && td <= e;
    const odw = ts.some(isOverdue);
    tl += `<div class="tlrow ${isNow ? 'now' : ''}"><span class="tll">${MON[parse(w).getMonth()]} ${parse(w).getDate()}–${parse(e).getDate()}</span>
      <span class="bar"><i style="width:${ts.length ? d / ts.length * 100 : 0}%"></i></span>
      <span class="tlr">${d}/${ts.length}${kd ? ` · <span class="kidsT">kids ${kd}d</span>` : ''}${odw ? ' · <span class="od">overdue</span>' : ''}</span></div>`;
  }
  return `<h1 class="pagetitle">Progress</h1>
  <section class="ready ready-${state[0]}">
    <div class="readytop"><div><div class="big">${mDone}/${ms.length}</div><div>milestones</div></div><div class="readylabel">${state[1]}</div></div>
    <div class="segbar">${ms.map(x => `<i class="${x.s.done ? 'on' : x.s.overdue ? 'late' : ''}"></i>`).join('')}</div>
    <ul class="mlist">${ms.map(({ m, s }) => `<li class="${s.done ? 'on' : s.overdue ? 'late' : ''}"><span class="mi">${s.done ? '✓' : s.overdue ? '!' : '○'}</span><span>${esc(m[1])}${s.missing ? ' <small class="muted">(milestone tasks deleted)</small>' : ''}</span><small>${s.done ? 'Done' : s.due ? (s.overdue ? 'Overdue · ' : '') + fmt(s.due) : ''}</small></li>`).join('')}</ul>
    <p class="sm muted">Readiness only counts these milestones — not the number of small tasks done.</p>
  </section>
  <section class="overall"><div class="sechead"><h2>All tasks</h2><b>${P.pct}%</b></div><div class="bar lg"><i style="width:${P.pct}%"></i></div><p class="muted sm">${P.done} of ${P.total} complete</p></section>
  <section><h2>By category</h2><div class="catbars">${cats.map(x => `<div class="cbrow"><span><i style="background:${x.c.color}"></i>${x.c.name}</span><span class="bar"><i style="width:${x.d / x.n * 100}%;background:${x.c.color}"></i></span><small>${x.d}/${x.n}</small></div>`).join('')}</div></section>
  <section><h2>Timeline to Dec 31</h2><div class="timeline">${tl}</div></section>
  ${overdue.length ? `<section><div class="sechead od"><h2>Overdue <span class="count">${overdue.length}</span></h2><button class="mini" data-act="wizard">Reschedule</button></div>${list(overdue)}</section>` : ''}
  <section><h2>Critical — next 14 days <span class="count">${crit.length}</span></h2>${list(crit) || '<p class="empty">None.</p>'}</section>
  <section><h2>Waiting on someone <span class="count">${waiting.length}</span></h2>${list(waiting) || '<p class="empty">Set a task’s status to Waiting or Blocked to see it here.</p>'}</section>
  <section><div class="sechead"><h2>Without a date <span class="count">${nodate.length}</span></h2><button class="mini ghost" data-act="goideas">Open</button></div></section>
  <section><details><summary><h2>Completed <span class="count">${completed.length}</span></h2></summary>${list(completed)}</details></section>`;
}

function custodyMonth(m) {
  return monthGrid(m, (d, inMonth) => {
    if (!inMonth) return '<span class="ccell out"></span>';
    const after = d > KIDS_FLY || (d === KIDS_FLY);
    const k = !after && kidsWithMe(d);
    const ov = (S.settings.custody.overrides || {})[d] !== undefined;
    return `<button class="ccell ${k ? 'kids' : ''} ${after ? 'after' : ''} ${ov ? 'ov' : ''} ${isWE(d) ? 'we' : ''}" ${after ? 'disabled' : ''} data-act="custday" data-date="${d}" aria-label="${fmt(d)}: ${k ? 'kids with me' : 'child-free'}">${parse(d).getDate()}</button>`;
  });
}
function vSettings() {
  const c = S.settings.custody, caps = S.settings.caps;
  const nOv = Object.keys(c.overrides || {}).length;
  const conflicts = conflictCount();
  const lb = S.meta.lastExport ? fmt(S.meta.lastExport.slice(0, 10)) : 'never';
  const notif = 'Notification' in window ? Notification.permission : 'unsupported';
  return `<h1 class="pagetitle">Settings</h1>
  <section class="panel">
    <h2>Custody schedule</h2>
    <p class="muted sm">Until Dec 20. Purple days = kids with you (light tasks only; weekends kept free). Tap any day to switch it.</p>
    <div class="row2">
      <label class="fld"><span>Pattern</span><select data-set="mode"><option value="alternating" ${c.mode === 'alternating' ? 'selected' : ''}>Alternating weeks</option><option value="custom" ${c.mode === 'custom' ? 'selected' : ''}>Custom (tap days)</option></select></label>
      <label class="fld"><span>Handoff day</span><select data-set="handoffDow" ${c.mode !== 'alternating' ? 'disabled' : ''}>${DOWL.map((d, i) => `<option value="${i}" ${+c.handoffDow === i ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
    </div>
    <label class="toggle"><input type="checkbox" data-set="anchorKids" ${c.anchorKids ? 'checked' : ''} ${c.mode !== 'alternating' ? 'disabled' : ''}><span>Kids are with me on Monday, Nov 2</span></label>
    <div class="custcal"><h3>November</h3>${custodyMonth('2026-11-01')}<h3>December</h3>${custodyMonth('2026-12-01')}</div>
    <div class="rowbtns">${nOv ? `<button class="mini ghost" data-act="custreset">Clear ${nOv} manual change${nOv > 1 ? 's' : ''}</button>` : ''}${conflicts ? `<button class="mini" data-act="wizard">Fix ${conflicts} task${conflicts > 1 ? 's' : ''} that no longer fit</button>` : ''}</div>
  </section>
  <section class="panel">
    <h2>Daily workload limits</h2>
    <p class="muted sm">Used when suggesting dates. Minutes of planned work per day.</p>
    <div class="row3">
      <label class="fld"><span>Child-free weekday</span><input type="number" inputmode="numeric" min="0" step="15" data-cap="heavy" value="${caps.heavy}"></label>
      <label class="fld"><span>Child-free weekend</span><input type="number" inputmode="numeric" min="0" step="15" data-cap="weekend" value="${caps.weekend}"></label>
      <label class="fld"><span>Kids' weekday</span><input type="number" inputmode="numeric" min="0" step="15" data-cap="light" value="${caps.light}"></label>
    </div>
  </section>
  <section class="panel">
    <h2>Backup & data</h2>
    <p class="muted sm">Your plan is stored only in this browser on this device. Last backup: <b>${lb}</b>.</p>
    <div class="rowbtns">
      <button class="btn" data-act="export">Download backup (.json)</button>
      <button class="btn ghost" data-act="import">Restore from backup</button>
      <input type="file" id="importFile" accept="application/json,.json" hidden>
    </div>
    <div class="rowbtns"><button class="btn danger ghost" data-act="clear">Clear all data…</button></div>
  </section>
  <section class="panel">
    <h2>Reminders</h2>
    <p class="muted sm">Reminders show while the app is open (there is no server to push them when it’s closed).</p>
    ${notif === 'default' ? '<button class="btn ghost" data-act="notif">Allow notifications</button>' : `<p class="sm">Notifications: <b>${notif}</b></p>`}
  </section>
  <section class="panel sm muted">
    <p>App ${APP_VERSION} · Plan data v${S.meta.seedVersion} · ${S.tasks.length} tasks</p>
    <p>Departure Dec 31, 2026 · Children fly Dec 20, 2026</p>
  </section>`;
}
function conflictCount() {
  const td = todayISO();
  return S.tasks.filter(t => t.status !== 'done' && t.due && t.due >= td && !t.ongoing && !t.fixed && !suits(t, t.due)).length;
}

/* ---------------- render root ---------------- */
function render() {
  const fn = { today: vToday, calendar: vCalendar, tasks: vTasks, progress: vProgress, settings: vSettings }[ui.view] || vToday;
  const m = $('#main'), y = window.scrollY;
  m.innerHTML = fn();
  $$('#nav [data-nav]').forEach(b => b.setAttribute('aria-current', b.dataset.nav === ui.view ? 'page' : 'false'));
  if (ui.keepScroll) { window.scrollTo(0, y); ui.keepScroll = false; }
}
function rerender() { ui.keepScroll = true; render(); }

/* ---------------- sheets ---------------- */
function openSheet(title, body, foot = '', cls = '') {
  $('#sheet-root').innerHTML = `<div class="backdrop" data-act="sheetclose"></div>
  <div class="sheet ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheethead"><h2>${esc(title)}</h2><button class="iconbtn" data-act="sheetclose" aria-label="Close">✕</button></div>
    <div class="sheetbody">${body}</div>${foot ? `<div class="sheetfoot">${foot}</div>` : ''}</div>`;
  document.body.classList.add('noscroll');
  const f = $('#sheet-root [autofocus]'); if (f) setTimeout(() => f.focus(), 50);
}
function closeSheet() { $('#sheet-root').innerHTML = ''; document.body.classList.remove('noscroll'); ui.draft = null; ui.editId = null; ui.edMore = false; }

/* --- task editor --- */
function catOptions(sel) { return CATS.map(c => `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${c.name}</option>`).join(''); }
function taskOptions(exclude) {
  return CATS.map(c => {
    const ts = S.tasks.filter(t => t.cat === c.id && !exclude.includes(t.id)).sort(sortTasks);
    return ts.length ? `<optgroup label="${c.name}">${ts.map(t => `<option value="${t.id}">${esc(t.title)}${t.due ? ' · ' + fmt(t.due) : ''}</option>`).join('')}</optgroup>` : '';
  }).join('');
}
function linkedList(ids, kind) {
  return ids.map(byId).filter(Boolean).map(t => `<div class="linked"><button class="lk" data-act="jump" data-id="${t.id}"><span class="st-${t.status}">${t.status === 'done' ? '✓' : '○'}</span>${esc(t.title)}<small>${t.due ? fmt(t.due) : 'no date'}</small></button>${kind ? `<button class="iconbtn sm" data-act="${kind}" data-id="${t.id}" aria-label="Remove">✕</button>` : ''}</div>`).join('');
}
function editorHTML() {
  const d = ui.draft, isNew = !ui.editId, more = !isNew || ui.edMore;
  const head = isNew ? '' : `<div class="quick">
      <button class="btn ${d.status === 'done' ? 'ghost' : 'okbtn'}" data-act="ed-done">${d.status === 'done' ? 'Mark not done' : '✓ Complete'}</button>
      <button class="btn ghost" data-act="ed-resched">Reschedule</button>
      <button class="btn ghost danger" data-act="ed-del" aria-label="Delete task">Delete</button></div>`;
  const prio = `<div class="fld"><span>Priority</span><div class="seg">${PRIOS.map(([k, l]) => `<label><input type="radio" name="priority" value="${k}" ${d.priority === k ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>`;
  let h = `${head}
  <label class="fld"><span>Task</span><input name="title" value="${esc(d.title)}" placeholder="What needs doing?" autocomplete="off" ${isNew ? 'autofocus' : ''} enterkeyhint="done"></label>
  <div class="row2">
    <label class="fld"><span>Due date <small>(blank = unscheduled)</small></span><input type="date" name="due" value="${d.due || ''}" min="2026-10-01" max="2027-01-31"></label>
    <label class="fld"><span>Category</span><select name="cat">${catOptions(d.cat)}</select></label>
  </div>
  ${d.due ? `<p class="sm muted fitline">${dayBadge(d.due)} ${suits(d, d.due) ? '' : '<span class="badge warn">This task is too heavy for this day</span>'}</p>` : ''}
  ${prio}`;
  if (!more) return h + `<button class="linkbtn" data-act="ed-more">More options (duration, kids' days, dependencies…)</button>`;
  const deps = d.deps || [], rel_ = d.related || [];
  const unlocks = isNew ? [] : dependents(d);
  h += `
  <div class="row2">
    <label class="fld"><span>Estimated time</span><select name="duration">${[...new Set([...DURS, +d.duration || 0])].sort((a, b) => a - b).map(m => `<option value="${m}" ${+d.duration === m ? 'selected' : ''}>${m ? fmtDur(m) : 'None'}</option>`).join('')}</select></label>
    <label class="fld"><span>Status</span><select name="status">${STATUSES.map(([k, l]) => `<option value="${k}" ${d.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
  </div>
  <div class="row2">
    <label class="fld"><span>OK on a kids' week day?</span><select name="kidsOk"><option value="auto" ${d.kidsOk == null ? 'selected' : ''}>Auto (yes if ≤ 30 min)</option><option value="yes" ${d.kidsOk === true ? 'selected' : ''}>Yes — light task</option><option value="no" ${d.kidsOk === false ? 'selected' : ''}>No — child-free days only</option></select></label>
    <label class="fld"><span>Repeat</span><select name="repeat">${[['', 'Does not repeat'], ['daily', 'Daily'], ['weekdays', 'Weekdays'], ['weekly', 'Weekly']].map(([k, l]) => `<option value="${k}" ${d.repeat === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
  </div>
  <label class="toggle"><input type="checkbox" name="weekendOk" ${d.weekendOk !== false ? 'checked' : ''}><span>OK on a child-free weekend</span></label>
  <label class="toggle"><input type="checkbox" name="fixed" ${d.fixed ? 'checked' : ''}><span>Fixed-date appointment (never suggested to move)</span></label>
  <label class="toggle"><input type="checkbox" name="ongoing" ${d.ongoing ? 'checked' : ''}><span>Ongoing over a period (start → due)</span></label>
  <div class="row2">
    <label class="fld"><span>Start date (optional)</span><input type="date" name="start" value="${d.start || ''}"></label>
    <label class="fld"><span>Reminder (optional)</span><input type="datetime-local" name="reminder" value="${d.reminder || ''}"></label>
  </div>
  <label class="fld"><span>Description</span><textarea name="desc" rows="2">${esc(d.desc)}</textarea></label>
  <label class="fld"><span>Notes</span><textarea name="notes" rows="3" placeholder="Buyer names, quotes, phone numbers…">${esc(d.notes)}</textarea></label>
  <div class="fld"><span>Checklist</span>
    <div class="subs">${(d.subtasks || []).map((s, i) => `<div class="sub-row" data-i="${i}"><input type="checkbox" ${s.done ? 'checked' : ''} aria-label="Done"><input type="text" value="${esc(s.text)}" aria-label="Checklist item"><button class="iconbtn sm" data-act="sub-del" data-i="${i}" aria-label="Remove item">✕</button></div>`).join('')}</div>
    <div class="addrow"><input type="text" id="subNew" placeholder="Add checklist item" enterkeyhint="enter"><button class="mini" data-act="sub-add">Add</button></div>
  </div>
  <div class="fld"><span>Depends on (must be done first)</span>${linkedList(deps, 'dep-del')}
    <select id="depAdd"><option value="">+ Add prerequisite…</option>${taskOptions([d.id, ...deps])}</select></div>
  ${unlocks.length ? `<div class="fld"><span>Unlocks (waiting on this)</span>${linkedList(unlocks.map(t => t.id))}</div>` : ''}
  <div class="fld"><span>Related tasks</span>${linkedList(rel_, 'rel-del')}
    <select id="relAdd"><option value="">+ Add related task…</option>${taskOptions([d.id, ...rel_])}</select></div>
  <div class="fld"><span>Links & references</span>
    ${(d.links || []).map((l, i) => `<div class="linked"><a href="${esc(l)}" target="_blank" rel="noopener">${esc(l)}</a><button class="iconbtn sm" data-act="link-del" data-i="${i}" aria-label="Remove link">✕</button></div>`).join('')}
    <div class="addrow"><input type="url" id="linkNew" placeholder="https://… (quote, listing, document)"><button class="mini" data-act="link-add">Add</button></div></div>`;
  if (!isNew && (d.originalDue || (d.history || []).length)) {
    h += `<div class="fld"><span>History</span><div class="hist">
      ${d.originalDue ? `<div>Originally due <b>${fmt(d.originalDue)}</b></div>` : ''}
      ${(d.history || []).map(x => `<div>${x.from ? fmt(x.from) : 'No date'} → ${x.to ? fmt(x.to) : 'No date'} <small class="muted">· ${esc(x.reason || '')} ${new Date(x.at).toLocaleDateString()}</small></div>`).join('')}
    </div></div>`;
  }
  return h;
}
function openEditor(id, preset = {}) {
  const t = id ? byId(id) : null;
  ui.editId = t ? t.id : null;
  ui.draft = t ? clone(t) : newTask(preset);
  ui.edMore = false;
  openSheet(t ? 'Task' : 'New task', editorHTML(), `<button class="btn ghost" data-act="sheetclose">Cancel</button><button class="btn primary" data-act="ed-save">${t ? 'Save' : 'Add task'}</button>`);
}
function refreshEditor() { syncDraft(); const b = $('#sheet-root .sheetbody'); if (b) { const y = b.scrollTop; b.innerHTML = editorHTML(); b.scrollTop = y; } }
function syncDraft() {
  const f = $('#sheet-root .sheetbody'), d = ui.draft;
  if (!f || !d) return;
  const el = n => f.querySelector(`[name="${n}"]`);
  for (const k of ['title', 'due', 'cat', 'start', 'status', 'repeat', 'reminder', 'desc', 'notes']) { const e = el(k); if (e) d[k] = e.value; }
  const pr = f.querySelector('[name="priority"]:checked'); if (pr) d.priority = pr.value;
  if (el('duration')) d.duration = +el('duration').value;
  if (el('kidsOk')) { const v = el('kidsOk').value; d.kidsOk = v === 'auto' ? null : v === 'yes'; }
  for (const b of ['weekendOk', 'fixed', 'ongoing']) if (el(b)) d[b] = el(b).checked;
  $$('.sub-row', f).forEach(r => { const s = d.subtasks[+r.dataset.i]; if (s) { s.text = r.querySelector('input[type=text]').value; s.done = r.querySelector('input[type=checkbox]').checked; } });
  for (const k of ['due', 'start', 'reminder']) if (d[k] === '') d[k] = null;
}
function saveEditor() {
  syncDraft();
  const d = ui.draft;
  d.title = (d.title || '').trim();
  if (!d.title) { toast('Give the task a title'); $('#sheet-root [name="title"]')?.focus(); return; }
  d.subtasks = (d.subtasks || []).filter(s => s.text.trim());
  const orig = ui.editId ? byId(ui.editId) : null;
  if (d.due && (!orig || orig.due !== d.due)) {
    const floor = depFloor(d);
    if (floor && d.due < floor) {
      const b = blockers(d)[0];
      if (!confirm(`"${b ? b.title : 'A prerequisite'}" is scheduled for ${fmt(floor)} and isn't done yet.\n\nKeep ${fmt(d.due)} anyway?`)) return;
    }
  }
  if (d.ongoing && d.start && d.due && d.start > d.due) d.start = d.due;
  if (orig) {
    if (orig.due !== d.due) {
      d.history = [...(orig.history || []), { from: orig.due, to: d.due, at: new Date().toISOString(), reason: 'Edited' }];
      if (!d.originalDue) d.originalDue = orig.due || d.due;
    }
    if (d.reminder !== orig.reminder) d.reminded = false;
    const wasDone = orig.status === 'done', nowDone = d.status === 'done';
    Object.assign(orig, d, { updatedAt: new Date().toISOString() });
    if (nowDone && !wasDone) { orig.status = 'todo'; setDone(orig, true); }
    if (!nowDone) orig.completedAt = null;
    save(); closeSheet(); rerender(); toast('Saved');
  } else {
    d.originalDue = d.due;
    S.tasks.push(d);
    save(); closeSheet(); rerender();
    if (!d.due) toast('Added to Unscheduled', 'Suggest dates', () => { location.hash = 'tasks'; ui.taskTab = 'ideas'; render(); });
    else toast(`Added for ${rel(d.due)}${suits(d, d.due) ? '' : ' — note: heavy for that day'}`);
  }
}
function deleteTask(t) {
  if (!confirm(`Delete "${t.title}"?`)) return;
  const idx = S.tasks.indexOf(t);
  const refs = S.tasks.filter(x => x.deps?.includes(t.id) || x.related?.includes(t.id)).map(x => [x.id, [...x.deps], [...x.related]]);
  S.tasks.splice(idx, 1);
  for (const x of S.tasks) { x.deps = (x.deps || []).filter(i => i !== t.id); x.related = (x.related || []).filter(i => i !== t.id); }
  save(); closeSheet(); rerender();
  toast('Task deleted', 'Undo', () => {
    S.tasks.splice(idx, 0, t);
    for (const [id, deps, rl] of refs) { const x = byId(id); if (x) { x.deps = deps; x.related = rl; } }
    save(); rerender();
  });
}

/* --- reschedule one --- */
function openResched(id) {
  const t = byId(id); if (!t) return;
  ui.reschedId = id;
  const td = todayISO();
  const from = t.due && t.due >= td ? add(t.due, 1) : td;
  const r = findSlot(t, from);
  const bl = blockers(t);
  const floor = depFloor(t);
  const opts = [];
  if (r) opts.push([r.date, `Next suitable day · ${fmt(r.date)}`, r.overloaded ? 'busy day' : DT[dayType(r.date)].label]);
  const tm = add(td, 1);
  if (suits(t, tm) && (!r || r.date !== tm)) opts.push([tm, `Tomorrow · ${fmt(tm)}`, DT[dayType(tm)].label]);
  const wk = t.due && t.due >= td ? add(t.due, 7) : add(td, 7);
  if (wk <= DEPART && suits(t, wk)) opts.push([wk, `One week later · ${fmt(wk)}`, DT[dayType(wk)].label]);
  openSheet('Reschedule', `
    <p class="rtitle"><b>${esc(t.title)}</b></p>
    <p class="muted sm">${t.due ? (isOverdue(t) ? `Overdue — was due ${fmt(t.due)}` : `Currently ${fmt(t.due)}`) : 'No date yet'}${t.originalDue && t.originalDue !== t.due ? ` · originally ${fmt(t.originalDue)}` : ''} · ${fmtDur(t.duration) || 'no estimate'}</p>
    ${bl.length ? `<div class="notice warnbox">Waiting on: ${bl.map(b => `<b>${esc(b.title)}</b> (${b.due ? fmt(depDate(b)) : 'no date'})`).join(', ')}. Dates before ${floor ? fmt(floor) : 'that'} are avoided.</div>` : ''}
    <div class="choices">${opts.map(([d, l, s]) => `<button class="choice" data-act="rs-apply" data-date="${d}"><b>${l}</b><small>${s}</small></button>`).join('') || '<p class="empty">No suitable day left before Dec 31 — pick one manually.</p>'}</div>
    <div class="addrow"><input type="date" id="rsDate" value="${r ? r.date : td}" min="2026-10-01" max="2027-01-31" aria-label="Pick a date"><button class="btn" data-act="rs-pick">Move</button></div>
    ${t.due ? '<button class="linkbtn" data-act="rs-unschedule">Remove date (move to Unscheduled)</button>' : ''}`);
}
function applyMove(t, date) {
  const floor = depFloor(t);
  if (date && floor && date < floor && !confirm(`A prerequisite isn't done and is scheduled for ${fmt(floor)}. Move to ${fmt(date)} anyway?`)) return;
  if (date && !suits(t, date) && !confirm(`${fmt(date)} is a "${DT[dayType(date)].label}" day and this task doesn't fit it. Move anyway?`)) return;
  moveTask(t, date, 'Rescheduled');
  save(); closeSheet(); rerender();
  toast(date ? `Moved to ${rel(date)}` : 'Moved to Unscheduled');
}

/* --- reschedule unfinished (wizard) --- */
function buildProposals() {
  const td = todayISO();
  const cands = S.tasks.filter(t => t.status !== 'done' && t.due &&
    (t.due < td || (t.due >= td && !t.ongoing && !t.fixed && !suits(t, t.due))));
  const candSet = new Set(cands);
  // load per priority: a task only competes with work of equal or higher priority
  const byRank = [{}, {}, {}, {}];
  for (const t of S.tasks) {
    if (candSet.has(t) || t.status === 'done' || !t.due || t.ongoing) continue;
    const m = byRank[PRANK[t.priority] ?? 2]; m[t.due] = (m[t.due] || 0) + (+t.duration || 0);
  }
  const loadFor = t => { const r = PRANK[t.priority] ?? 2, m = {}; for (let i = 0; i <= r; i++) for (const d in byRank[i]) m[d] = (m[d] || 0) + byRank[i][d]; return m; };
  const totalLoad = () => { const m = {}; for (const x of byRank) for (const d in x) m[d] = (m[d] || 0) + x[d]; return m; };
  cands.sort(byPrio);
  // dependencies first
  const set = new Set(cands), ordered = [], seen = new Set();
  const visit = t => { if (seen.has(t)) return; seen.add(t); for (const d of blockers(t)) if (set.has(d)) visit(d); ordered.push(t); };
  cands.forEach(visit);
  const prop = {};
  return ordered.map(t => {
    const reason = t.due < td ? 'Overdue' : dayType(t.due) === 'protected' ? "Kids' weekend" : 'Too heavy for a kids’ day';
    let to;
    if (t.ongoing) {
      to = maxS(add(td, 6), depFloor(t, prop)); if (to > DEPART) to = DEPART;
      return { t, reason, to, note: 'Extend the period' };
    }
    const r = findSlot(t, td, loadFor(t), prop);
    if (r) { to = r.date; prop[t.id] = to; const m = byRank[PRANK[t.priority] ?? 2]; m[to] = (m[to] || 0) + (+t.duration || 0); }
    const busy = r && (r.overloaded || (totalLoad()[r.date] || 0) > cap(r.date));
    return { t, reason, to: r ? r.date : null, note: r ? (busy ? 'Busy day — lower-priority tasks there may need moving' : DT[dayType(r.date)].label) : 'No suitable day before Dec 31' };
  });
}
function openWizard() {
  const ps = buildProposals();
  ui.proposals = ps;
  if (!ps.length) { toast('Nothing needs rescheduling'); return; }
  openSheet('Reschedule unfinished tasks', `
    <p class="muted sm">Suggested dates follow your custody calendar, daily limits, priorities and prerequisites. Nothing changes until you apply.</p>
    <div class="props">${ps.map((p, i) => `<label class="prop"><input type="checkbox" data-pi="${i}" ${p.to ? 'checked' : 'disabled'}>
      <span class="pbody"><b>${esc(p.t.title)}</b><small><span class="badge ${p.reason === 'Overdue' ? 'crit' : 'warn'}">${p.reason}</span> ${prioBadge(p.t)}</small>
      <span class="pmove">${fmt(p.t.due)} → <b>${p.to ? fmt(p.to) : '—'}</b> <small class="muted">${esc(p.note)}</small></span></span></label>`).join('')}</div>`,
    `<button class="btn ghost" data-act="sheetclose">Cancel</button><button class="btn primary" data-act="wiz-apply">Apply selected</button>`);
}
function applyWizard() {
  let n = 0;
  $$('#sheet-root [data-pi]').forEach(cb => {
    if (!cb.checked) return;
    const p = ui.proposals[+cb.dataset.pi]; if (!p || !p.to) return;
    moveTask(p.t, p.to, p.reason === 'Overdue' ? 'Rescheduled (overdue)' : 'Rescheduled (custody fit)'); n++;
  });
  save(); closeSheet(); rerender(); toast(`${n} task${n === 1 ? '' : 's'} rescheduled`);
}

/* --- sale items --- */
function openSale(id) {
  const s = id ? S.sales.find(x => x.id === id) : newSale();
  ui.saleDraft = s; ui.saleNew = !id;
  openSheet(id ? 'Sale item' : 'New sale item', `
    <label class="fld"><span>Item</span><input name="name" value="${esc(s.name)}" ${id ? '' : 'autofocus'}></label>
    <div class="row2"><label class="fld"><span>Asking price ($)</span><input name="ask" inputmode="decimal" value="${esc(s.ask ?? '')}"></label><label class="fld"><span>Minimum price ($)</span><input name="min" inputmode="decimal" value="${esc(s.min ?? '')}"></label></div>
    <div class="row2"><label class="fld"><span>Listing date</span><input type="date" name="listed" value="${s.listed || ''}"></label><label class="fld"><span>Status</span><select name="status">${SALE_STATUS.map(x => `<option ${s.status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
    <label class="fld"><span>Buyer contact notes</span><textarea name="buyer" rows="3">${esc(s.buyer)}</textarea></label>
    <div class="row2"><label class="fld"><span>Pickup date</span><input type="date" name="pickup" value="${s.pickup || ''}"></label><label class="fld"><span>Final price ($)</span><input name="final" inputmode="decimal" value="${esc(s.final ?? '')}"></label></div>
    <label class="toggle"><input type="checkbox" name="paid" ${s.paid ? 'checked' : ''}><span>Payment received and confirmed</span></label>
    <label class="fld"><span>Notes</span><textarea name="notes" rows="2">${esc(s.notes)}</textarea></label>
    ${id ? '<button class="linkbtn danger" data-act="sale-del">Delete item</button>' : ''}`,
    `<button class="btn ghost" data-act="sheetclose">Cancel</button><button class="btn primary" data-act="sale-save">Save</button>`);
}
function saveSale() {
  const f = $('#sheet-root .sheetbody'), s = ui.saleDraft;
  for (const k of ['name', 'ask', 'min', 'listed', 'status', 'buyer', 'pickup', 'final', 'notes']) { const v = f.querySelector(`[name="${k}"]`).value.trim(); s[k] = v === '' ? (['buyer', 'notes', 'name'].includes(k) ? '' : null) : v; }
  s.paid = f.querySelector('[name="paid"]').checked;
  s.outcome = ['Sold', 'Donated', 'Discarded'].includes(s.status) ? s.status : '';
  if (s.status === 'Not listed' && s.listed) s.status = 'Listed';
  if (!s.name) { toast('Name the item'); return; }
  if (ui.saleNew) S.sales.push(s);
  save(); closeSheet(); rerender(); toast('Saved');
}

/* ---------------- setup (first run) ---------------- */
function openSetup() {
  const c = S.settings.custody;
  openSheet('Set up your plan', `
    <p>Before the tasks are placed on the calendar, tell the app when the children are with you. Heavy tasks go on child-free days; kids' weekends stay free. You can change this anytime in Settings.</p>
    <label class="fld"><span>Custody pattern until Dec 20</span><select id="suMode"><option value="alternating">Alternating weeks</option><option value="custom">Something else — I'll mark days myself</option></select></label>
    <label class="fld"><span>Handoff day</span><select id="suDow">${DOWL.map((d, i) => `<option value="${i}" ${i === +c.handoffDow ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
    <div class="fld"><span>Are the kids with you on Monday, November 2?</span><div class="seg"><label><input type="radio" name="suKids" value="no" checked><span>No — child-free</span></label><label><input type="radio" name="suKids" value="yes"><span>Yes</span></label></div></div>
    <p class="muted sm">If you choose "Something else", the plan is built as if every day were child-free; mark your kids' days in Settings and use "Fix tasks that no longer fit".</p>`,
    `<button class="btn primary wide" data-act="setup-go">Build my plan</button>`, 'nodismiss');
}
function finishSetup() {
  const c = S.settings.custody;
  c.mode = $('#suMode').value; c.handoffDow = +$('#suDow').value;
  c.anchorKids = $('#sheet-root [name="suKids"]:checked').value === 'yes';
  S.settings.setupDone = true;
  const n = applySeeds();
  closeSheet(); render(); toast(`${n} tasks placed on your calendar`);
}

/* ---------------- export / import ---------------- */
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'bamako-move-planner', version: APP_VERSION, exportedAt: new Date().toISOString(), data: S }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `bamako-move-backup-${todayISO()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  S.meta.lastExport = new Date().toISOString(); save(); rerender();
  toast('Backup downloaded');
}
function importFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result), d = j.data || j;
      if (!Array.isArray(d.tasks)) throw new Error('No tasks in file');
      if (!confirm(`Restore ${d.tasks.length} tasks from this backup? This replaces everything currently in the app.`)) return;
      S = merge(d); S.settings.setupDone = true; save(); applySeeds(); closeSheet(); render(); toast('Backup restored');
    } catch (e) { alert('This file could not be restored: ' + e.message); }
  };
  r.readAsText(file);
}

/* ---------------- reminders ---------------- */
function checkReminders() {
  const now = new Date();
  for (const t of S.tasks) {
    if (!t.reminder || t.reminded || t.status === 'done') continue;
    if (new Date(t.reminder) <= now) {
      t.reminded = true; save();
      toast('⏰ ' + t.title, 'Open', () => openEditor(t.id));
      try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Bamako Move', { body: t.title, icon: 'icons/icon-192.png' }); } catch (e) {}
    }
  }
}

/* ---------------- toast ---------------- */
let toastTimer;
function toast(msg, action, fn) {
  const el = $('#toast');
  el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-act="toastact">${esc(action)}</button>` : ''}`;
  el.classList.add('show'); ui.toastFn = fn;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), action ? 6000 : 2600);
}

/* ---------------- events ---------------- */
function onClick(e) {
  const nav = e.target.closest('[data-nav]');
  if (nav) { e.preventDefault(); location.hash = nav.dataset.nav; return; }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, cardEl = el.closest('.card'), tid = cardEl?.dataset.id;
  const t = tid ? byId(tid) : null;
  switch (act) {
    case 'toggle': if (t) { const was = t.status; setDone(t, t.status !== 'done'); save(); rerender();
      if (t.status === 'done') toast('Completed', 'Undo', () => { t.status = was; t.completedAt = null; save(); rerender(); }); } break;
    case 'open': if (t) openEditor(t.id); break;
    case 'resched1': if (t) openResched(t.id); break;
    case 'quickadd': openEditor(null, { due: ui.view === 'calendar' && ui.calMode === 'month' ? ui.selDay : todayISO() }); break;
    case 'add-on': openEditor(null, { due: el.dataset.date || null }); break;
    case 'wizard': openWizard(); break;
    case 'export': exportData(); break;
    case 'calmode': ui.calMode = el.dataset.mode; render(); break;
    case 'calprev': case 'calnext': { const d = parse(ui.calCursor); d.setMonth(d.getMonth() + (act === 'calnext' ? 1 : -1)); ui.calCursor = iso(d); render(); break; }
    case 'caltoday': ui.calCursor = todayISO().slice(0, 7) + '-01'; ui.selDay = todayISO(); render(); break;
    case 'calday': ui.selDay = el.dataset.date; if (el.classList.contains('out')) ui.calCursor = ui.selDay.slice(0, 7) + '-01'; rerender(); $('.daypanel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); break;
    case 'wkprev': ui.weekStart = add(ui.weekStart, -7); render(); break;
    case 'wknext': ui.weekStart = add(ui.weekStart, 7); render(); break;
    case 'wktoday': ui.weekStart = weekStartFor(todayISO(), 1); render(); break;
    case 'tasktab': ui.taskTab = el.dataset.tab; render(); break;
    case 'goideas': ui.taskTab = 'ideas'; location.hash = 'tasks'; break;
    case 'flag': ui.f.flag = ui.f.flag === el.dataset.flag ? '' : el.dataset.flag; if (ui.f.flag === 'completed') ui.f.status = ''; rerender(); break;
    case 'suggest': { const x = byId(el.dataset.id); const ds = suggestDates(x);
      $('#sg-' + x.id).innerHTML = ds.length ? '<span class="sm muted">Pick a date:</span>' + ds.map(d => `<button class="mini" data-act="assign" data-id="${x.id}" data-date="${d}">${fmt(d)}</button>`).join('') : '<span class="sm muted">No suitable day left.</span>'; break; }
    case 'assign': { const x = byId(el.dataset.id); moveTask(x, el.dataset.date, 'Scheduled'); save(); rerender(); toast(`Scheduled for ${rel(el.dataset.date)}`); break; }
    case 'sale': openSale(el.dataset.id); break;
    case 'sale-save': saveSale(); break;
    case 'sale-del': if (confirm('Delete this sale item?')) { S.sales = S.sales.filter(s => s !== ui.saleDraft); save(); closeSheet(); rerender(); } break;
    case 'sheetclose': if (!$('#sheet-root .sheet.nodismiss')) closeSheet(); break;
    case 'ed-save': saveEditor(); break;
    case 'ed-more': ui.edMore = true; refreshEditor(); break;
    case 'ed-done': { const o = byId(ui.editId); syncDraft(); Object.assign(o, ui.draft); setDone(o, o.status !== 'done'); save(); closeSheet(); rerender(); toast(o.status === 'done' ? 'Completed' : 'Reopened'); break; }
    case 'ed-resched': { const id = ui.editId; syncDraft(); closeSheet(); openResched(id); break; }
    case 'ed-del': deleteTask(byId(ui.editId)); break;
    case 'sub-add': { syncDraft(); const v = $('#subNew').value.trim(); if (v) { ui.draft.subtasks.push({ id: uid(), text: v, done: false }); refreshEditor(); $('#subNew').focus(); } break; }
    case 'sub-del': syncDraft(); ui.draft.subtasks.splice(+el.dataset.i, 1); refreshEditor(); break;
    case 'dep-del': syncDraft(); ui.draft.deps = ui.draft.deps.filter(i => i !== el.dataset.id); refreshEditor(); break;
    case 'rel-del': syncDraft(); ui.draft.related = ui.draft.related.filter(i => i !== el.dataset.id); refreshEditor(); break;
    case 'link-add': { syncDraft(); let v = $('#linkNew').value.trim(); if (v) { if (!/^https?:\/\//i.test(v)) v = 'https://' + v; ui.draft.links = [...(ui.draft.links || []), v]; refreshEditor(); } break; }
    case 'link-del': syncDraft(); ui.draft.links.splice(+el.dataset.i, 1); refreshEditor(); break;
    case 'jump': { const id = el.dataset.id; if (ui.editId && !confirm('Leave this task without saving changes?')) break; closeSheet(); openEditor(id); break; }
    case 'rs-apply': applyMove(byId(ui.reschedId), el.dataset.date); break;
    case 'rs-pick': { const v = $('#rsDate').value; if (v) applyMove(byId(ui.reschedId), v); break; }
    case 'rs-unschedule': applyMove(byId(ui.reschedId), null); break;
    case 'wiz-apply': applyWizard(); break;
    case 'custday': { const d = el.dataset.date, o = S.settings.custody.overrides; const nv = !kidsWithMe(d);
      if (nv === patternKids(d)) delete o[d]; else o[d] = nv; save(); rerender(); custodyToast(); break; }
    case 'custreset': S.settings.custody.overrides = {}; save(); rerender(); custodyToast(); break;
    case 'import': $('#importFile').click(); break;
    case 'clear': if (confirm('Delete ALL tasks, sale items and settings from this device?') && confirm('Are you sure? Download a backup first if you might need it.')) { localStorage.removeItem(KEY); location.reload(); } break;
    case 'notif': Notification.requestPermission().then(() => rerender()); break;
    case 'setup-go': finishSetup(); break;
    case 'toastact': $('#toast').classList.remove('show'); ui.toastFn && ui.toastFn(); break;
  }
}
function custodyToast() {
  const n = conflictCount();
  if (n) toast(`${n} task${n > 1 ? 's' : ''} no longer fit the schedule`, 'Review', openWizard);
}
function onChange(e) {
  const el = e.target;
  if (el.dataset.filter) { ui.f[el.dataset.filter] = el.value; $('#tasklist').innerHTML = taskListHTML(); return; }
  if (el.dataset.set) {
    const c = S.settings.custody, k = el.dataset.set;
    c[k] = el.type === 'checkbox' ? el.checked : (k === 'handoffDow' ? +el.value : el.value);
    save(); rerender(); custodyToast(); return;
  }
  if (el.dataset.cap) { S.settings.caps[el.dataset.cap] = Math.max(0, +el.value || 0); save(); return; }
  if (el.id === 'importFile' && el.files[0]) { importFile(el.files[0]); el.value = ''; return; }
  if (el.id === 'depAdd' && el.value) { syncDraft(); ui.draft.deps = [...(ui.draft.deps || []), el.value]; refreshEditor(); return; }
  if (el.id === 'relAdd' && el.value) { syncDraft(); ui.draft.related = [...(ui.draft.related || []), el.value]; refreshEditor(); return; }
  if (ui.draft && (el.name === 'due' || el.name === 'duration' || el.name === 'kidsOk')) { refreshEditor(); return; }
  // tick a checklist item on an existing task: save immediately
  if (ui.editId && el.closest('.sub-row') && el.type === 'checkbox') {
    const i = +el.closest('.sub-row').dataset.i, o = byId(ui.editId);
    if (o && o.subtasks[i]) { o.subtasks[i].done = el.checked; ui.draft.subtasks[i].done = el.checked; save(); rerender(); }
  }
}
function onInput(e) {
  if (e.target.id === 'q') { ui.f.q = e.target.value; $('#tasklist').innerHTML = taskListHTML(); }
}
function onKey(e) {
  if (e.key === 'Escape' && $('#sheet-root .sheet') && !$('#sheet-root .sheet.nodismiss')) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'subNew') { e.preventDefault(); $('[data-act="sub-add"]').click(); }
  if (e.key === 'Enter' && e.target.id === 'linkNew') { e.preventDefault(); $('[data-act="link-add"]').click(); }
  if (e.key === 'Enter' && e.target.classList.contains('cbody')) e.target.click();
}

/* ---------------- boot ---------------- */
const viewFromHash = () => { const h = location.hash.replace('#', ''); return ['today', 'calendar', 'tasks', 'progress', 'settings'].includes(h) ? h : 'today'; };
function init() {
  S = loadState();
  ui.view = viewFromHash();
  window.addEventListener('hashchange', () => { ui.view = viewFromHash(); closeSheet(); render(); window.scrollTo(0, 0); });
  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', onInput);
  document.addEventListener('keydown', onKey);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('#sheet-root .sheet')) render(); });
  if (!S.settings.setupDone) { render(); openSetup(); }
  else { const n = applySeeds(); render(); if (n) toast(`${n} new tasks added to your plan`); }
  setInterval(checkReminders, 30000); checkReminders();
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}
window.__planner = { get state() { return S; }, buildProposals, dayType, kidsWithMe };
init();
})();
