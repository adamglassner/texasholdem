/* Texas Hold'em artwork: the Pecos Creek Saloon, a western deck, chips and
   the folks at the table. (c) 2026 Ironite */
'use strict';
const ART = (() => {
const D = IR.draw, RH = IR.RH;

/* ---------------- the saloon and the table ---------------- */
const TABLE = { cx: 800, cy: 420, rx: 650, ry: 282, rim: 40 };
function scene(c, W, H, res) {
  c.width = W * res; c.height = H * res; const x = c.getContext('2d'); x.scale(res, res);
  const R = IR.rng(1836);
  // plank wall
  const pw = 92;
  for (let px = 0, i = 0; px < W; px += pw, i++) {
    const L = 16 + R() * 6;
    x.fillStyle = D.lin(x, px, 0, px + pw, 0, [`hsl(24,38%,${L - 2}%)`, `hsl(26,40%,${L + 2}%)`, `hsl(24,38%,${L - 3}%)`]); x.fillRect(px, 0, pw, H);
    for (let k = 0; k < 18; k++) { const gx = px + R() * pw; x.strokeStyle = `rgba(20,8,2,${.12 + R() * .18})`; x.lineWidth = .6 + R(); x.beginPath(); x.moveTo(gx, 0); for (let y = 0; y <= H; y += 40) x.lineTo(gx + Math.sin(y * .01 + k) * 3, y); x.stroke(); }
    if (R() < .7) { const ky = R() * H; D.ell(x, px + pw * (.3 + R() * .4), ky, 5 + R() * 6, 9 + R() * 8, 'rgba(30,12,4,.55)'); }
    D.line(x, px, 0, px, H, 'rgba(10,4,1,.85)', 3);
    [60, H - 60].forEach(y => { D.ell(x, px + 10, y, 2.4, 2.4, '#2a221c'); D.ell(x, px + pw - 10, y, 2.4, 2.4, '#2a221c'); });
  }
  // wainscot rail
  x.fillStyle = D.lin(x, 0, 0, 0, 30, ['#4a2a16', '#2a160a']); x.fillRect(0, 190, W, 22);
  // lanterns with warm glow
  [[505, 40], [1095, 40], [800, -40]].forEach(([lx, ly], i) => {
    x.fillStyle = D.rad(x, lx, ly + 40, 10, i === 2 ? 760 : 380, ['rgba(255,190,100,.42)', 'rgba(255,170,80,.14)', 'rgba(255,160,70,0)']); x.fillRect(0, 0, W, H);
    if (i < 2) lantern(x, lx, ly);
  });
  sign(x, 22, 14, 340, 74, 'PECOS CREEK SALOON', 'est. 1886 \u00b7 Pecos, Texas');
  sign(x, W - 362, 14, 340, 74, 'NO-LIMIT HOLD\u2019EM', 'Blinds 10 / 20 \u00b7 Play money only');
  // table shadow
  D.ell(x, TABLE.cx, TABLE.cy + 30, TABLE.rx + 30, TABLE.ry + 30, 'rgba(0,0,0,.55)');
  // wood rim
  const { cx, cy, rx, ry, rim } = TABLE;
  D.ell(x, cx, cy, rx + rim, ry + rim, D.lin(x, 0, cy - ry - rim, 0, cy + ry + rim, ['#7a4a26', '#5a3218', '#3e200e']));
  x.save(); D.ell(x, cx, cy, rx + rim, ry + rim, null); x.clip();
  for (let i = 0; i < 160; i++) { const a = R() * Math.PI * 2, rr = 1 + (R() - .5) * .05; x.strokeStyle = `rgba(25,10,2,${.15 + R() * .2})`; x.lineWidth = 1; x.beginPath(); x.ellipse(cx, cy, (rx + rim * (.2 + R() * .8)) * rr, (ry + rim * (.2 + R() * .8)) * rr, 0, a, a + .3 + R() * .6); x.stroke(); }
  x.restore();
  D.ell(x, cx, cy, rx + rim - 4, ry + rim - 4, null); x.strokeStyle = 'rgba(255,215,160,.18)'; x.lineWidth = 2; x.stroke();
  // padded leather bumper
  D.ell(x, cx, cy, rx + 10, ry + 10, D.lin(x, 0, cy - ry, 0, cy + ry, ['#3a1c10', '#2a120a']));
  for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; D.ell(x, cx + Math.cos(a) * (rx + 4), cy + Math.sin(a) * (ry + 4), 2.6, 2.6, '#c9a35a'); D.ell(x, cx + Math.cos(a) * (rx + 4) - .7, cy + Math.sin(a) * (ry + 4) - .7, .9, .9, '#fff2c8'); }
  // leather playing surface
  D.ell(x, cx, cy, rx - 4, ry - 4, D.rad(x, cx, cy - 40, 40, rx, ['#7c2e1e', '#6a2416', '#561c10', '#3f140b']));
  x.save(); D.ell(x, cx, cy, rx - 4, ry - 4, null); x.clip();
  for (let i = 0; i < 7000; i++) { x.fillStyle = R() < .5 ? `rgba(0,0,0,${R() * .08})` : `rgba(255,190,140,${R() * .04})`; x.fillRect(cx - rx + R() * rx * 2, cy - ry + R() * ry * 2, 1.4, 1.4); }
  // tooled border: a ring of leaves and stitches
  for (const k of [0, 1]) { D.ell(x, cx, cy, rx - 26 - k * 30, ry - 26 - k * 30, null); x.setLineDash(k ? [] : [7, 6]); x.strokeStyle = k ? 'rgba(20,6,2,.35)' : 'rgba(240,200,150,.32)'; x.lineWidth = k ? 2 : 2; x.stroke(); }
  x.setLineDash([]);
  for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2, px = cx + Math.cos(a) * (rx - 41), py = cy + Math.sin(a) * (ry - 41); x.save(); x.translate(px, py); x.rotate(a + Math.PI / 2); x.fillStyle = 'rgba(25,6,2,.32)'; x.beginPath(); x.ellipse(0, 0, 9, 4, .5, 0, Math.PI * 2); x.fill(); x.beginPath(); x.ellipse(0, 0, 9, 4, -.5, 0, Math.PI * 2); x.fill(); x.restore(); }
  // lone star emblem and name
  star(x, cx, cy + 6, 120, 'rgba(25,6,2,.22)', 'rgba(240,200,150,.22)');
  // lantern light falling on the table
  x.fillStyle = D.rad(x, cx, cy - 120, 50, rx * 1.1, ['rgba(255,200,120,.16)', 'rgba(255,200,120,.04)', 'rgba(0,0,0,.25)']); x.fillRect(cx - rx, cy - ry, rx * 2, ry * 2);
  x.restore();
  // room vignette
  x.fillStyle = D.rad(x, W / 2, H * .5, Math.min(W, H) * .5, Math.hypot(W, H) * .62, ['rgba(0,0,0,0)', 'rgba(10,4,0,.55)']); x.fillRect(0, 0, W, H);
}
function sign(x, X, Y, w, h, title, sub) {
  D.line(x, X + 40, 0, X + 40, Y + 8, '#1c120a', 2); D.line(x, X + w - 40, 0, X + w - 40, Y + 8, '#1c120a', 2);
  D.rr(x, X, Y, w, h, 8); x.fillStyle = D.lin(x, 0, Y, 0, Y + h, ['#c9a46a', '#a37a44']); x.fill();
  D.rr(x, X + 6, Y + 6, w - 12, h - 12, 5); x.strokeStyle = 'rgba(60,30,8,.6)'; x.lineWidth = 2; x.stroke();
  const R = IR.rng(X); for (let i = 0; i < 14; i++) { const yy = Y + 8 + R() * (h - 16); D.line(x, X + 8, yy, X + w - 8, yy + (R() - .5) * 3, 'rgba(90,50,16,.18)', 1); }
  x.textAlign = 'center'; x.fillStyle = '#3a1e08'; x.font = '700 27px "National Park", Georgia, serif'; x.fillText(title, X + w / 2, Y + 38);
  x.font = 'italic 14px "Work Sans", sans-serif'; x.fillStyle = '#4a2a10'; x.fillText(sub, X + w / 2, Y + 60);
  [[X + 12, Y + 12], [X + w - 12, Y + 12], [X + 12, Y + h - 12], [X + w - 12, Y + h - 12]].forEach(([a, b]) => D.ell(x, a, b, 3, 3, '#3a2a1c'));
}
function lantern(x, lx, ly) {
  D.line(x, lx, ly - 120, lx, ly - 30, '#1c120a', 3);
  D.rr(x, lx - 24, ly - 34, 48, 10, 3); x.fillStyle = '#2a1c10'; x.fill();
  D.rr(x, lx - 20, ly - 24, 40, 58, 8); x.fillStyle = 'rgba(255,214,140,.92)'; x.fill();
  x.fillStyle = D.rad(x, lx, ly + 6, 2, 26, ['#fff6d8', 'rgba(255,200,110,.6)', 'rgba(255,170,80,0)']); x.fillRect(lx - 26, ly - 26, 52, 64);
  [-20, 0, 20].forEach(dx => D.line(x, lx + dx, ly - 24, lx + dx, ly + 34, '#2a1c10', 2.5));
  D.rr(x, lx - 26, ly + 32, 52, 10, 3); x.fillStyle = '#2a1c10'; x.fill();
}
function star(x, cx, cy, r, fill, stroke) {
  x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .42 : r; i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath();
  if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = Math.max(1, r * .02); x.stroke(); }
}

/* ---------------- chips ---------------- */
const CHIP = { 5: ['#efe6d2', '#b3261e', '#b3261e'], 25: ['#2a8a8a', '#f2e8d5', '#ffffff'], 100: ['#1e1a17', '#d9b26a', '#e9cf94'], 500: ['#b4561f', '#f2e8d5', '#ffffff'], 1000: ['#d8a93a', '#5a3610', '#4a2a08'] };
const chipCache = {};
function chip(v, size = 64, res = 2) {
  const key = v + '|' + size + '|' + res; if (chipCache[key]) return chipCache[key];
  const [c, x] = D.canvas(size * res, size * res); x.scale(res, res); const r = size / 2, [base, ins, txt] = CHIP[v];
  D.ell(x, r, r, r - 1, r - 1, base);
  x.save(); x.beginPath(); x.arc(r, r, r - 1, 0, Math.PI * 2); x.clip();
  for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; x.save(); x.translate(r, r); x.rotate(a); x.fillStyle = ins; x.fillRect(-r * .09, -r, r * .18, r * .26); x.restore(); }
  x.restore();
  D.ell(x, r, r, r * .66, r * .66, null); x.strokeStyle = ins; x.lineWidth = r * .05; x.stroke();
  D.ell(x, r, r, r * .6, r * .6, base);
  star(x, r, r - r * .02, r * .5, 'rgba(0,0,0,.08)');
  x.fillStyle = txt; x.font = `700 ${v >= 1000 ? r * .44 : v >= 100 ? r * .46 : r * .52}px "Young Serif", Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(v >= 1000 ? '1K' : v, r, r + r * .04);
  D.ell(x, r, r, r - 1.2, r - 1.2, null); x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 1.4; x.stroke();
  D.ell(x, r, r, r - 1.5, r - 1.5, D.rad(x, r * .7, r * .55, 0, r, ['rgba(255,255,255,.22)', 'rgba(255,255,255,0)', 'rgba(0,0,0,.18)']));
  return (chipCache[key] = c.toDataURL('image/png'));
}
const DENOMS = [1000, 500, 100, 25, 5];
function breakdown(amount, max = 14) { const out = []; let a = amount; for (const d of DENOMS) while (a >= d && out.length < max) { out.push(d); a -= d; } return out; }

/* ---------------- the deck ---------------- */
const RANCH = ['#3b4d63', '#8a2c1f', '#a8622a', '#4b5e34'];
function prairie(sky1, sky2) {
  return x => {
    x.fillStyle = D.lin(x, 0, 0, 0, 1.05, [sky1, sky2]); x.fillRect(0, 0, 1, RH);
    D.ell(x, .22, .5, .09, .09, 'rgba(255,236,190,.85)');
    D.poly(x, [[0, .9], [.12, .74], [.16, .74], [.2, .62], [.34, .62], [.38, .74], [.62, .8], [.7, .7], [.8, .7], [.86, .82], [1, .86], [1, 1.1], [0, 1.1]], '#b4785a');
    x.fillStyle = D.lin(x, 0, .95, 0, RH, ['#c9a46a', '#8f6a3c']); x.fillRect(0, 1.0, 1, RH);
    for (let i = 0; i < 9; i++) D.line(x, (i * .37) % 1, 1.05 + i * .06, (i * .37) % 1 + .06, 1.03 + i * .06, 'rgba(90,60,20,.35)', .01);
  };
}
const COURTS = {
  13: (x, s) => IR.portrait(x, { // the Rancher
    bg: prairie('#f3dcb5', '#e2a46a'), coat: ['#6b4a2e', '#3a2414'], hair: '#9a9088', mustache: '#8a8076', brows: '#7a7066', skin: '#d9a57a',
    hat: { type: 'cowboy', color: '#5a3a22', light: '#7a5434', band: RANCH[s], concho: '#e0c27a' },
    body: x => { D.poly(x, [[.36, 1.09], [.5, 1.3], [.64, 1.09]], '#efe4cf'); D.line(x, .5, 1.12, .5, 1.3, RANCH[s], .03); D.ell(x, .5, 1.16, .03, .025, '#d9b26a'); x.fillStyle = '#2a1a10'; x.fillRect(.36, 1.42, .28, .06); D.rr(x, .45, 1.41, .1, .08, .01); x.fillStyle = '#d9b26a'; x.fill(); },
  }),
  12: (x, s) => IR.portrait(x, { // the Saloon Owner
    bg: prairie('#f6e0c2', '#e8b083'), coat: [RANCH[s], '#24140c'], hair: '#9a3c1c', longHair: true, curls: true, lips: '#b8322e', lashes: true, blush: true, skin: '#f0c4a0', earring: '#e8c66a',
    hat: { type: 'cowboy', color: '#e9dcc0', light: '#fff6e2', band: RANCH[s] },
    collar: x => { for (let i = 0; i < 11; i++) D.ell(x, .38 + i * .024, 1.1 + Math.sin(i / 10 * Math.PI) * .05, .012, .012, '#f6efe0'); },
    front: x => { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; D.ell(x, .66 + Math.cos(a) * .022, .675 + Math.sin(a) * .022, .016, .016, '#4f7fd0'); } D.ell(x, .66, .675, .01, .01, '#f3d36b'); },
  }),
  11: (x, s) => IR.portrait(x, { // the Cowhand
    bg: prairie('#eef0e6', '#c9cfae'), coat: ['#a07a4c', '#6b4c2a'], hair: '#7a4a24', blush: true, skin: '#eebd96',
    hat: { type: 'cowboy', color: '#c9a46a', light: '#e3c48c', band: '#3a2412' },
    collar: x => { D.poly(x, [[.36, 1.04], [.5, 1.18], [.64, 1.04], [.6, 1.16], [.5, 1.26], [.4, 1.16]], RANCH[s]); for (let i = 0; i < 6; i++) D.ell(x, .42 + i * .032, 1.12 + (i % 2) * .03, .006, .006, '#fff'); },
    front: x => { x.beginPath(); x.ellipse(.82, 1.36, .1, .1, 0, 0, Math.PI * 2); x.strokeStyle = '#c9a46a'; x.lineWidth = .016; x.stroke(); x.beginPath(); x.ellipse(.82, 1.36, .07, .07, 0, 0, Math.PI * 2); x.stroke(); },
  }),
};
const theme = {
  paper: ['#fbf6ea', '#ecdfc2'], vignette: 'rgba(120,70,30,.15)', border: '#6a4426', radius: .07,
  index: { font: '"Young Serif", Georgia, serif', weight: '400', red: '#a2281e', black: '#1f1813' },
  pip: { red: ['#c9372a', '#86190f'], black: ['#3a3029', '#0f0b08'] },
  frame: ['#3a2412', '#f0d49a', '#a7782e', '#e9c784'],
  court: (x, s, r) => COURTS[r](x, s),
  ace(x, s, cw, ch) {
    const cx = cw / 2, cy = ch / 2;
    if (s === 0) {
      star(x, cx, cy, cw * .34, 'rgba(201,163,90,.18)', '#a7782e');
      IR.drawSuit(x, 0, cx, cy + cw * .02, cw * .3, false, { black: ['#3a3029', '#0f0b08'] });
      x.fillStyle = '#6a4426'; x.font = `${cw * .07}px "National Park", Georgia, serif`; x.textAlign = 'center'; x.fillText('PECOS CREEK', cx, ch * .86);
    } else { D.ell(x, cx, cy, cw * .3, cw * .3, null); x.strokeStyle = 'rgba(167,120,46,.45)'; x.setLineDash([cw * .02, cw * .02]); x.lineWidth = cw * .01; x.stroke(); x.setLineDash([]); IR.drawSuit(x, s, cx, cy, cw * .34, false, theme.pip); }
  },
  backBorder: '#1a0a04',
  back(x, cw, ch) {
    x.fillStyle = D.lin(x, 0, 0, cw, ch, ['#7a4626', '#4a2810']); x.fillRect(0, 0, cw, ch);
    const R = IR.rng(5); for (let i = 0; i < 600; i++) { x.fillStyle = `rgba(0,0,0,${R() * .1})`; x.fillRect(R() * cw, R() * ch, 1, 1); }
    const m = cw * .07;
    x.setLineDash([cw * .028, cw * .02]); x.strokeStyle = '#e7c98e'; x.lineWidth = cw * .012; x.strokeRect(m, m, cw - 2 * m, ch - 2 * m); x.setLineDash([]);
    x.strokeStyle = 'rgba(25,8,2,.5)'; x.lineWidth = cw * .02; x.strokeRect(m + cw * .035, m + cw * .035, cw - 2 * m - cw * .07, ch - 2 * m - cw * .07);
    // tooled scrolls in the corners
    [[m + cw * .1, m + cw * .1], [cw - m - cw * .1, m + cw * .1], [m + cw * .1, ch - m - cw * .1], [cw - m - cw * .1, ch - m - cw * .1]].forEach(([a, b]) => { x.beginPath(); x.arc(a, b, cw * .05, 0, Math.PI * 1.5); x.strokeStyle = 'rgba(25,8,2,.45)'; x.lineWidth = cw * .012; x.stroke(); });
    const cx = cw / 2, cy = ch / 2;
    D.ell(x, cx, cy, cw * .28, cw * .28, 'rgba(25,8,2,.35)');
    D.ell(x, cx, cy, cw * .28, cw * .28, null); x.strokeStyle = '#e7c98e'; x.lineWidth = cw * .012; x.stroke();
    star(x, cx, cy, cw * .22, D.lin(x, cx, cy - cw * .2, cx, cy + cw * .2, ['#f6dfa6', '#c9963e']), 'rgba(60,30,6,.6)');
  },
};

/* ---------------- the folks at the table ---------------- */
const FOLKS = [
  { id: 'you', name: 'You', full: 'You', look: { coat: ['#4a5f7a', '#2a374a'], hair: '#5a3b22', skin: '#e6b48c', hat: { type: 'cowboy', color: '#c9a46a', light: '#e2c28c', band: '#4a2a14' } } },
  { id: 'dusty', name: 'Dusty', full: 'Dusty Walker', tag: 'Runs cattle out past the creek. Plays it close.', style: { tight: .1, aggr: .2, bluff: .03 },
    look: { coat: ['#6b4a2e', '#3a2414'], hair: '#c9c2b8', mustache: '#d8d2c8', brows: '#b8b0a6', skin: '#d9a57a', glasses: false, hat: { type: 'cowboy', color: '#5a3a22', light: '#7a5434', band: '#2a1a10', concho: '#d9d2c8' } } },
  { id: 'lula', name: 'Lula Mae', full: 'Miss Lula Mae', tag: 'Owns the saloon. Never bluffs. (She bluffs.)', style: { tight: 0, aggr: .65, bluff: .09 },
    look: { coat: ['#2f5a7a', '#1a3448'], hair: '#9a3c1c', longHair: true, curls: true, lips: '#b8322e', lashes: true, blush: true, skin: '#f0c4a0', earring: '#e8c66a', hat: { type: 'cowboy', color: '#efe4cf', light: '#fff8ea', band: '#b8322e' } } },
  { id: 'cody', name: 'Cody', full: 'Cody Briggs', tag: 'Ranch hand. Feels lucky every single night.', style: { tight: -.12, aggr: .55, bluff: .16 },
    look: { coat: ['#a8622a', '#6e3c14'], hair: '#c8862f', blush: true, skin: '#f0c19c', hat: { type: 'cowboy', color: '#1e1a17', light: '#3a332c', band: '#a8622a' } } },
];
function avatar(f, size) {
  const [c, x] = D.canvas(size, size); const s = size;
  x.save(); x.beginPath(); x.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2); x.clip();
  x.translate(s * -.12, s * -.44); x.scale(s * 1.24, s * 1.24);
  IR.portrait(x, Object.assign({ bg: prairie('#f6e3c8', '#e2a46a') }, f.look || {}));
  x.restore();
  return c.toDataURL('image/png');
}

return { scene, theme, chip, breakdown, DENOMS, FOLKS, avatar, star, TABLE };
})();
