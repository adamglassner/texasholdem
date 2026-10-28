/* Texas Hold'em music: three original, gentle country tunes played live by
   the game (strummed and fingerpicked guitar, fiddle, harmonica, pedal steel
   and upright bass). (c) 2026 Ironite */
'use strict';
const MUSIC = (() => {
const parseMel = (s, at) => { const ev = []; let t = at; s.split(/\s+/).filter(x => x && x !== '|').forEach(tok => { const [n, d] = tok.split(':'); if (n !== 'R') ev.push({ n, t, d: +d }); t += +d; }); return ev; };

function arrange(tune) {
  const ev = [], B = tune.beats;
  const rhythm = (bars, at, soft = false) => {
    bars.forEach((sym, bi) => {
      const c = IR.chord(sym), t0 = at + bi * B;
      const root = IR.pcAbove(c.root, 40), fifth = IR.pcAbove((c.root + 7) % 12, 40);
      const strum = c.pcs.map(pc => IR.pcAbove(pc, 52)).concat([IR.pcAbove(c.root, 52) + 12]).sort((a, b) => a - b);
      const v = soft ? .7 : 1;
      if (tune.feel === 'waltz') {
        ev.push({ t: t0, i: 'bass', m: bi % 2 ? fifth : root, d: 1, v });
        ev.push({ t: t0 + 1, i: 'strum', ms: strum, v: .75 * v }); ev.push({ t: t0 + 2, i: 'strum', ms: strum, v: .65 * v });
      } else if (tune.feel === 'twostep') {
        ev.push({ t: t0, i: 'bass', m: root, d: 1, v }); ev.push({ t: t0 + 2, i: 'bass', m: fifth, d: 1, v: .85 * v });
        ev.push({ t: t0 + 1, i: 'strum', ms: strum, v: .8 * v }); ev.push({ t: t0 + 3, i: 'strum', ms: strum, v: .75 * v }); ev.push({ t: t0 + 3.5, i: 'strum', ms: strum.slice(-3), v: .4 * v, up: true });
      } else { // slow fingerpicking
        const hi = c.pcs.map(pc => IR.pcAbove(pc, 59)).sort((a, b) => a - b);
        [[0, root, .9], [1, hi[0], .5], [1.5, hi[1], .45], [2, fifth, .75], [2.5, hi[2] || hi[1], .45], [3, hi[1], .5], [3.5, hi[0], .4]].forEach(([o, m, vv]) => ev.push({ t: t0 + o, i: 'pick', m, v: vv * v }));
        ev.push({ t: t0, i: 'bassSoft', m: IR.pcAbove(c.root, 33), d: B * .9, v: .5 * v });
      }
    });
    return at + bars.length * B;
  };
  const lead = (mel, at, inst) => parseMel(mel, at).forEach(e => ev.push({ t: e.t, i: inst, m: IR.n2m(e.n), d: e.d, v: 1 }));
  let t = rhythm(tune.intro, 0, true);
  for (const [sec, inst] of tune.form) { lead(tune[sec].mel, t, inst); t = rhythm(tune[sec].ch, t); }
  t = rhythm(tune.tag, t, true);
  ev.sort((a, b) => a.t - b.t);
  return { name: tune.name, bpm: tune.bpm, swing: tune.swing || 0, events: ev, len: t, gap: 3 };
}

const TUNES = [
  { name: 'Pecos Creek Waltz', bpm: 100, beats: 3, feel: 'waltz',
    intro: ['G', 'C', 'D', 'G'],
    A: { ch: ['G', 'G', 'C', 'G', 'D', 'D', 'G', 'G'], mel: 'B4:2 D5:1 | G5:2 F#5:1 | E5:2 C5:1 | B4:3 | A4:2 B4:1 | C5:1 B4:1 A4:1 | G4:3 | G4:2 D4:1' },
    B: { ch: ['C', 'C', 'G', 'G', 'A7', 'A7', 'D', 'D7'], mel: 'E5:2 G5:1 | E5:2 C5:1 | D5:2 B4:1 | G4:3 | A4:1 C#5:1 E5:1 | G5:2 E5:1 | F#5:3 | D5:2 C5:1' },
    form: [['A', 'fiddle'], ['B', 'fiddle'], ['A', 'steel'], ['B', 'harmonica']],
    tag: ['G', 'D', 'G'] },
  { name: 'Bluebonnet Two-Step', bpm: 104, beats: 4, feel: 'twostep', swing: .2,
    intro: ['D', 'G', 'A', 'D'],
    A: { ch: ['D', 'D', 'G', 'G', 'A', 'A', 'D', 'D'], mel: 'F#5:1 A5:1 F#5:1 D5:1 | E5:1.5 D5:.5 B4:2 | B4:1 D5:1 G5:1 B5:1 | A5:3 R:1 | E5:1 G5:1 E5:1 C#5:1 | A4:1 B4:1 C#5:1 E5:1 | D5:1 F#5:1 A5:1 F#5:1 | D5:3 R:1' },
    B: { ch: ['G', 'G', 'D', 'D', 'E7', 'E7', 'A', 'A7'], mel: 'B5:1.5 A5:.5 G5:1 D5:1 | B4:1 D5:1 G5:2 | A5:1.5 F#5:.5 D5:1 A4:1 | F#4:1 A4:1 D5:2 | G#5:1 E5:1 D5:1 B4:1 | G#4:1 B4:1 D5:1 E5:1 | C#5:1 E5:1 A5:1 E5:1 | G5:3 R:1' },
    form: [['A', 'harmonica'], ['B', 'fiddle'], ['A', 'fiddle'], ['B', 'steel']],
    tag: ['G', 'A', 'D'] },
  { name: 'Lantern Light', bpm: 68, beats: 4, feel: 'pick',
    intro: ['C', 'F', 'G', 'C'],
    A: { ch: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm7', 'C'], mel: 'E5:3 D5:1 | C5:2 A4:2 | A4:1 C5:1 F5:1.5 E5:.5 | D5:4 | E5:1.5 G5:.5 E5:1 C5:1 | A5:2 E5:2 | F5:1 E5:1 D5:1.5 C5:.5 | C5:4' },
    B: { ch: ['F', 'C', 'F', 'G', 'Am', 'Em', 'F', 'C'], mel: 'A5:2 G5:1 F5:1 | E5:2 C5:2 | F5:1 A5:1 C6:1.5 A5:.5 | G5:4 | E5:1 A5:1 C6:1 B5:1 | G5:2 E5:2 | F5:1 E5:1 D5:1 G5:1 | C5:4' },
    form: [['A', 'steel'], ['B', 'steel'], ['A', 'harmonica'], ['B', 'steel']],
    tag: ['F', 'G', 'C'] },
];

const instruments = {
  bass(t, e, d, v) { this.bass(t, e.m, .7 * v, Math.min(d, .8)); },
  bassSoft(t, e, d, v) { this.bass(t, e.m, .5 * v, d); },
  strum(t, e, d, v) { const ms = e.up ? e.ms.slice().reverse() : e.ms; ms.forEach((m, i) => this.pluck(t + i * .013, m, .13 * v, { decay: .9965, bright: .6, dur: 1.4, lp: 3200, body: 240 })); },
  pick(t, e, d, v) { this.pluck(t, e.m, .22 * v, { decay: .998, bright: .45, dur: 2.2, lp: 3000, body: 230 }); },
  fiddle(t, e, d, v) { this.fiddle(t, e.m, .95 * v, d * .95); },
  harmonica(t, e, d, v) { this.harmonica(t, e.m, .95 * v, d * .92); },
  steel(t, e, d, v) { this.steel(t, e.m, .9 * v, d); },
};

function sfx(audio) {
  return {
    knock() { audio.sfx(function (t, o) { [0, .11].forEach(dt => { this.noiseHit(t + dt, .55, { type: 'lowpass', freq: 380, decay: .07, out: o }); this.noiseHit(t + dt, .15, { freq: 1400, q: 2, decay: .03, out: o }); }); }); },
    fold() { audio.sfx(function (t, o) { this.noiseHit(t, .3, { freq: 2600, q: .7, attack: .02, decay: .14, sweep: 900, out: o }); }); },
    pot() { audio.sfx(function (t, o) { [67, 71, 74, 79, 83].forEach((m, i) => this.bell(t + i * .08, m, .85, o, 2)); for (let k = 0; k < 8; k++) this.noiseHit(t + .1 + k * .05, .22, { freq: 5200, q: 2, decay: .03, out: o }); }); },
    allin() { audio.sfx(function (t, o) { this.steel(t, 62, .8, .6, o); this.steel(t + .25, 69, .8, .8, o); }); },
  };
}

return { tunes: () => TUNES.map(arrange), instruments, sfx };
})();
