/* Texas Hold'em engine: hand evaluation, hand names, side pots and equity
   estimates for the computer players. (c) 2026 Ironite */
'use strict';
const POKER = (() => {
// card ids 0..51: suit = floor(id/13), rank = id%13+1 (Ace = 1). Here aces are high (14).
const rk = id => { const r = id % 13 + 1; return r === 1 ? 14 : r; };
const st = id => Math.floor(id / 13) % 4;
const NAME = { 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine', 10: 'Ten', 11: 'Jack', 12: 'Queen', 13: 'King', 14: 'Ace' };
const PLURAL = { 2: 'Twos', 3: 'Threes', 4: 'Fours', 5: 'Fives', 6: 'Sixes', 7: 'Sevens', 8: 'Eights', 9: 'Nines', 10: 'Tens', 11: 'Jacks', 12: 'Queens', 13: 'Kings', 14: 'Aces' };
const CATS = ['High Card', 'One Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'];

function straightHigh(mask) { // mask bit r set for each rank present (2..14); ace also counts low
  if (mask & (1 << 14)) mask |= 2;
  for (let h = 14; h >= 5; h--) { const need = 0b11111 << (h - 4); if ((mask & need) === need) return h; }
  return 0;
}
const enc = (cat, ks) => { let s = cat; for (let i = 0; i < 5; i++) s = s * 15 + (ks[i] || 0); return s; };

/* Best five-card hand from 5-7 cards. Returns {score, cat, ranks}; with
   detail=true also {name, best (card ids)}. Higher score wins. */
function evaluate(ids, detail = false) {
  const cnt = new Array(15).fill(0), bySuit = [[], [], [], []]; let mask = 0;
  for (const id of ids) { const r = rk(id); cnt[r]++; bySuit[st(id)].push(r); mask |= 1 << r; }
  let flushSuit = -1; for (let s = 0; s < 4; s++) if (bySuit[s].length >= 5) flushSuit = s;
  let cat, ks;
  if (flushSuit >= 0) {
    let fm = 0; bySuit[flushSuit].forEach(r => fm |= 1 << r);
    const sf = straightHigh(fm);
    if (sf) { cat = sf === 14 ? 9 : 8; ks = [sf]; }
  }
  const groups = []; for (let r = 14; r >= 2; r--) if (cnt[r]) groups.push([cnt[r], r]);
  groups.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const ranksDesc = []; for (let r = 14; r >= 2; r--) for (let k = 0; k < cnt[r]; k++) ranksDesc.push(r);
  if (cat == null && groups[0][0] === 4) { const q = groups[0][1]; cat = 7; ks = [q, ranksDesc.find(r => r !== q)]; }
  if (cat == null && groups[0][0] === 3) {
    const t = groups[0][1], p = groups.slice(1).find(g => g[0] >= 2);
    if (p) { cat = 6; ks = [t, p[1]]; }
  }
  if (cat == null && flushSuit >= 0) { cat = 5; ks = bySuit[flushSuit].slice().sort((a, b) => b - a).slice(0, 5); }
  if (cat == null) { const sh = straightHigh(mask); if (sh) { cat = 4; ks = [sh]; } }
  if (cat == null && groups[0][0] === 3) { const t = groups[0][1]; cat = 3; ks = [t, ...ranksDesc.filter(r => r !== t).slice(0, 2)]; }
  if (cat == null && groups[0][0] === 2 && groups[1] && groups[1][0] === 2) { const a = groups[0][1], b = groups[1][1]; cat = 2; ks = [a, b, ranksDesc.find(r => r !== a && r !== b)]; }
  if (cat == null && groups[0][0] === 2) { const p = groups[0][1]; cat = 1; ks = [p, ...ranksDesc.filter(r => r !== p).slice(0, 3)]; }
  if (cat == null) { cat = 0; ks = ranksDesc.slice(0, 5); }
  const out = { score: enc(cat, ks), cat, ranks: ks };
  if (detail) { out.name = describe(cat, ks); out.short = CATS[cat]; out.best = bestCards(ids, cat, ks, flushSuit); }
  return out;
}
function describe(cat, k) {
  switch (cat) {
    case 9: return 'Royal Flush';
    case 8: return `Straight Flush, ${NAME[k[0]]} high`;
    case 7: return `Four of a Kind, ${PLURAL[k[0]]}`;
    case 6: return `Full House, ${PLURAL[k[0]]} full of ${PLURAL[k[1]]}`;
    case 5: return `Flush, ${NAME[k[0]]} high`;
    case 4: return `Straight, ${NAME[k[0]]} high`;
    case 3: return `Three of a Kind, ${PLURAL[k[0]]}`;
    case 2: return `Two Pair, ${PLURAL[k[0]]} and ${PLURAL[k[1]]}`;
    case 1: return `Pair of ${PLURAL[k[0]]}`;
    default: return `High Card, ${NAME[k[0]]}`;
  }
}
function bestCards(ids, cat, ks, fs) {
  const pick = [], used = new Set();
  const take = (pred, n) => { for (const id of ids.slice().sort((a, b) => rk(b) - rk(a))) { if (pick.length >= 5 || n <= 0) break; if (!used.has(id) && pred(id)) { pick.push(id); used.add(id); n--; } } };
  const straightRanks = h => h === 5 ? [5, 4, 3, 2, 14] : [h, h - 1, h - 2, h - 3, h - 4];
  if (cat === 9 || cat === 8) straightRanks(ks[0]).forEach(r => take(id => st(id) === fs && rk(id) === r, 1));
  else if (cat === 7) { take(id => rk(id) === ks[0], 4); take(() => true, 1); }
  else if (cat === 6) { take(id => rk(id) === ks[0], 3); take(id => rk(id) === ks[1], 2); }
  else if (cat === 5) take(id => st(id) === fs, 5);
  else if (cat === 4) straightRanks(ks[0]).forEach(r => take(id => rk(id) === r, 1));
  else if (cat === 3) { take(id => rk(id) === ks[0], 3); take(() => true, 2); }
  else if (cat === 2) { take(id => rk(id) === ks[0], 2); take(id => rk(id) === ks[1], 2); take(() => true, 1); }
  else if (cat === 1) { take(id => rk(id) === ks[0], 2); take(() => true, 3); }
  else take(() => true, 5);
  return pick;
}

/* Starting-hand name, e.g. "Pocket Kings", "Ace-King suited". */
function startingName(h) {
  const a = rk(h[0]), b = rk(h[1]); const hi = Math.max(a, b), lo = Math.min(a, b);
  if (a === b) return `Pocket ${PLURAL[a]}`;
  return `${NAME[hi]}-${NAME[lo]}${st(h[0]) === st(h[1]) ? ' suited' : ''}`;
}

/* Split chips into pots. players: [{committed, folded}], returns
   [{amount, eligible: [indexes]}] from the main pot outward. */
function buildPots(players) {
  const levels = [...new Set(players.filter(p => !p.folded && p.committed > 0).map(p => p.committed))].sort((a, b) => a - b);
  const pots = []; let prev = 0;
  for (const lv of levels) {
    let amount = 0; players.forEach(p => amount += Math.max(0, Math.min(p.committed, lv) - prev));
    const eligible = players.map((p, i) => i).filter(i => !players[i].folded && players[i].committed >= lv);
    if (amount > 0) {
      if (pots.length && sameSet(pots[pots.length - 1].eligible, eligible)) pots[pots.length - 1].amount += amount;
      else pots.push({ amount, eligible });
    }
    prev = lv;
  }
  // chips from folded players above the highest live level go to the last pot
  const extra = players.reduce((s, p) => s + Math.max(0, p.committed - prev), 0);
  if (extra && pots.length) pots[pots.length - 1].amount += extra;
  return pots;
}
const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/* Monte Carlo equity of a hand against n random opponent hands. */
function equity(hole, board, nOpp, iters = 400) {
  const known = new Set([...hole, ...board]);
  const deck = []; for (let i = 0; i < 52; i++) if (!known.has(i)) deck.push(i);
  let score = 0;
  const need = 5 - board.length;
  for (let it = 0; it < iters; it++) {
    // partial Fisher-Yates for just the cards we need
    const n = need + nOpp * 2;
    for (let i = 0; i < n; i++) { const j = i + Math.floor(Math.random() * (deck.length - i)); const t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    const b = board.concat(deck.slice(0, need));
    const mine = evaluate(hole.concat(b)).score;
    let best = 0, ties = 0, lost = false;
    for (let o = 0; o < nOpp; o++) {
      const s = evaluate([deck[need + o * 2], deck[need + o * 2 + 1]].concat(b)).score;
      if (s > mine) { lost = true; break; }
      if (s === mine) ties++;
    }
    if (!lost) score += 1 / (ties + 1);
  }
  return score / iters;
}

return { evaluate, describe, startingName, buildPots, equity, CATS, rk, st, NAME, PLURAL };
})();
if (typeof module !== 'undefined') module.exports = POKER;
