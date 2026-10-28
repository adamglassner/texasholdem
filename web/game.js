/* Texas Hold'em - game logic. No-limit, blinds 10/20, play money only. (c) 2026 Ironite */
'use strict';
(async () => {
const VERSION = '1.0.0';
const $ = IR.$;
const SB = 10, BB = 20, START = 2000;
const save = new IR.Save('holdem.save', {
  settings: { music: true, sfx: true, vol: 60, pace: 'steady', help: 'on' },
  chips: START, ai: [START, START, START], button: 0, inHand: false, handStart: START,
  stats: { hands: 0, won: 0, biggestPot: 0, bestHand: -1, bestHandName: '', peak: START, restocks: 0, rebuys: 0 },
});
await save.load();
const S = save.data.settings, ST = save.data.stats, SD = save.data;
let notice = '';
if (SD.inHand) { SD.chips = SD.handStart; SD.inHand = false; notice = 'Your last hand was interrupted, so it was called off and your chips were returned.'; save.write(true); }

/* ---------- stage, art, audio ---------- */
const stage = $('#stage'), W = 1600, H = 844;
let res = 0;
const art = new IR.CardArt(ART.theme, 112, 157, 2);
const cards = new IR.Cards($('#cards'), art);
const fx = new IR.Particles($('#fx'));
IR.Stage.init(stage, s => {
  const r = IR.clamp(Math.ceil(s * (devicePixelRatio || 1) * 2) / 2, 1.5, 3.5);
  if (r > res + .4) { res = r; ART.scene($('#scene'), W, H, res); art.setRes(Math.max(2, res)); }
  fx.resize(W, H, Math.min(2, s * (devicePixelRatio || 1)));
});
const audio = new IR.Audio(S);
audio.setTunes(MUSIC.tunes(), MUSIC.instruments);
const sfx = MUSIC.sfx(audio);
IR.wireAudioControls(audio, save);
IR.on('tune', n => { const e = $('#nowPlaying'); e.textContent = '♫ ' + n; e.classList.add('show'); setTimeout(() => e.classList.remove('show'), 5000); });
$('#ver').textContent = 'v' + VERSION + ' · © 2026 Ironite · play money only';
let fast = 1;
const pace = () => (({ relaxed: 1.35, steady: 1, quick: .6 })[S.pace] || 1) * fast;
const wait = ms => new Promise((r, j) => { const g = gen; setTimeout(() => g === gen ? r() : j('stale'), ms * pace() / (IR.speed || 1)); });
const fmt = IR.fmt, r5 = v => Math.round(v / 5) * 5;

/* ---------- seats ---------- */
const SEATS = [
  { cards: [[676, 520], [802, 520]], s: 1, bet: [600, 585], btn: [985, 600], name: [800, 478] },
  { plaque: [20, 112], cards: [[196, 344], [232, 344]], s: .62, bet: [392, 392], btn: [262, 314], name: [250, 450], bub: [150, 108] },
  { plaque: [660, 4], cards: [[598, 150], [634, 150]], s: .62, bet: [930, 196], btn: [560, 205], name: [655, 112], bub: [800, 104], down: true },
  { plaque: [1320, 112], cards: [[1304, 344], [1340, 344]], s: .62, bet: [1208, 392], btn: [1338, 314], name: [1355, 450], bub: [1460, 108] },
];
const POT = [800, 200], DECK = [470, 196];
const BOARD = k => [496 + k * 124, 280];
const AV = {}; ART.FOLKS.forEach(f => AV[f.id] = ART.avatar(f, 160));
const P = ART.FOLKS.map((f, i) => ({ i, id: f.id, name: f.name, full: f.full, style: f.style || {}, tag: f.tag, stack: i ? SD.ai[i - 1] : SD.chips, hole: [], els: [], bet: 0, committed: 0, folded: false, allIn: false, acted: false, status: '' }));
P.forEach((p, i) => {
  if (!i) { p.el = $('#mePlaque'); $('#meAv').src = AV.you; return; }
  const s = SEATS[i], el = IR.el('div', 'seat', $('#seats'));
  el.style.left = s.plaque[0] + 'px'; el.style.top = s.plaque[1] + 'px';
  el.innerHTML = `<div class="tagb"></div><img class="av" src="${AV[p.id]}" alt=""><div><div class="nm">${p.full}</div><div class="ch"></div><div class="st"></div></div>`;
  p.el = el;
});
const btnEl = IR.el('div', 'dealerBtn', $('#marks'), 'D');

/* ---------- state ---------- */
let gen = 0, deck = [], board = [], boardEls = [], currentBet = 0, lastRaise = BB, phase = 'title', waiting = null, rigged = null;
const potTotal = () => P.reduce((s, p) => s + p.committed, 0);
const live = () => P.filter(p => !p.folded);
const canActCount = () => P.filter(p => !p.folded && !p.allIn).length;

function hud() {
  P.forEach((p, i) => {
    const st = p.status || '';
    if (i === 0) { $('#meChips').textContent = fmt(p.stack); $('#meStatus').innerHTML = st || '&nbsp;'; }
    else { p.el.querySelector('.ch').innerHTML = `${fmt(p.stack)}<small>chips</small>`; p.el.querySelector('.st').textContent = st; }
    p.el.classList.toggle('folded', p.folded && phase !== 'idle');
    const tags = []; if (phase !== 'title' && phase !== 'idle') { if (i === (SD.button + 1) % 4) tags.push('SMALL BLIND'); if (i === (SD.button + 2) % 4) tags.push('BIG BLIND'); }
    if (i) p.el.querySelector('.tagb').textContent = tags.join(' ');
  });
  const pot = potTotal();
  $('#potAmt').textContent = fmt(pot);
  $('#potSub').textContent = phase === 'title' ? '' : phase === 'idle' ? (pot ? 'Last hand’s pot' : '') : currentBet ? `Current bet ${fmt(currentBet)}` : board.length ? 'No bet yet this round' : '';
  $('#sHands').textContent = fmt(ST.hands); $('#sWon').textContent = fmt(ST.won); $('#sBig').textContent = fmt(ST.biggestPot);
  $('#tChips').textContent = fmt(SD.chips);
  const b = SEATS[SD.button].btn; btnEl.style.left = b[0] + 'px'; btnEl.style.top = b[1] + 'px';
  helper();
}
function setTurn(i) { P.forEach(p => p.el.classList.toggle('turn', p.i === i)); }
function log(html) { const L = $('#logLines'); IR.el('div', '', L, html); while (L.children.length > 9) L.firstChild.remove(); }
const nm = p => p.i === 0 ? '<b>You</b>' : `<b>${p.name}</b>`;
function say(p, text, ms = 1800) { if (!p.i) return; const s = SEATS[p.i]; IR.bubble($('#table'), text, s.bub[0], s.bub[1], s.down ? 'down' : '', ms * pace()); }
function helper() {
  const me = P[0], hv = $('#myHand'), hs = $('#mySub');
  if (S.help !== 'on') { hv.textContent = 'Hidden'; hs.textContent = 'Turn on the hand helper from the title screen'; return; }
  if (!me.hole.length || phase === 'title') { hv.innerHTML = '&nbsp;'; hs.textContent = 'Your best hand shows here'; return; }
  if (me.folded) { hv.textContent = 'Folded'; hs.textContent = 'Sit tight for the next hand'; return; }
  if (board.length < 3) { hv.textContent = POKER.startingName(me.hole); hs.textContent = 'Your starting hand'; return; }
  const e = POKER.evaluate(me.hole.concat(board), true); hv.textContent = e.name; hv.style.fontSize = e.name.length > 26 ? '15px' : e.name.length > 21 ? '17px' : ''; hs.textContent = 'Best five of your ' + (2 + board.length) + ' cards';
}

/* ---------- chips on the table ---------- */
const betEls = {};
function stack(el, amount, max = 10) { el.innerHTML = ART.breakdown(amount, max).reverse().map((v, k) => `<img src="${ART.chip(v, 56)}" style="top:${-k * 4}px">`).join('') + (amount ? `<div class="amt">${fmt(amount)}</div>` : ''); }
function renderBets() {
  P.forEach(p => {
    let el = betEls[p.i];
    if (p.bet > 0) { if (!el) { el = betEls[p.i] = IR.el('div', 'bet', $('#chipsLayer')); el.style.left = SEATS[p.i].bet[0] + 'px'; el.style.top = SEATS[p.i].bet[1] + 'px'; } stack(el, p.bet); }
    else if (el) { el.remove(); delete betEls[p.i]; }
  });
}
let potEl = null;
function renderPot(collected) {
  if (!potEl) { potEl = IR.el('div', 'bet', $('#chipsLayer')); potEl.style.left = POT[0] + 'px'; potEl.style.top = POT[1] + 'px'; }
  stack(potEl, collected, 14); potEl.querySelector('.amt')?.remove();
}
let collected = 0;
async function collectBets() {
  const els = Object.values(betEls); if (!els.length) return;
  els.forEach(el => { el.style.left = POT[0] + 'px'; el.style.top = POT[1] + 'px'; el.style.opacity = '.0'; });
  audio.sChip(3);
  await wait(480);
  els.forEach(el => el.remove()); Object.keys(betEls).forEach(k => delete betEls[k]);
  P.forEach(p => { collected += p.bet; p.bet = 0; p.acted = false; if (!p.folded && !p.allIn) p.status = ''; });
  currentBet = 0; lastRaise = BB;
  renderPot(collected); hud();
}
function put(p, amt) {
  amt = Math.min(amt, p.stack); p.stack -= amt; p.bet += amt; p.committed += amt;
  if (p.stack === 0) p.allIn = true;
  renderBets(); hud();
}

/* ---------- cards ---------- */
function placeCard(c, vx, vy, s, o = {}) { cards.move(c, vx - 56 * (1 - s), vy - 78.5 * (1 - s), Object.assign({ s }, o)); }
async function dealTo(p, k) {
  const id = deck.pop(); p.hole.push(id);
  const c = cards.make(id, { x: DECK[0] - 21, y: DECK[1] - 30, s: .62, up: false, r: -10 }); p.els.push(c);
  const s = SEATS[p.i];
  placeCard(c, s.cards[k][0], s.cards[k][1], s.s, { up: p.i === 0, r: p.i ? (k ? 6 : -6) : 0, dur: 380 });
  audio.sDeal(); await wait(150);
}
async function dealBoard(n, label) {
  log(`<b>${label}</b>`);
  for (let k = 0; k < n; k++) {
    const id = deck.pop(); board.push(id);
    const c = cards.make(id, { x: DECK[0] - 21, y: DECK[1] - 30, s: .62, up: false, r: -10 }); boardEls.push(c);
    const [bx, by] = BOARD(board.length - 1);
    placeCard(c, bx, by, 1, { up: true, r: 0, dur: 420 }); audio.sDeal();
    await wait(260);
  }
  hud(); await wait(500);
}

/* ---------- a hand ---------- */
async function playHand() {
  if (phase !== 'idle' && phase !== 'title') return;
  const g = ++gen; fast = 1;
  $('#waitRow').classList.add('hidden'); $('#betRow').classList.remove('hidden'); document.querySelector('.actRow').classList.remove('hidden');
  ['title', 'result'].forEach(id => $('#' + id) && IR.panel.hide(id));
  // rebuys for the house players, restock prompt for you
  P.forEach(p => { if (p.i && p.stack < BB) { p.stack = START; ST.rebuys++; log(`${nm(p)} buys back in for ${fmt(START)}.`); } });
  if (P[0].stack < BB) { phase = 'idle'; showWait(); return; }
  // reset table
  cards.clear(); boardEls = []; board = []; collected = 0; renderPot(0);
  Object.values(betEls).forEach(e => e.remove()); Object.keys(betEls).forEach(k => delete betEls[k]);
  $('#marks').querySelectorAll('.handName').forEach(e => e.remove());
  P.forEach(p => Object.assign(p, { hole: [], els: [], bet: 0, committed: 0, folded: false, allIn: false, acted: false, status: '' }));
  P.forEach(p => p.el.classList.remove('won', 'turn'));
  SD.button = (SD.button + 1) % 4;
  SD.inHand = true; SD.handStart = P[0].stack; save.write(true);
  deck = rigged ? rigged.slice() : IR.shuffle([...Array(52).keys()]); rigged = null;
  phase = 'preflop'; currentBet = 0; lastRaise = BB;
  const sbI = (SD.button + 1) % 4, bbI = (SD.button + 2) % 4;
  hud(); log(`<b>New hand.</b> ${P[SD.button].i ? P[SD.button].name + ' deals' : 'You deal'}.`);
  audio.sShuffle();
  try {
    await wait(1200);
    put(P[sbI], SB); P[sbI].status = `Small blind ${SB}`; put(P[bbI], BB); P[bbI].status = `Big blind ${BB}`;
    audio.sChip(2); currentBet = BB; lastRaise = BB; hud();
    log(`${nm(P[sbI])} post${sbI ? 's' : ''} ${SB}, ${nm(P[bbI])} post${bbI ? 's' : ''} ${BB}.`);
    for (let k = 0; k < 2; k++) for (let j = 1; j <= 4; j++) await dealTo(P[(SD.button + j) % 4], k);
    await wait(400); hud();
    ST.hands++; save.write();
    await bettingRound((bbI + 1) % 4);
    const streets = [[3, 'The flop'], [1, 'The turn'], [1, 'The river']];
    for (const [n, label] of streets) {
      if (live().length < 2) break;
      await collectBets();
      if (canActCount() < 2 && !shownAllIn) await revealForAllIn();
      phase = label; await dealBoard(n, label);
      if (canActCount() >= 2) await bettingRound((SD.button + 1) % 4);
    }
    await collectBets();
    if (g !== gen) return;
    if (live().length < 2) await uncontested(); else await showdown();
  } catch (e) { if (e !== 'stale') throw e; }
}
let shownAllIn = false;
async function revealForAllIn() {
  shownAllIn = true;
  const l = live(); if (l.length < 2) return;
  log('All in! The cards go face up.');
  l.forEach(p => { if (p.i) p.els.forEach(c => cards.flip(c, true)); });
  audio.sFlip(); await wait(900);
}

/* ---------- betting ---------- */
function roundDone() {
  if (live().length < 2) return true;
  const actors = P.filter(p => !p.folded && !p.allIn);
  if (!actors.length) return true;
  // one player left with chips: they only act if facing an all-in bet
  if (actors.length === 1) return actors[0].bet >= currentBet;
  return actors.every(p => p.acted && p.bet === currentBet);
}
async function bettingRound(start) {
  let i = start;
  for (let guard = 0; guard < 200; guard++) {
    if (roundDone()) break;
    const p = P[i];
    if (!p.folded && !p.allIn && (!p.acted || p.bet < currentBet)) {
      setTurn(p.i); hud();
      const a = p.i === 0 ? await humanAct() : await aiAct(p);
      apply(p, a);
      await wait(p.i ? 350 : 200);
    }
    i = (i + 1) % 4;
  }
  setTurn(-1);
}
function apply(p, a) {
  const toCall = currentBet - p.bet;
  if (a.type === 'fold') {
    p.folded = true; p.status = 'Folded'; sfx.fold();
    p.els.forEach(c => { cards.move(c, c._x, c._y + 14, { up: p.i === 0, dur: 300, top: false }); c.classList.add('mucked'); });
    log(`${nm(p)} fold${p.i ? 's' : ''}.`);
    if (p.i === 0) fast = .55;
  } else if (a.type === 'check') {
    p.status = 'Checked'; sfx.knock(); log(`${nm(p)} check${p.i ? 's' : ''}.`);
  } else if (a.type === 'call') {
    const amt = Math.min(toCall, p.stack); put(p, amt); audio.sChip(2);
    p.status = p.allIn ? `All-in ${fmt(p.bet)}` : `Called ${fmt(amt)}`;
    log(`${nm(p)} call${p.i ? 's' : ''} ${fmt(amt)}${p.allIn ? ' and is all-in' : ''}.`);
    if (p.allIn) sfx.allin();
  } else { // bet or raise to a.to (total for this round)
    const to = Math.min(a.to, p.bet + p.stack), raiseBy = to - currentBet;
    put(p, to - p.bet); audio.sChip(4);
    if (raiseBy >= lastRaise) { lastRaise = raiseBy; P.forEach(q => { if (q !== p) q.acted = false; }); }
    const wasBet = currentBet === 0;
    currentBet = Math.max(currentBet, to);
    p.status = p.allIn ? `All-in ${fmt(to)}` : wasBet ? `Bet ${fmt(to)}` : `Raised to ${fmt(to)}`;
    log(`${nm(p)} ${p.allIn ? (p.i ? 'goes' : 'go') + ' all-in for ' + fmt(to) : wasBet ? (p.i ? 'bets ' : 'bet ') + fmt(to) : (p.i ? 'raises' : 'raise') + ' to ' + fmt(to)}.`);
    if (p.allIn) sfx.allin();
  }
  p.acted = true; hud();
}

/* ---------- you ---------- */
const btn = id => $('#' + id);
function humanAct() {
  return new Promise(res => { waiting = res; refreshActions(); });
}
function resolveHuman(a) { if (!waiting) return; const w = waiting; waiting = null; refreshActions(); w(a); }
function raiseBounds() {
  const p = P[0], max = p.bet + p.stack;
  const min = currentBet === 0 ? Math.min(BB, max) : Math.min(currentBet + lastRaise, max);
  return { min, max };
}
function refreshActions() {
  const p = P[0], on = !!waiting, toCall = currentBet - p.bet;
  const canRaise = on && !p.acted && p.stack > toCall;
  btn('aFold').disabled = !on;
  btn('aCheck').disabled = !on || toCall > 0;
  btn('aCall').disabled = !on || toCall <= 0;
  btn('aBet').disabled = !on || currentBet !== 0 || p.stack <= 0;
  btn('aRaise').disabled = !on || currentBet === 0 || !canRaise;
  const callAmt = Math.min(toCall, p.stack);
  btn('aCall').querySelector('b').textContent = toCall > 0 ? (callAmt >= p.stack ? `Call All-in ${fmt(callAmt)}` : `Call ${fmt(callAmt)}`) : 'Call';
  const { min, max } = raiseBounds(), amt = $('#amt');
  const sliderOn = on && (currentBet === 0 ? p.stack > 0 : canRaise);
  amt.disabled = !sliderOn; document.querySelectorAll('.presets button').forEach(b => b.disabled = !sliderOn);
  if (sliderOn) { amt.min = min; amt.max = max; if (+amt.value < min || +amt.value > max || !amt.dataset.touched) amt.value = Math.min(max, currentBet === 0 ? Math.max(min, r5(potTotal() * .5)) : min); }
  labelAmt();
  $('#toCall').innerHTML = on ? (toCall > 0 ? `To call: <b>${fmt(callAmt)}</b>` : 'No bet to you') : '&nbsp;';
  P[0].el.classList.toggle('turn', on);
}
function labelAmt() {
  const v = +$('#amt').value, max = +$('#amt').max;
  $('#amtVal').textContent = fmt(v);
  btn('aBet').querySelector('b').textContent = waiting && currentBet === 0 ? (v >= max ? `All-in ${fmt(v)}` : `Bet ${fmt(v)}`) : 'Bet';
  btn('aRaise').querySelector('b').textContent = waiting && currentBet > 0 && !btn('aRaise').disabled ? (v >= max ? `All-in ${fmt(v)}` : `Raise to ${fmt(v)}`) : 'Raise';
}
$('#amt').oninput = () => { $('#amt').dataset.touched = '1'; labelAmt(); };
document.querySelectorAll('.presets button').forEach(b => b.onclick = () => {
  const { min, max } = raiseBounds(), toCall = currentBet - P[0].bet, pot = potTotal();
  let v = { min, all: max, half: currentBet === 0 ? pot * .5 : currentBet + (pot + toCall) * .5, pot: currentBet === 0 ? pot : currentBet + pot + toCall }[b.dataset.p];
  v = IR.clamp(r5(v), min, max); if (b.dataset.p === 'all') v = max;
  $('#amt').value = v; $('#amt').dataset.touched = '1'; labelAmt();
});
btn('aFold').onclick = () => !btn('aFold').disabled && resolveHuman({ type: 'fold' });
btn('aCheck').onclick = () => !btn('aCheck').disabled && resolveHuman({ type: 'check' });
btn('aCall').onclick = () => !btn('aCall').disabled && resolveHuman({ type: 'call' });
btn('aBet').onclick = () => !btn('aBet').disabled && resolveHuman({ type: 'bet', to: +$('#amt').value });
btn('aRaise').onclick = () => !btn('aRaise').disabled && resolveHuman({ type: 'raise', to: +$('#amt').value });
const clearTouched = () => delete $('#amt').dataset.touched;

/* ---------- the house players ---------- */
const LINES = {
  check: ['Check.', 'I’ll check.', '*knocks the table*'], call: ['Call.', 'I’ll call that.', 'I’m in.'], fold: ['Fold.', 'Too rich for me.', 'I’m out.'],
  bet: ['Bet {x}.', 'Let’s make it {x}.'], raise: ['Raise to {x}.', 'Make it {x}, partner.'], allin: ['All in!', 'Pushin’ it all in.'],
  win: { dusty: ['Well, I’ll be.', 'Slow and steady.'], lula: ['House always wins, sugar.', 'Thank you kindly.'], cody: ['Yeehaw!', 'Told y’all I was lucky!'] },
};
const pick = a => a[Math.floor(Math.random() * a.length)];
async function aiAct(p) {
  await wait(650 + Math.random() * 750);
  const toCall = currentBet - p.bet, opps = live().length - 1, pot = potTotal(), st = p.style;
  const eq = POKER.equity(p.hole, board, Math.max(1, opps), board.length ? 380 : 260);
  const rel = eq * (opps + 1), strength = rel + (Math.random() - .5) * .3 - (st.tight || 0) * 1.5;
  const max = p.bet + p.stack;
  const sized = f => { let to = r5(Math.max(currentBet + lastRaise, currentBet + (pot + toCall) * f)); if (currentBet === 0) to = r5(Math.max(BB, pot * f)); if (to > max * .8) to = max; return Math.min(to, max); };
  let a;
  if (toCall === 0) {
    const slow = rel > 2.4 && Math.random() < .2;
    if (!slow && strength > 1.45 - (st.aggr || 0) * .3) a = { type: currentBet ? 'raise' : 'bet', to: sized(rel > 2 ? .7 : .5) };
    else if (board.length && Math.random() < (st.bluff || 0)) a = { type: currentBet ? 'raise' : 'bet', to: sized(.5) };
    else a = { type: 'check' };
    if (a.type !== 'check' && currentBet && p.acted) a = { type: 'check' };
  } else {
    const potOdds = toCall / (pot + toCall), canRaise = !p.acted && p.stack > toCall;
    const need = potOdds * (1 + (st.tight || 0) * 2) - (st.aggr || 0) * .03;
    if (canRaise && strength > 1.95 - (st.aggr || 0) * .35 && Math.random() < .5 + (st.aggr || 0) * .4) a = { type: 'raise', to: sized(.6 + Math.random() * .3) };
    else if (canRaise && Math.random() < (st.bluff || 0) * .35 && toCall <= pot * .5) a = { type: 'raise', to: sized(.6) };
    else if (eq >= need || (toCall <= BB && !board.length && strength > .75) || (toCall >= p.stack * .8 && eq > potOdds * .95)) a = { type: 'call' };
    else a = { type: 'fold' };
  }
  const x = a.to ? fmt(a.to) : '';
  if (a.to >= max) say(p, pick(LINES.allin)); else say(p, pick(LINES[a.type]).replace('{x}', x));
  return a;
}

/* ---------- end of hand ---------- */
async function uncontested() {
  phase = 'showdown';
  const w = live()[0], total = potTotal();
  w.stack += total; collected = 0; renderPot(0);
  await award(w.i);
  log(`${nm(w)} take${w.i ? 's' : ''} the pot of ${fmt(total)}.`);
  if (w.i === 0) { ST.won++; ST.biggestPot = Math.max(ST.biggestPot, total); banner('You Win', `Everyone folded · +${fmt(total - w.committed)} chips`); sfx.pot(); burst(); }
  else { banner(`${w.full} Takes It`, 'Everyone else folded'); say(w, pick(LINES.win[w.id])); sfx.pot(); }
  endHand();
}
async function showdown() {
  phase = 'showdown';
  const l = live();
  l.forEach(p => { if (p.i) p.els.forEach(c => cards.flip(c, true)); });
  audio.sFlip(); log('<b>Showdown.</b>');
  await wait(800);
  const ev = {}; l.forEach(p => ev[p.i] = POKER.evaluate(p.hole.concat(board), true));
  l.forEach(p => nameTag(p, ev[p.i].name));
  await wait(1000);
  const pots = POKER.buildPots(P.map(p => ({ committed: p.committed, folded: p.folded })));
  const won = [0, 0, 0, 0]; let mainWinners = [];
  pots.forEach((pot, k) => {
    if (pot.eligible.length === 1) { won[pot.eligible[0]] += pot.amount; return; } // uncalled chips go back
    const best = Math.max(...pot.eligible.map(i => ev[i].score));
    const ws = pot.eligible.filter(i => ev[i].score === best);
    const share = Math.floor(pot.amount / ws.length / 5) * 5, rem = pot.amount - share * ws.length;
    ws.forEach(i => won[i] += share);
    won[ws.slice().sort((a, b) => (a - SD.button + 3) % 4 - (b - SD.button + 3) % 4)[0]] += rem;
    if (k === 0) mainWinners = ws;
    const label = pots.filter(q => q.eligible.length > 1).length > 1 ? (k === 0 ? 'the main pot' : 'a side pot') : 'the pot';
    log(`${ws.map(i => nm(P[i])).join(' & ')} ${ws.length > 1 ? 'split' : P[ws[0]].i ? 'wins' : 'win'} ${label} (${fmt(pot.amount)}) with ${ev[ws[0]].name}.`);
  });
  // highlight the winning five cards
  const winCards = new Set(mainWinners.flatMap(i => ev[i].best));
  [...boardEls, ...l.flatMap(p => p.els)].forEach(c => { c.classList.toggle('win', winCards.has(c._id)); c.classList.toggle('dimmed', !winCards.has(c._id)); });
  l.forEach(p => nameTag(p, ev[p.i].name, mainWinners.includes(p.i), won[p.i] - p.committed));
  P.forEach(p => p.stack += won[p.i]);
  collected = 0; renderPot(0);
  for (const i of mainWinners) await award(i, false);
  const me = P[0], myNet = won[0] - me.committed;
  if (!me.folded) { const c = ev[0].cat; if (c > ST.bestHand) { ST.bestHand = c; ST.bestHandName = POKER.CATS[c]; } }
  if (mainWinners.includes(0) || myNet > 0) {
    ST.won++; ST.biggestPot = Math.max(ST.biggestPot, won[0]);
    banner(mainWinners.length > 1 && mainWinners.includes(0) ? 'Split Pot' : 'You Win', `${ev[0].name} · +${fmt(Math.max(0, myNet))} chips`); sfx.pot(); burst();
  } else {
    const w = P[mainWinners[0]];
    banner(mainWinners.length > 1 ? 'Split Pot' : `${w.full} Wins`, ev[w.i].name); sfx.pot();
    if (mainWinners.length === 1) say(w, pick(LINES.win[w.id]));
  }
  endHand();
}
function nameTag(p, text, win = false, net = 0) {
  const s = SEATS[p.i]; let el = $('#marks').querySelector(`.handName[data-i="${p.i}"]`);
  if (!el) { el = IR.el('div', 'handName', $('#marks')); el.dataset.i = p.i; el.style.left = s.name[0] + 'px'; el.style.top = s.name[1] + 'px'; requestAnimationFrame(() => el.classList.add('show')); }
  el.classList.toggle('win', win); el.innerHTML = text + (win && net > 0 ? `<small>+${fmt(net)} chips</small>` : '');
}
async function award(i) {
  P[i].el.classList.add('won'); hud();
  const el = IR.el('div', 'bet', $('#chipsLayer')); el.style.left = POT[0] + 'px'; el.style.top = POT[1] + 'px'; stack(el, Math.max(5, potTotal()), 14); el.querySelector('.amt')?.remove();
  const target = i ? [SEATS[i].plaque[0] + 140, SEATS[i].plaque[1] + 50] : [150, 790];
  requestAnimationFrame(() => { el.style.left = target[0] + 'px'; el.style.top = target[1] + 'px'; el.style.opacity = '0'; });
  setTimeout(() => el.remove(), 600);
  await wait(400);
}
const burst = () => fx.burst(800, 360, 120, ['#ffe7b0', '#f0cf8a', '#ffffff', '#c9963e'], { speed: 700, size: 8 });
function banner(t, sub) { const b = $('#banner'); b.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); b.classList.add('show'); clearTimeout(banner.t); banner.t = setTimeout(() => b.classList.remove('show'), 2600 * pace() / (IR.speed || 1)); }
function endHand() {
  shownAllIn = false; setTurn(-1);
  SD.chips = P[0].stack; SD.ai = P.slice(1).map(p => p.stack); SD.inHand = false;
  ST.peak = Math.max(ST.peak, SD.chips); save.write(true);
  phase = 'idle'; hud(); showWait();
}
function showWait() {
  clearTouched();
  $('#waitRow').classList.remove('hidden'); $('#betRow').classList.add('hidden'); document.querySelector('.actRow').classList.add('hidden');
  const broke = P[0].stack < BB;
  $('#bNext').disabled = broke; $('#bRestock').classList.toggle('hidden', !broke);
  refreshActions();
}
$('#bNext').onclick = () => playHand();
$('#bRestock').onclick = () => { P[0].stack += START; SD.chips = P[0].stack; ST.restocks++; save.write(true); audio.sChip(6); log(`The house restocks you with <b>${fmt(START)}</b> play chips.`); hud(); showWait(); };
addEventListener('keydown', e => {
  if (!$('#title').classList.contains('hidden') || document.querySelector('.veil.closable:not(.hidden)')) return;
  const k = e.key.toLowerCase();
  if (waiting) { const map = { f: 'aFold', k: 'aCheck', c: 'aCall', b: 'aBet', r: 'aRaise' }; if (map[k]) btn(map[k]).click(); }
  else if ((k === 'enter' || k === ' ') && phase === 'idle' && !$('#bNext').disabled) { e.preventDefault(); playHand(); }
});

/* ---------- menus ---------- */
function chips(id, key, after) { const box = $(id); const sync = () => box.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === S[key])); box.querySelectorAll('button').forEach(b => b.onclick = () => { S[key] = b.dataset.v; save.write(); sync(); after && after(); }); sync(); }
chips('#optPace', 'pace'); chips('#optHelp', 'help', helper);
$('#folks').innerHTML = ART.FOLKS.slice(1).map(f => `<div class="f"><img src="${AV[f.id]}" alt=""><b>${f.full}</b><i>${f.tag}</i></div>`).join('');
if (notice) { $('#notice').textContent = notice; $('#notice').classList.remove('hidden'); }
$('#rankList').innerHTML = [['Royal Flush', 'A, K, Q, J, 10, all the same suit', 'A♠ K♠ Q♠ J♠ 10♠'], ['Straight Flush', 'Five in a row, all the same suit', '9♥ 8♥ 7♥ 6♥ 5♥'], ['Four of a Kind', 'Four cards of the same rank', 'J♣ J♦ J♥ J♠ 3♦'], ['Full House', 'Three of a kind plus a pair', 'K♠ K♥ K♦ 4♣ 4♠'], ['Flush', 'Any five of the same suit', 'A♦ 10♦ 8♦ 5♦ 2♦'], ['Straight', 'Five in a row, mixed suits', '10♣ 9♦ 8♠ 7♥ 6♣'], ['Three of a Kind', 'Three cards of the same rank', '7♠ 7♥ 7♦ K♣ 2♠'], ['Two Pair', 'Two different pairs', 'A♠ A♦ 8♣ 8♥ Q♠'], ['One Pair', 'Two cards of the same rank', 'Q♥ Q♣ 9♠ 6♦ 3♥'], ['High Card', 'None of the above: highest card plays', 'A♣ J♦ 8♠ 5♥ 3♣']]
  .map(([n, d, e]) => `<div class="rr"><b>${n}</b><span>${d}</span><i>${e.replace(/(\S+[♥♦])/g, '<span class="red">$1</span>')}</i></div>`).join('');
$('#bStart').onclick = () => { audio.unlock(); IR.panel.hide('title'); playHand(); };
$('#bRules').onclick = $('#bHow').onclick = () => IR.panel.show('rules');
$('#bHands').onclick = $('#bHands2').onclick = () => IR.panel.show('ranks');
$('#bCredits').onclick = $('#bCredits2').onclick = async () => { $('#changelog').innerHTML = IR.mdChangelog(await IR.loadChangelog()); IR.panel.show('credits'); };
IR.panel.wire();
hud(); refreshActions(); renderPot(0);
window.__he = { P, get board() { return board; }, get phase() { return phase; }, get waiting() { return !!waiting; }, get currentBet() { return currentBet; }, SD, ST, set rig(d) { rigged = d; }, potTotal };
})();
