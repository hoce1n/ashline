import { GameAudio } from "./audio";
import { Input, type Actions } from "./input";
import { loadSave, writeSave, type SaveData } from "./save";

export const WORLD_W = 1280;
export const WORLD_H = 720;
const GROUND_Y = 598;
const PLAYER_X = 248;
const STEP = 1 / 60;
const GRAVITY = 3400;
const JUMP_V = -880;
const JUMP_CUT = 0.55;
const MAX_FALL = 1600;
const SLIDE_TIME = 0.5;
const COYOTE = 0.1;
const BUFFER = 0.13;
const SPEED_START = 410;
const SPEED_MAX = 880;
const PLAYER_W = 42;
const PLAYER_H = 80;
const SLIDE_H = 40;
const SLIDE_GAP = 50;

export type GameState = "title" | "playing" | "dying" | "over";

export type HudSnapshot = {
  state: GameState;
  score: number;
  combo: number;
  comboFlash: number;
  highScore: number;
  distance: number;
  speed: number;
  newBest: boolean;
  bestCombo: number;
  muted: boolean;
  peakCombo: number;
};

type ObstacleKind = "crate" | "spike" | "beam";

type Obstacle = {
  active: boolean;
  kind: ObstacleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  scored: boolean;
  near: boolean;
};

type Coin = {
  active: boolean;
  x: number;
  y: number;
  r: number;
  frame: number;
};

type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  kind: "dust" | "ember" | "spark";
};

type Floater = {
  active: boolean;
  x: number;
  y: number;
  vy: number;
  life: number;
  text: string;
};

type Sprites = {
  run: HTMLImageElement;
  jump: HTMLImageElement;
  slide: HTMLImageElement;
  crate: HTMLImageElement;
  beam: HTMLImageElement;
  spike: HTMLImageElement;
  coin: HTMLImageElement;
  impact: HTMLImageElement;
  sky: HTMLImageElement;
};

export type HudListener = (snap: HudSnapshot) => void;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function aabb(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function drawSheet(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  index: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const fw = img.width / cols;
  const fh = img.height / rows;
  const i = ((index % (cols * rows)) + cols * rows) % (cols * rows);
  const c = i % cols;
  const r = Math.floor(i / cols);
  ctx.drawImage(img, c * fw, r * fh, fw, fh, dx, dy, dw, dh);
}

export class Engine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private input = new Input();
  private audio = new GameAudio();
  private save: SaveData;
  private sprites: Sprites | null = null;
  private ground: HTMLCanvasElement | null = null;
  private onHud: HudListener;
  private raf = 0;
  private acc = 0;
  private lastT = 0;
  private running = false;
  private reduced = false;
  private dpr = 1;
  private viewW = 1;
  private viewH = 1;
  private scale = 1;
  private ox = 0;
  private oy = 0;
  private worldTop = 0;
  private worldBottom = WORLD_H;

  private state: GameState = "title";
  private scroll = 0;
  private distance = 0;
  private speed = SPEED_START;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private comboFlash = 0;
  private peakCombo = 0;
  private newBest = false;
  private lastSpawn = 0;
  private spawnIndex = 0;

  private py = GROUND_Y - PLAYER_H;
  private pvy = 0;
  private grounded = true;
  private coyote = 0;
  private jumpBuf = 0;
  private sliding = false;
  private slideT = 0;
  private jumpHeld = false;
  private squashX = 1;
  private squashY = 1;
  private runFrame = 0;
  private animT = 0;
  private landFlash = 0;
  private hitFlash = 0;
  private hitStop = 0;
  private dieT = 0;
  private trauma = 0;
  private impactFrame = -1;
  private impactT = 0;
  private impactX = 0;
  private impactY = 0;
  private lastFoot = 0;
  private hudKey = "";

  private obstacles: Obstacle[] = [];
  private coins: Coin[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];

  constructor(canvas: HTMLCanvasElement, onHud: HudListener) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.onHud = onHud;
    this.save = loadSave();
    this.audio.muted = this.save.muted;
    this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }

  async init() {
    const [run, jump, slide, crate, beam, spike, coin, impact, sky] = await Promise.all([
      loadImage("/sprites/player-run.png"),
      loadImage("/sprites/player-jump.png"),
      loadImage("/sprites/player-slide.png"),
      loadImage("/sprites/crate.png"),
      loadImage("/sprites/beam.png"),
      loadImage("/sprites/spike.png?v=ember"),
      loadImage("/sprites/coin.png"),
      loadImage("/sprites/impact.png"),
      loadImage("/sprites/sky.jpg"),
    ]);
    this.sprites = { run, jump, slide, crate, beam, spike, coin, impact, sky };
    this.ground = this.makeGround();
    this.input.attach(this.canvas);
    this.resize();
    window.addEventListener("resize", this.resize);
    window.visualViewport?.addEventListener("resize", this.resize);
    document.addEventListener("visibilitychange", this.onVis);
    this.resetWorld(true);
    this.emitHud(true);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.input.detach();
    window.removeEventListener("resize", this.resize);
    window.visualViewport?.removeEventListener("resize", this.resize);
    document.removeEventListener("visibilitychange", this.onVis);
  }

  setMuted(muted: boolean) {
    this.save.muted = muted;
    this.audio.setMuted(muted);
    writeSave(this.save);
    this.emitHud(true);
  }

  tapJump() {
    this.input.tapJump();
  }

  tapSlide() {
    this.input.tapSlide();
  }

  snapshot(): HudSnapshot {
    return {
      state: this.state,
      score: Math.floor(this.score),
      combo: this.combo,
      comboFlash: this.comboFlash,
      highScore: this.save.highScore,
      distance: this.distance,
      speed: this.speed,
      newBest: this.newBest,
      bestCombo: this.save.bestCombo,
      muted: this.save.muted,
      peakCombo: this.peakCombo,
    };
  }

  private onVis = () => {
    if (!document.hidden && this.audio) this.audio.unlock();
  };

  private resize = () => {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = Math.max(1, parent.clientWidth);
    const h = Math.max(1, parent.clientHeight);
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = w;
    this.viewH = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    // Always fill the width so the whole runway stays in frame. Cover-from-
    // left on phones parked the courier on the right edge with no look-ahead.
    // Extra height is painted sky; short windows crop sky and keep the road.
    this.scale = w / WORLD_W;
    this.ox = 0;
    const visH = h / this.scale;
    const portrait = h > w;
    const padBottom = portrait && w < 760 ? 108 / this.scale : 0;
    if (visH >= WORLD_H + padBottom) {
      this.oy = visH - WORLD_H - padBottom;
    } else {
      const groundAt = visH * 0.84;
      this.oy = Math.max(visH - WORLD_H, Math.min(0, groundAt - GROUND_Y));
    }
    this.worldTop = -this.oy;
    this.worldBottom = -this.oy + visH;
  };

  private loop = (now: number) => {
    if (!this.running) return;
    const raw = Math.min(0.1, (now - this.lastT) / 1000);
    this.lastT = now;
    this.acc += raw;
    const actions = this.input.sample();
    this.handleMeta(actions);
    let steps = 0;
    while (this.acc >= STEP && steps < 8) {
      if (this.hitStop > 0) {
        this.hitStop -= STEP;
      } else {
        this.step(STEP, actions);
      }
      this.acc -= STEP;
      steps++;
    }
    this.render(this.acc / STEP);
    this.raf = requestAnimationFrame(this.loop);
  };

  private handleMeta(a: Actions) {
    if (this.state === "title" && a.confirmPressed) {
      this.audio.unlock();
      this.audio.setMuted(this.save.muted);
      this.beginRun();
    } else if (this.state === "over" && a.confirmPressed) {
      this.audio.unlock();
      this.beginRun();
    }
  }

  private beginRun() {
    this.resetWorld(false);
    this.state = "playing";
    this.emitHud(true);
  }

  private resetWorld(title: boolean) {
    this.state = title ? "title" : "playing";
    this.scroll = 0;
    this.distance = 0;
    this.speed = title ? 220 : SPEED_START;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboFlash = 0;
    this.peakCombo = 0;
    this.newBest = false;
    this.lastSpawn = title ? 99999 : 720;
    this.spawnIndex = 0;
    this.py = GROUND_Y - PLAYER_H;
    this.pvy = 0;
    this.grounded = true;
    this.coyote = 0;
    this.jumpBuf = 0;
    this.sliding = false;
    this.slideT = 0;
    this.jumpHeld = false;
    this.squashX = 1;
    this.squashY = 1;
    this.runFrame = 0;
    this.animT = 0;
    this.landFlash = 0;
    this.hitFlash = 0;
    this.hitStop = 0;
    this.dieT = 0;
    this.trauma = 0;
    this.impactFrame = -1;
    this.forEachPool(this.obstacles, (o) => {
      o.active = false;
    });
    this.forEachPool(this.coins, (c) => {
      c.active = false;
    });
    this.forEachPool(this.particles, (p) => {
      p.active = false;
    });
    this.forEachPool(this.floaters, (f) => {
      f.active = false;
    });
  }

  private step(dt: number, a: Actions) {
    if (this.state === "over") return;

    if (this.state === "dying") {
      this.dieT += dt;
      this.pvy += GRAVITY * dt;
      this.py += this.pvy * dt;
      this.trauma = Math.max(this.trauma - dt * 1.6, 0);
      this.hitFlash = Math.max(this.hitFlash - dt, 0);
      this.updateFx(dt);
      if (this.dieT > 0.85) {
        this.finishRun();
      }
      return;
    }

    const playing = this.state === "playing";
    if (playing) {
      this.speed = SPEED_START + (SPEED_MAX - SPEED_START) * (1 - Math.exp(-this.distance / 2400));
    }
    this.scroll += this.speed * dt;
    if (playing) {
      this.distance += this.speed * dt;
      this.score += this.speed * dt * 0.085;
    }

    this.updatePlayer(dt, a, playing);
    if (playing) {
      this.spawnAhead();
      this.updateObstacles(dt);
      this.updateCoins();
    }
    this.updateFx(dt);

    this.comboFlash = Math.max(0, this.comboFlash - dt);
    this.landFlash = Math.max(0, this.landFlash - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }
    this.trauma = Math.max(this.trauma - dt * 1.8, 0);
    this.emitHud(false);
  }

  private ph() {
    return this.sliding ? SLIDE_H : PLAYER_H;
  }

  private updatePlayer(dt: number, a: Actions, playing: boolean) {
    if (a.jumpPressed) this.jumpBuf = BUFFER;
    else this.jumpBuf = Math.max(0, this.jumpBuf - dt);

    const wantSlide = a.slidePressed || (a.slideHeld && this.grounded && !this.sliding);
    if (playing && wantSlide && this.grounded && !this.sliding) {
      this.sliding = true;
      this.slideT = SLIDE_TIME;
      this.audio.slide();
      this.burst(PLAYER_X + 20, GROUND_Y - 8, 8, "dust");
    }

    if (this.sliding) {
      this.slideT -= dt;
      if (this.slideT <= 0 || a.jumpPressed) {
        this.sliding = false;
        this.py = GROUND_Y - PLAYER_H;
      }
    }

    const canJump = (this.grounded || this.coyote > 0) && !this.sliding;
    if (playing && this.jumpBuf > 0 && canJump) {
      this.pvy = JUMP_V;
      this.grounded = false;
      this.coyote = 0;
      this.jumpBuf = 0;
      this.jumpHeld = true;
      this.squashX = 0.86;
      this.squashY = 1.2;
      this.audio.jump();
      this.burst(PLAYER_X + 16, GROUND_Y - 6, 10, "dust");
    }
    if (this.jumpHeld && !a.jumpHeld) {
      if (!this.grounded && this.pvy < 0) this.pvy *= JUMP_CUT;
      this.jumpHeld = false;
    }

    if (!this.grounded) {
      this.pvy = Math.min(MAX_FALL, this.pvy + GRAVITY * dt);
      this.py += this.pvy * dt;
      this.coyote = Math.max(0, this.coyote - dt);
    }

    const h = this.ph();
    if (this.py + h >= GROUND_Y) {
      if (!this.grounded) {
        this.squashX = 1.18;
        this.squashY = 0.8;
        this.landFlash = 0.12;
        if (playing) this.audio.land();
        this.burst(PLAYER_X + 18, GROUND_Y - 4, 12, "dust");
      }
      this.py = GROUND_Y - h;
      this.pvy = 0;
      this.grounded = true;
      this.coyote = COYOTE;
    } else {
      this.grounded = false;
    }

    if (this.sliding) this.py = GROUND_Y - SLIDE_H;

    this.squashX += (1 - this.squashX) * (1 - Math.exp(-12 * dt));
    this.squashY += (1 - this.squashY) * (1 - Math.exp(-12 * dt));

    this.animT += dt;
    if (this.grounded && !this.sliding) {
      const cadence = this.speed / 70;
      this.runFrame += cadence * dt;
      const f = Math.floor(this.runFrame);
      if (f !== this.lastFoot && f % 3 === 0) {
        this.lastFoot = f;
        if (playing) this.audio.foot();
        this.burst(PLAYER_X + 10, GROUND_Y - 4, 2, "dust");
      }
    }
  }

  private spawnAhead() {
    const density = clamp((this.distance - 180) / 4200, 0, 1);
    const ahead = WORLD_W + this.speed * 0.35;
    const minGap = this.speed * lerp(0.88, 0.54, density) + 70;
    const maxGap = this.speed * lerp(1.6, 0.82, density) + 90;
    while (this.lastSpawn < this.scroll + ahead) {
      const gap = minGap + Math.random() * (maxGap - minGap);
      this.lastSpawn += gap;
      this.placePattern(this.lastSpawn, density);
      this.spawnIndex++;
    }
  }

  private placePattern(x: number, density: number) {
    const roll = Math.random();
    const late = density > 0.45;
    if (late && roll < 0.12) {
      this.spawnLow(x);
      this.spawnHigh(x + this.speed * 0.7);
      this.lastSpawn += this.speed * 0.7;
    } else if (late && roll < 0.22) {
      this.spawnHigh(x);
      this.spawnLow(x + this.speed * 0.78);
      this.lastSpawn += this.speed * 0.78;
    } else if (roll < lerp(0.12, 0.38, density)) {
      this.spawnHigh(x);
    } else if (roll < lerp(0.55, 0.7, density)) {
      this.spawnLow(x, "spike");
    } else {
      this.spawnLow(x, "crate");
    }
  }

  private spawnLow(x: number, kind: "crate" | "spike" = Math.random() < 0.4 ? "spike" : "crate") {
    const w = kind === "spike" ? 50 : 70;
    const h = kind === "spike" ? 58 : 76;
    this.addObstacle(kind, x, GROUND_Y - h, w, h);
    if (Math.random() < 0.7) {
      const peak = GROUND_Y - h - 90 - Math.random() * 40;
      for (let i = 0; i < 3; i++) {
        const t = i / 2;
        const arc = Math.sin(t * Math.PI);
        this.addCoin(x + 10 + i * 28, lerp(GROUND_Y - h - 36, peak, arc));
      }
    }
  }

  private spawnHigh(x: number) {
    const h = 240;
    const y = GROUND_Y - SLIDE_GAP - h;
    this.addObstacle("beam", x, y, 86, h);
    if (Math.random() < 0.75) {
      this.addCoin(x + 18, GROUND_Y - 28);
      this.addCoin(x + 48, GROUND_Y - 28);
    }
  }

  private addObstacle(kind: ObstacleKind, x: number, y: number, w: number, h: number) {
    const o = this.alloc(this.obstacles, () => ({
      active: false,
      kind: "crate" as ObstacleKind,
      x: 0,
      y: 0,
      w: 0,
      h: 0,
      scored: false,
      near: false,
    }));
    o.active = true;
    o.kind = kind;
    o.x = x;
    o.y = y;
    o.w = w;
    o.h = h;
    o.scored = false;
    o.near = false;
  }

  private addCoin(x: number, y: number) {
    const c = this.alloc(this.coins, () => ({ active: false, x: 0, y: 0, r: 14, frame: 0 }));
    c.active = true;
    c.x = x;
    c.y = y;
    c.r = 14;
    c.frame = Math.random() * 4;
  }

  private updateObstacles(dt: number) {
    const px = this.scroll + PLAYER_X;
    const py = this.py;
    const pw = PLAYER_W;
    const ph = this.ph();
    const sub = this.speed > 700 ? 2 : 1;
    const sdt = dt / sub;

    for (let s = 0; s < sub; s++) {
      for (const o of this.obstacles) {
        if (!o.active) continue;
        if (aabb(px, py, pw, ph, o.x, o.y, o.w, o.h)) {
          this.kill(o);
          return;
        }
      }
    }

    for (const o of this.obstacles) {
      if (!o.active) continue;
      if (!o.near) {
        const closeX = Math.abs(px + pw / 2 - (o.x + o.w / 2)) < o.w / 2 + 18;
        let closeY = false;
        if (o.kind === "beam") {
          closeY = py < o.y + o.h + 16 && py + ph > o.y;
        } else {
          closeY = py + ph > o.y - 16 && py < o.y + o.h;
        }
        if (closeX && closeY && !aabb(px, py, pw, ph, o.x, o.y - 10, o.w, o.h + 14)) {
          o.near = true;
        }
      }
      if (!o.scored && o.x + o.w < px) {
        o.scored = true;
        this.onClear(o);
      }
      if (o.x + o.w < this.scroll - 80) o.active = false;
    }
    void sdt;
  }

  private updateCoins() {
    const px = this.scroll + PLAYER_X;
    const py = this.py;
    const pw = PLAYER_W;
    const ph = this.ph();
    for (const c of this.coins) {
      if (!c.active) continue;
      c.frame += 0.12;
      if (aabb(px, py, pw, ph, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) {
        c.active = false;
        const pts = 35 * Math.max(1, this.combo);
        this.score += pts;
        this.audio.coin();
        this.float(c.x - this.scroll, c.y, `+${pts}`);
        this.burst(c.x - this.scroll, c.y, 6, "ember");
      } else if (c.x < this.scroll - 40) {
        c.active = false;
      }
    }
  }

  private onClear(o: Obstacle) {
    this.combo += 1;
    if (o.near) this.combo += 1;
    this.comboTimer = 2.5;
    this.comboFlash = 0.35;
    this.peakCombo = Math.max(this.peakCombo, this.combo);
    const pts = (o.near ? 40 : 16) * this.combo;
    this.score += pts;
    this.audio.combo();
    this.float(PLAYER_X + 70, this.py, o.near ? `NEAR +${pts}` : `+${pts}`);
  }

  private kill(o: Obstacle) {
    this.state = "dying";
    this.dieT = 0;
    this.hitStop = this.reduced ? 0.02 : 0.09;
    this.hitFlash = 0.35;
    this.trauma = this.reduced ? 0.15 : 0.85;
    this.pvy = -220;
    this.sliding = false;
    this.impactFrame = 0;
    this.impactT = 0;
    this.impactX = PLAYER_X + 24;
    this.impactY = this.py + this.ph() * 0.5;
    this.audio.hit();
    this.burst(this.impactX, this.impactY, 22, "spark");
    this.burst(this.impactX, this.impactY, 14, "dust");
    void o;
    this.emitHud(true);
  }

  private finishRun() {
    this.state = "over";
    const s = Math.floor(this.score);
    this.newBest = s > this.save.highScore;
    this.save.highScore = Math.max(this.save.highScore, s);
    this.save.bestCombo = Math.max(this.save.bestCombo, this.peakCombo);
    this.save.bestDistance = Math.max(this.save.bestDistance, this.distance);
    writeSave(this.save);
    this.emitHud(true);
  }

  private updateFx(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      if (p.life <= 0) p.active = false;
    }
    for (const f of this.floaters) {
      if (!f.active) continue;
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 0.96;
      if (f.life <= 0) f.active = false;
    }
    if (this.impactFrame >= 0) {
      this.impactT += dt;
      if (this.impactT > 0.06) {
        this.impactT = 0;
        this.impactFrame++;
        if (this.impactFrame > 3) this.impactFrame = -1;
      }
    }
  }

  private burst(x: number, y: number, n: number, kind: Particle["kind"]) {
    for (let i = 0; i < n; i++) {
      const p = this.alloc(this.particles, () => ({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        max: 0,
        size: 2,
        kind: "dust" as const,
      }));
      p.active = true;
      p.x = x;
      p.y = y;
      p.kind = kind;
      const ang = Math.random() * Math.PI * 2;
      const sp = kind === "spark" ? 180 + Math.random() * 280 : 40 + Math.random() * 120;
      p.vx = Math.cos(ang) * sp - this.speed * 0.15;
      p.vy = Math.sin(ang) * sp - 40;
      p.max = 0.25 + Math.random() * 0.45;
      p.life = p.max;
      p.size = kind === "ember" ? 3 + Math.random() * 3 : 2 + Math.random() * 3;
    }
  }

  private float(x: number, y: number, text: string) {
    const f = this.alloc(this.floaters, () => ({
      active: false,
      x: 0,
      y: 0,
      vy: 0,
      life: 0,
      text: "",
    }));
    f.active = true;
    f.x = x;
    f.y = y;
    f.vy = -48;
    f.life = 0.7;
    f.text = text;
  }

  private alloc<T>(pool: T[], make: () => T): T {
    for (const item of pool) {
      if (!(item as { active: boolean }).active) return item;
    }
    const n = make();
    pool.push(n);
    return n;
  }

  private forEachPool<T>(pool: T[], fn: (item: T) => void) {
    for (const item of pool) fn(item);
  }

  private emitHud(force: boolean) {
    const snap = this.snapshot();
    const key = `${snap.state}|${snap.score}|${snap.combo}|${snap.muted}|${snap.newBest}|${Math.round(snap.comboFlash * 10)}`;
    if (!force && key === this.hudKey) return;
    this.hudKey = key;
    this.onHud(snap);
  }

  private makeGround() {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 160;
    const g = c.getContext("2d");
    if (!g) return c;
    g.fillStyle = "#161310";
    g.fillRect(0, 0, 256, 160);
    g.fillStyle = "#1c1914";
    g.fillRect(0, 0, 256, 18);
    g.strokeStyle = "rgba(196,92,74,0.18)";
    g.lineWidth = 1;
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      const x = (i * 37) % 256;
      g.moveTo(x, 6);
      g.lineTo(x + 40, 22 + (i % 5) * 8);
      g.stroke();
    }
    g.fillStyle = "rgba(0,0,0,0.35)";
    for (let i = 0; i < 20; i++) {
      g.fillRect((i * 53) % 256, 24 + (i * 13) % 120, 3 + (i % 4), 2);
    }
    g.fillStyle = "#0e0d0c";
    g.fillRect(0, 148, 256, 12);
    return c;
  }

  private render(_alpha: number) {
    const ctx = this.ctx;
    const spr = this.sprites;
    const { dpr, scale, ox, oy } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0c0c0d";
    ctx.fillRect(0, 0, this.viewW, this.viewH);

    let shakeX = 0;
    let shakeY = 0;
    if (this.trauma > 0 && !this.reduced) {
      const mag = this.trauma * this.trauma * 14;
      shakeX = (Math.random() * 2 - 1) * mag;
      shakeY = (Math.random() * 2 - 1) * mag;
    }

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, shakeX * dpr, shakeY * dpr);
    ctx.translate(ox, oy);

    this.drawSky(ctx, spr);
    this.drawMid(ctx);
    this.drawGround(ctx);
    this.drawCoins(ctx, spr);
    this.drawObstacles(ctx, spr);
    this.drawPlayer(ctx, spr);
    this.drawParticles(ctx);
    this.drawImpact(ctx, spr);
    this.drawFloaters(ctx);
    this.drawVignette(ctx);

    if (this.hitFlash > 0) {
      ctx.fillStyle = `rgba(243,242,239,${this.hitFlash * 0.28})`;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  }

  private drawSky(ctx: CanvasRenderingContext2D, spr: Sprites | null) {
    const top = this.worldTop;
    const height = GROUND_Y - top;
    if (spr) {
      const img = spr.sky;
      const extra = 0.18;
      const dw = WORLD_W * (1 + extra);
      const maxPan = Math.max(1, dw - WORLD_W);
      const t = (this.scroll * 0.02) % (maxPan * 2);
      const pan = t < maxPan ? t : maxPan * 2 - t;
      ctx.drawImage(img, -pan, top, dw, height);
    } else {
      ctx.fillStyle = "#1a1520";
      ctx.fillRect(0, top, WORLD_W, height);
    }
  }

  private drawMid(ctx: CanvasRenderingContext2D) {
    const par = this.scroll * 0.28;
    ctx.fillStyle = "rgba(8,8,10,0.55)";
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y - 40);
    for (let x = 0; x <= WORLD_W + 80; x += 40) {
      const wx = x + par;
      const h = 70 + Math.sin(wx * 0.01) * 28 + Math.sin(wx * 0.023) * 18;
      ctx.lineTo(x, GROUND_Y - 30 - h);
    }
    ctx.lineTo(WORLD_W, GROUND_Y);
    ctx.lineTo(0, GROUND_Y);
    ctx.closePath();
    ctx.fill();
  }

  private drawGround(ctx: CanvasRenderingContext2D) {
    if (this.ground) {
      const patX = -((this.scroll * 1) % this.ground.width);
      ctx.save();
      ctx.translate(patX, GROUND_Y);
      const pattern = ctx.createPattern(this.ground, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(-patX, 0, WORLD_W - patX + 256, this.worldBottom - GROUND_Y + 80);
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "#1a1714";
      ctx.fillRect(0, GROUND_Y, WORLD_W, this.worldBottom - GROUND_Y + 40);
    }
    ctx.fillStyle = "rgba(196,92,74,0.35)";
    ctx.fillRect(0, GROUND_Y, WORLD_W, 2);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D, spr: Sprites | null) {
    const h = this.ph();
    const visW = this.sliding ? 118 : 96;
    const visH = this.sliding ? 72 : 118;
    const dx = PLAYER_X + PLAYER_W / 2;
    const feetY = this.py + h;
    ctx.save();
    ctx.translate(dx, feetY);
    ctx.scale(this.squashX, this.squashY);
    ctx.translate(-visW * 0.45, -visH);

    if (this.state === "dying") {
      ctx.rotate(-0.35);
      ctx.globalAlpha = clamp(1 - this.dieT * 0.7, 0.2, 1);
    }

    if (spr) {
      if (this.sliding) {
        const fi = Math.min(3, Math.floor((1 - this.slideT / SLIDE_TIME) * 4));
        drawSheet(ctx, spr.slide, 2, 2, fi, 0, 0, visW, visH);
      } else if (!this.grounded || this.state === "dying") {
        const fi = this.pvy < -200 ? 1 : this.pvy < 80 ? 2 : 3;
        drawSheet(ctx, spr.jump, 2, 2, fi, 0, 0, visW, visH);
      } else {
        const fi = Math.floor(this.runFrame) % 6;
        drawSheet(ctx, spr.run, 3, 2, fi, 0, 0, visW, visH);
      }
    } else {
      ctx.fillStyle = "#c9cdd4";
      ctx.fillRect(20, 10, 40, visH - 16);
    }

    if (this.hitFlash > 0.18) {
      ctx.globalCompositeOperation = "source-atop";
      ctx.fillStyle = `rgba(243,242,239,${this.hitFlash})`;
      ctx.fillRect(0, 0, visW, visH);
    }
    ctx.restore();

    if (this.landFlash > 0) {
      ctx.fillStyle = `rgba(243,242,239,${this.landFlash * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(PLAYER_X + 22, GROUND_Y - 2, 28 + (0.12 - this.landFlash) * 80, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawObstacles(ctx: CanvasRenderingContext2D, spr: Sprites | null) {
    for (const o of this.obstacles) {
      if (!o.active) continue;
      const sx = o.x - this.scroll;
      if (sx > WORLD_W + 40 || sx + o.w < -80) continue;
      if (!spr) {
        if (o.kind === "spike") this.drawSpikeHazard(ctx, sx, o.y, o.w, o.h);
        else {
          ctx.fillStyle = "#3a342c";
          ctx.fillRect(sx, o.y, o.w, o.h);
        }
        continue;
      }
      if (o.kind === "crate") {
        ctx.drawImage(spr.crate, sx - 18, o.y - 22, o.w + 36, o.h + 28);
      } else if (o.kind === "spike") {
        this.drawSpikeHazard(ctx, sx, o.y, o.w, o.h);
      } else {
        ctx.drawImage(spr.beam, sx - 28, o.y - 8, o.w + 56, o.h + 24);
      }
    }
  }

  private drawSpikeHazard(
    ctx: CanvasRenderingContext2D,
    sx: number,
    y: number,
    w: number,
    h: number,
  ) {
    const mid = sx + w * 0.5;
    const base = y + h;
    ctx.save();
    ctx.fillStyle = "rgba(232, 150, 56, 0.55)";
    ctx.beginPath();
    ctx.ellipse(mid, base + 1, w * 0.78, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    const spr = this.sprites;
    if (spr?.spike) {
      ctx.shadowColor = "rgba(255, 186, 74, 0.9)";
      ctx.shadowBlur = 14;
      ctx.drawImage(spr.spike, sx - 16, y - 14, w + 32, h + 20);
    } else {
      const fangs = [
        { t: 0.22, hh: 0.74, hw: 0.28 },
        { t: 0.5, hh: 1, hw: 0.36 },
        { t: 0.78, hh: 0.66, hw: 0.26 },
      ];
      for (const f of fangs) {
        const cx = sx + w * f.t;
        const top = base - h * f.hh;
        const hw = w * f.hw;
        const g = ctx.createLinearGradient(cx, top, cx, base);
        g.addColorStop(0, "#f7e7c6");
        g.addColorStop(0.25, "#f0b45a");
        g.addColorStop(0.65, "#d46824");
        g.addColorStop(1, "#7a2c14");
        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(cx + hw, base);
        ctx.lineTo(cx - hw, base);
        ctx.closePath();
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = "#f4e4c4";
        ctx.lineWidth = 2.4;
        ctx.lineJoin = "round";
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  private drawCoins(ctx: CanvasRenderingContext2D, spr: Sprites | null) {
    for (const c of this.coins) {
      if (!c.active) continue;
      const sx = c.x - this.scroll;
      if (sx < -40 || sx > WORLD_W + 40) continue;
      const bob = Math.sin(this.animT * 6 + c.x * 0.02) * 4;
      if (spr) {
        drawSheet(ctx, spr.coin, 2, 2, Math.floor(c.frame) % 4, sx - 18, c.y + bob - 18, 36, 36);
      } else {
        ctx.fillStyle = "#c9cdd4";
        ctx.beginPath();
        ctx.arc(sx, c.y + bob, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      if (!p.active) continue;
      const a = p.life / p.max;
      if (p.kind === "ember") ctx.fillStyle = `rgba(196,92,74,${a})`;
      else if (p.kind === "spark") ctx.fillStyle = `rgba(243,242,239,${a})`;
      else ctx.fillStyle = `rgba(90,82,72,${a * 0.8})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  private drawImpact(ctx: CanvasRenderingContext2D, spr: Sprites | null) {
    if (this.impactFrame < 0 || !spr) return;
    drawSheet(ctx, spr.impact, 2, 2, this.impactFrame, this.impactX - 64, this.impactY - 64, 128, 128);
  }

  private drawFloaters(ctx: CanvasRenderingContext2D) {
    ctx.font = "600 16px 'IBM Plex Sans', sans-serif";
    ctx.textAlign = "center";
    for (const f of this.floaters) {
      if (!f.active) continue;
      ctx.fillStyle = `rgba(243,242,239,${clamp(f.life * 2, 0, 1)})`;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.textAlign = "left";
  }

  private drawVignette(ctx: CanvasRenderingContext2D) {
    const g = ctx.createRadialGradient(
      WORLD_W * 0.45,
      WORLD_H * 0.45,
      WORLD_H * 0.2,
      WORLD_W * 0.5,
      WORLD_H * 0.5,
      WORLD_W * 0.72,
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = g;
    ctx.fillRect(0, this.worldTop, WORLD_W, this.worldBottom - this.worldTop);
  }
}
