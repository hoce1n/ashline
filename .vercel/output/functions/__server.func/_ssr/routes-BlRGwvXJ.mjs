import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as ArrowDown, i as ArrowUp, n as Volume2, t as VolumeX } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BlRGwvXJ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			ghost: "bg-transparent text-fg hover:bg-surface-2",
			outline: "border border-border bg-transparent text-fg hover:bg-surface-2"
		},
		size: {
			default: "h-11 rounded-[20px] px-5 text-sm",
			lg: "h-12 rounded-[24px] px-7 text-base",
			icon: "size-11 rounded-full"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var GameAudio = class {
	ctx = null;
	master = null;
	sfx = null;
	muted = false;
	unlock() {
		if (!this.ctx) {
			const Ctx = window.AudioContext || window.webkitAudioContext;
			this.ctx = new Ctx({ latencyHint: "interactive" });
			this.master = this.ctx.createGain();
			this.sfx = this.ctx.createGain();
			this.sfx.gain.value = .7;
			this.sfx.connect(this.master);
			this.master.connect(this.ctx.destination);
			this.applyMute();
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(muted) {
		this.muted = muted;
		this.applyMute();
	}
	applyMute() {
		if (!this.master || !this.ctx) return;
		this.master.gain.setTargetAtTime(this.muted ? 0 : 1, this.ctx.currentTime, .02);
	}
	env(duration, peak = .2) {
		if (!this.ctx || !this.sfx) return null;
		const g = this.ctx.createGain();
		const t = this.ctx.currentTime;
		g.gain.setValueAtTime(1e-4, t);
		g.gain.exponentialRampToValueAtTime(peak, t + .012);
		g.gain.exponentialRampToValueAtTime(1e-4, t + duration);
		g.connect(this.sfx);
		return {
			g,
			t
		};
	}
	noise(duration) {
		if (!this.ctx) return null;
		const n = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
		const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
		const src = this.ctx.createBufferSource();
		src.buffer = buf;
		return src;
	}
	jump() {
		if (!this.ctx || !this.sfx) return;
		const e = this.env(.14, .12);
		if (!e) return;
		const osc = this.ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(420 + Math.random() * 30, e.t);
		osc.frequency.exponentialRampToValueAtTime(180, e.t + .12);
		osc.connect(e.g);
		osc.start(e.t);
		osc.stop(e.t + .14);
	}
	land() {
		if (!this.ctx || !this.sfx) return;
		const e = this.env(.12, .16);
		if (!e) return;
		const src = this.noise(.12);
		if (!src) return;
		const f = this.ctx.createBiquadFilter();
		f.type = "lowpass";
		f.frequency.value = 420;
		src.connect(f);
		f.connect(e.g);
		src.start(e.t);
	}
	slide() {
		if (!this.ctx || !this.sfx) return;
		const e = this.env(.22, .08);
		if (!e) return;
		const src = this.noise(.22);
		if (!src) return;
		const f = this.ctx.createBiquadFilter();
		f.type = "bandpass";
		f.frequency.setValueAtTime(900, e.t);
		f.frequency.exponentialRampToValueAtTime(280, e.t + .2);
		src.connect(f);
		f.connect(e.g);
		src.start(e.t);
	}
	coin() {
		if (!this.ctx || !this.sfx) return;
		const e = this.env(.16, .1);
		if (!e) return;
		const a = this.ctx.createOscillator();
		const b = this.ctx.createOscillator();
		a.type = "sine";
		b.type = "sine";
		const det = 1 + (Math.random() * 2 - 1) * .03;
		a.frequency.setValueAtTime(880 * det, e.t);
		b.frequency.setValueAtTime(1320 * det, e.t);
		a.connect(e.g);
		b.connect(e.g);
		a.start(e.t);
		b.start(e.t);
		a.stop(e.t + .16);
		b.stop(e.t + .16);
	}
	hit() {
		if (!this.ctx || !this.sfx) return;
		const e = this.env(.28, .22);
		if (!e) return;
		const src = this.noise(.28);
		const osc = this.ctx.createOscillator();
		if (!src) return;
		osc.type = "sawtooth";
		osc.frequency.setValueAtTime(140, e.t);
		osc.frequency.exponentialRampToValueAtTime(40, e.t + .24);
		const f = this.ctx.createBiquadFilter();
		f.type = "lowpass";
		f.frequency.value = 700;
		src.connect(f);
		f.connect(e.g);
		osc.connect(e.g);
		src.start(e.t);
		osc.start(e.t);
		osc.stop(e.t + .28);
	}
	combo() {
		if (!this.ctx || !this.sfx) return;
		const e = this.env(.18, .09);
		if (!e) return;
		const osc = this.ctx.createOscillator();
		osc.type = "triangle";
		osc.frequency.setValueAtTime(523, e.t);
		osc.frequency.setValueAtTime(784, e.t + .06);
		osc.connect(e.g);
		osc.start(e.t);
		osc.stop(e.t + .18);
	}
	foot() {
		if (!this.ctx || !this.sfx) return;
		const e = this.env(.05, .04);
		if (!e) return;
		const src = this.noise(.05);
		if (!src) return;
		const f = this.ctx.createBiquadFilter();
		f.type = "lowpass";
		f.frequency.value = 280 + Math.random() * 80;
		src.playbackRate.value = .8 + Math.random() * .4;
		src.connect(f);
		f.connect(e.g);
		src.start(e.t);
	}
};
var JUMP_CODES = /* @__PURE__ */ new Set([
	"Space",
	"ArrowUp",
	"KeyW",
	"KeyZ"
]);
var SLIDE_CODES = /* @__PURE__ */ new Set([
	"ArrowDown",
	"KeyS",
	"KeyX",
	"ControlLeft",
	"ControlRight"
]);
var CONFIRM_CODES = /* @__PURE__ */ new Set([
	"Space",
	"Enter",
	"KeyW",
	"ArrowUp"
]);
var Input = class {
	keys = /* @__PURE__ */ new Set();
	prevJump = false;
	prevSlide = false;
	prevConfirm = false;
	jumpTap = false;
	slideTap = false;
	confirmTap = false;
	pointerId = null;
	startY = 0;
	startX = 0;
	startT = 0;
	swiped = false;
	el = null;
	attach(el) {
		this.el = el;
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.onBlur);
		document.addEventListener("visibilitychange", this.onVis);
		el.addEventListener("pointerdown", this.onPointerDown);
		el.addEventListener("pointermove", this.onPointerMove);
		el.addEventListener("pointerup", this.onPointerUp);
		el.addEventListener("pointercancel", this.onPointerUp);
	}
	detach() {
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.onBlur);
		document.removeEventListener("visibilitychange", this.onVis);
		this.el?.removeEventListener("pointerdown", this.onPointerDown);
		this.el?.removeEventListener("pointermove", this.onPointerMove);
		this.el?.removeEventListener("pointerup", this.onPointerUp);
		this.el?.removeEventListener("pointercancel", this.onPointerUp);
		this.el = null;
	}
	tapJump() {
		this.jumpTap = true;
		this.confirmTap = true;
	}
	tapSlide() {
		this.slideTap = true;
	}
	sample() {
		let jumpHeld = this.keysHas(JUMP_CODES) || this.jumpTap;
		let slideHeld = this.keysHas(SLIDE_CODES) || this.slideTap;
		let confirmHeld = this.keysHas(CONFIRM_CODES) || this.confirmTap;
		const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : [];
		if (pads) for (const pad of pads) {
			if (!pad) continue;
			if (pad.buttons[0]?.pressed) {
				jumpHeld = true;
				confirmHeld = true;
			}
			if (pad.buttons[1]?.pressed || pad.buttons[5]?.pressed) slideHeld = true;
			if (pad.buttons[12]?.pressed) jumpHeld = true;
			if (pad.buttons[13]?.pressed) slideHeld = true;
			if (pad.buttons[9]?.pressed) confirmHeld = true;
		}
		const jumpPressed = jumpHeld && !this.prevJump;
		const slidePressed = slideHeld && !this.prevSlide;
		const confirmPressed = confirmHeld && !this.prevConfirm;
		this.prevJump = jumpHeld;
		this.prevSlide = slideHeld;
		this.prevConfirm = confirmHeld;
		this.jumpTap = false;
		this.slideTap = false;
		this.confirmTap = false;
		return {
			jumpHeld,
			jumpPressed,
			slideHeld,
			slidePressed,
			confirmPressed
		};
	}
	keysHas(codes) {
		for (const c of codes) if (this.keys.has(c)) return true;
		return false;
	}
	onKeyDown = (e) => {
		if (e.repeat) return;
		this.keys.add(e.code);
		if (JUMP_CODES.has(e.code) || SLIDE_CODES.has(e.code) || e.code === "Enter") e.preventDefault();
	};
	onKeyUp = (e) => {
		this.keys.delete(e.code);
	};
	onBlur = () => {
		this.keys.clear();
		this.pointerId = null;
	};
	onVis = () => {
		if (document.hidden) this.keys.clear();
	};
	onPointerDown = (e) => {
		if (e.button !== 0) return;
		this.pointerId = e.pointerId;
		this.startY = e.clientY;
		this.startX = e.clientX;
		this.startT = performance.now();
		this.swiped = false;
		this.el?.setPointerCapture(e.pointerId);
	};
	onPointerMove = (e) => {
		if (this.pointerId !== e.pointerId) return;
		const dy = e.clientY - this.startY;
		if (!this.swiped && dy > 48 && Math.abs(e.clientX - this.startX) < 90) {
			this.swiped = true;
			this.slideTap = true;
		}
	};
	onPointerUp = (e) => {
		if (this.pointerId !== e.pointerId) return;
		const dt = performance.now() - this.startT;
		const dy = e.clientY - this.startY;
		if (!this.swiped && dt < 420 && dy < 36) {
			this.jumpTap = true;
			this.confirmTap = true;
		}
		this.pointerId = null;
	};
};
var KEY = "ashline-save-v1";
var SAVE_VERSION = 1;
var defaults = {
	version: SAVE_VERSION,
	highScore: 0,
	bestCombo: 0,
	bestDistance: 0,
	muted: false
};
function migrate(raw) {
	return {
		...defaults,
		...raw,
		version: SAVE_VERSION,
		highScore: Math.max(0, Number(raw.highScore) || 0),
		bestCombo: Math.max(0, Number(raw.bestCombo) || 0),
		bestDistance: Math.max(0, Number(raw.bestDistance) || 0),
		muted: Boolean(raw.muted)
	};
}
function loadSave() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return { ...defaults };
		return migrate(JSON.parse(raw));
	} catch {
		return { ...defaults };
	}
}
function writeSave(data) {
	try {
		localStorage.setItem(KEY, JSON.stringify({
			...data,
			version: SAVE_VERSION
		}));
	} catch {}
}
var WORLD_W = 1280;
var GROUND_Y = 598;
var PLAYER_X = 248;
var STEP = 1 / 60;
var GRAVITY = 2650;
var JUMP_V = -980;
var JUMP_CUT = .42;
var MAX_FALL = 1500;
var SLIDE_TIME = .5;
var COYOTE = .1;
var BUFFER = .13;
var SPEED_START = 410;
var PLAYER_W = 42;
var PLAYER_H = 80;
var SLIDE_H = 40;
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function lerp(a, b, t) {
	return a + (b - a) * t;
}
function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
	return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error(`Failed to load ${src}`));
		img.src = src;
	});
}
function drawSheet(ctx, img, cols, rows, index, dx, dy, dw, dh) {
	const fw = img.width / cols;
	const fh = img.height / rows;
	const i = (index % (cols * rows) + cols * rows) % (cols * rows);
	const c = i % cols;
	const r = Math.floor(i / cols);
	ctx.drawImage(img, c * fw, r * fh, fw, fh, dx, dy, dw, dh);
}
var Engine = class {
	canvas;
	ctx;
	input = new Input();
	audio = new GameAudio();
	save;
	sprites = null;
	ground = null;
	onHud;
	raf = 0;
	acc = 0;
	lastT = 0;
	running = false;
	reduced = false;
	dpr = 1;
	viewW = 1;
	viewH = 1;
	scale = 1;
	ox = 0;
	oy = 0;
	state = "title";
	scroll = 0;
	distance = 0;
	speed = SPEED_START;
	score = 0;
	combo = 0;
	comboTimer = 0;
	comboFlash = 0;
	peakCombo = 0;
	newBest = false;
	lastSpawn = 0;
	spawnIndex = 0;
	py = 518;
	pvy = 0;
	grounded = true;
	coyote = 0;
	jumpBuf = 0;
	sliding = false;
	slideT = 0;
	jumpHeld = false;
	squashX = 1;
	squashY = 1;
	runFrame = 0;
	animT = 0;
	landFlash = 0;
	hitFlash = 0;
	hitStop = 0;
	dieT = 0;
	trauma = 0;
	impactFrame = -1;
	impactT = 0;
	impactX = 0;
	impactY = 0;
	lastFoot = 0;
	hudKey = "";
	obstacles = [];
	coins = [];
	particles = [];
	floaters = [];
	constructor(canvas, onHud) {
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
			loadImage("/sprites/spike.png"),
			loadImage("/sprites/coin.png"),
			loadImage("/sprites/impact.png"),
			loadImage("/sprites/sky.jpg")
		]);
		this.sprites = {
			run,
			jump,
			slide,
			crate,
			beam,
			spike,
			coin,
			impact,
			sky
		};
		this.ground = this.makeGround();
		this.input.attach(this.canvas);
		this.resize();
		window.addEventListener("resize", this.resize);
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
		document.removeEventListener("visibilitychange", this.onVis);
	}
	setMuted(muted) {
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
	snapshot() {
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
			peakCombo: this.peakCombo
		};
	}
	onVis = () => {
		if (!document.hidden && this.audio) this.audio.unlock();
	};
	resize = () => {
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
		this.scale = Math.max(w / WORLD_W, h / 720);
		this.ox = (w / this.scale - WORLD_W) / 2;
		this.oy = (h / this.scale - 720) / 2;
	};
	loop = (now) => {
		if (!this.running) return;
		const raw = Math.min(.1, (now - this.lastT) / 1e3);
		this.lastT = now;
		this.acc += raw;
		const actions = this.input.sample();
		this.handleMeta(actions);
		let steps = 0;
		while (this.acc >= STEP && steps < 8) {
			if (this.hitStop > 0) this.hitStop -= STEP;
			else this.step(STEP, actions);
			this.acc -= STEP;
			steps++;
		}
		this.render(this.acc / STEP);
		this.raf = requestAnimationFrame(this.loop);
	};
	handleMeta(a) {
		if (this.state === "title" && a.confirmPressed) {
			this.audio.unlock();
			this.audio.setMuted(this.save.muted);
			this.beginRun();
		} else if (this.state === "over" && a.confirmPressed) {
			this.audio.unlock();
			this.beginRun();
		}
	}
	beginRun() {
		this.resetWorld(false);
		this.state = "playing";
		this.emitHud(true);
	}
	resetWorld(title) {
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
		this.py = 518;
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
	step(dt, a) {
		if (this.state === "over") return;
		if (this.state === "dying") {
			this.dieT += dt;
			this.pvy += GRAVITY * dt;
			this.py += this.pvy * dt;
			this.trauma = Math.max(this.trauma - dt * 1.6, 0);
			this.hitFlash = Math.max(this.hitFlash - dt, 0);
			this.updateFx(dt);
			if (this.dieT > .85) this.finishRun();
			return;
		}
		const playing = this.state === "playing";
		if (playing) this.speed = SPEED_START + 470 * (1 - Math.exp(-this.distance / 2400));
		this.scroll += this.speed * dt;
		if (playing) {
			this.distance += this.speed * dt;
			this.score += this.speed * dt * .085;
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
	ph() {
		return this.sliding ? SLIDE_H : PLAYER_H;
	}
	updatePlayer(dt, a, playing) {
		if (a.jumpPressed) this.jumpBuf = BUFFER;
		else this.jumpBuf = Math.max(0, this.jumpBuf - dt);
		const wantSlide = a.slidePressed || a.slideHeld && this.grounded && !this.sliding;
		if (playing && wantSlide && this.grounded && !this.sliding) {
			this.sliding = true;
			this.slideT = SLIDE_TIME;
			this.audio.slide();
			this.burst(268, 590, 8, "dust");
		}
		if (this.sliding) {
			this.slideT -= dt;
			if (this.slideT <= 0 || a.jumpPressed) {
				this.sliding = false;
				this.py = 518;
			}
		}
		const canJump = (this.grounded || this.coyote > 0) && !this.sliding;
		if (playing && this.jumpBuf > 0 && canJump) {
			this.pvy = JUMP_V;
			this.grounded = false;
			this.coyote = 0;
			this.jumpBuf = 0;
			this.jumpHeld = true;
			this.squashX = .86;
			this.squashY = 1.2;
			this.audio.jump();
			this.burst(264, 592, 10, "dust");
		}
		if (!a.jumpHeld) this.jumpHeld = false;
		if (!this.grounded && !this.jumpHeld && this.pvy < 0) {
			this.pvy *= JUMP_CUT;
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
				this.squashY = .8;
				this.landFlash = .12;
				if (playing) this.audio.land();
				this.burst(266, 594, 12, "dust");
			}
			this.py = GROUND_Y - h;
			this.pvy = 0;
			this.grounded = true;
			this.coyote = COYOTE;
		} else this.grounded = false;
		if (this.sliding) this.py = 558;
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
				this.burst(258, 594, 2, "dust");
			}
		}
	}
	spawnAhead() {
		const density = clamp((this.distance - 180) / 4200, 0, 1);
		const ahead = WORLD_W + this.speed * .35;
		const minGap = this.speed * lerp(.88, .54, density) + 70;
		const maxGap = this.speed * lerp(1.6, .82, density) + 90;
		while (this.lastSpawn < this.scroll + ahead) {
			const gap = minGap + Math.random() * (maxGap - minGap);
			this.lastSpawn += gap;
			this.placePattern(this.lastSpawn, density);
			this.spawnIndex++;
		}
	}
	placePattern(x, density) {
		const roll = Math.random();
		const late = density > .45;
		if (late && roll < .12) {
			this.spawnLow(x);
			this.spawnHigh(x + this.speed * .7);
			this.lastSpawn += this.speed * .7;
		} else if (late && roll < .22) {
			this.spawnHigh(x);
			this.spawnLow(x + this.speed * .78);
			this.lastSpawn += this.speed * .78;
		} else if (roll < lerp(.12, .38, density)) this.spawnHigh(x);
		else if (roll < lerp(.55, .7, density)) this.spawnLow(x, "spike");
		else this.spawnLow(x, "crate");
	}
	spawnLow(x, kind = Math.random() < .4 ? "spike" : "crate") {
		const w = kind === "spike" ? 50 : 70;
		const h = kind === "spike" ? 58 : 76;
		this.addObstacle(kind, x, GROUND_Y - h, w, h);
		if (Math.random() < .7) {
			const peak = GROUND_Y - h - 90 - Math.random() * 40;
			for (let i = 0; i < 3; i++) {
				const t = i / 2;
				const arc = Math.sin(t * Math.PI);
				this.addCoin(x + 10 + i * 28, lerp(GROUND_Y - h - 36, peak, arc));
			}
		}
	}
	spawnHigh(x) {
		this.addObstacle("beam", x, 308, 86, 240);
		if (Math.random() < .75) {
			this.addCoin(x + 18, 570);
			this.addCoin(x + 48, 570);
		}
	}
	addObstacle(kind, x, y, w, h) {
		const o = this.alloc(this.obstacles, () => ({
			active: false,
			kind: "crate",
			x: 0,
			y: 0,
			w: 0,
			h: 0,
			scored: false,
			near: false
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
	addCoin(x, y) {
		const c = this.alloc(this.coins, () => ({
			active: false,
			x: 0,
			y: 0,
			r: 14,
			frame: 0
		}));
		c.active = true;
		c.x = x;
		c.y = y;
		c.r = 14;
		c.frame = Math.random() * 4;
	}
	updateObstacles(dt) {
		const px = this.scroll + PLAYER_X;
		const py = this.py;
		const pw = PLAYER_W;
		const ph = this.ph();
		const sub = this.speed > 700 ? 2 : 1;
		dt / sub;
		for (let s = 0; s < sub; s++) for (const o of this.obstacles) {
			if (!o.active) continue;
			if (aabb(px, py, pw, ph, o.x, o.y, o.w, o.h)) {
				this.kill(o);
				return;
			}
		}
		for (const o of this.obstacles) {
			if (!o.active) continue;
			if (!o.near) {
				const closeX = Math.abs(px + pw / 2 - (o.x + o.w / 2)) < o.w / 2 + 18;
				let closeY = false;
				if (o.kind === "beam") closeY = py < o.y + o.h + 16 && py + ph > o.y;
				else closeY = py + ph > o.y - 16 && py < o.y + o.h;
				if (closeX && closeY && !aabb(px, py, pw, ph, o.x, o.y - 10, o.w, o.h + 14)) o.near = true;
			}
			if (!o.scored && o.x + o.w < px) {
				o.scored = true;
				this.onClear(o);
			}
			if (o.x + o.w < this.scroll - 80) o.active = false;
		}
	}
	updateCoins() {
		const px = this.scroll + PLAYER_X;
		const py = this.py;
		const pw = PLAYER_W;
		const ph = this.ph();
		for (const c of this.coins) {
			if (!c.active) continue;
			c.frame += .12;
			if (aabb(px, py, pw, ph, c.x - c.r, c.y - c.r, c.r * 2, c.r * 2)) {
				c.active = false;
				const pts = 35 * Math.max(1, this.combo);
				this.score += pts;
				this.audio.coin();
				this.float(c.x - this.scroll, c.y, `+${pts}`);
				this.burst(c.x - this.scroll, c.y, 6, "ember");
			} else if (c.x < this.scroll - 40) c.active = false;
		}
	}
	onClear(o) {
		this.combo += 1;
		if (o.near) this.combo += 1;
		this.comboTimer = 2.5;
		this.comboFlash = .35;
		this.peakCombo = Math.max(this.peakCombo, this.combo);
		const pts = (o.near ? 40 : 16) * this.combo;
		this.score += pts;
		this.audio.combo();
		this.float(318, this.py, o.near ? `NEAR +${pts}` : `+${pts}`);
	}
	kill(o) {
		this.state = "dying";
		this.dieT = 0;
		this.hitStop = this.reduced ? .02 : .09;
		this.hitFlash = .35;
		this.trauma = this.reduced ? .15 : .85;
		this.pvy = -220;
		this.sliding = false;
		this.impactFrame = 0;
		this.impactT = 0;
		this.impactX = 272;
		this.impactY = this.py + this.ph() * .5;
		this.audio.hit();
		this.burst(this.impactX, this.impactY, 22, "spark");
		this.burst(this.impactX, this.impactY, 14, "dust");
		this.emitHud(true);
	}
	finishRun() {
		this.state = "over";
		const s = Math.floor(this.score);
		this.newBest = s > this.save.highScore;
		this.save.highScore = Math.max(this.save.highScore, s);
		this.save.bestCombo = Math.max(this.save.bestCombo, this.peakCombo);
		this.save.bestDistance = Math.max(this.save.bestDistance, this.distance);
		writeSave(this.save);
		this.emitHud(true);
	}
	updateFx(dt) {
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
			f.vy *= .96;
			if (f.life <= 0) f.active = false;
		}
		if (this.impactFrame >= 0) {
			this.impactT += dt;
			if (this.impactT > .06) {
				this.impactT = 0;
				this.impactFrame++;
				if (this.impactFrame > 3) this.impactFrame = -1;
			}
		}
	}
	burst(x, y, n, kind) {
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
				kind: "dust"
			}));
			p.active = true;
			p.x = x;
			p.y = y;
			p.kind = kind;
			const ang = Math.random() * Math.PI * 2;
			const sp = kind === "spark" ? 180 + Math.random() * 280 : 40 + Math.random() * 120;
			p.vx = Math.cos(ang) * sp - this.speed * .15;
			p.vy = Math.sin(ang) * sp - 40;
			p.max = .25 + Math.random() * .45;
			p.life = p.max;
			p.size = kind === "ember" ? 3 + Math.random() * 3 : 2 + Math.random() * 3;
		}
	}
	float(x, y, text) {
		const f = this.alloc(this.floaters, () => ({
			active: false,
			x: 0,
			y: 0,
			vy: 0,
			life: 0,
			text: ""
		}));
		f.active = true;
		f.x = x;
		f.y = y;
		f.vy = -48;
		f.life = .7;
		f.text = text;
	}
	alloc(pool, make) {
		for (const item of pool) if (!item.active) return item;
		const n = make();
		pool.push(n);
		return n;
	}
	forEachPool(pool, fn) {
		for (const item of pool) fn(item);
	}
	emitHud(force) {
		const snap = this.snapshot();
		const key = `${snap.state}|${snap.score}|${snap.combo}|${snap.muted}|${snap.newBest}|${Math.round(snap.comboFlash * 10)}`;
		if (!force && key === this.hudKey) return;
		this.hudKey = key;
		this.onHud(snap);
	}
	makeGround() {
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
			const x = i * 37 % 256;
			g.moveTo(x, 6);
			g.lineTo(x + 40, 22 + i % 5 * 8);
			g.stroke();
		}
		g.fillStyle = "rgba(0,0,0,0.35)";
		for (let i = 0; i < 20; i++) g.fillRect(i * 53 % 256, 24 + i * 13 % 120, 3 + i % 4, 2);
		g.fillStyle = "#0e0d0c";
		g.fillRect(0, 148, 256, 12);
		return c;
	}
	render(_alpha) {
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
			ctx.fillStyle = `rgba(243,242,239,${this.hitFlash * .28})`;
			ctx.fillRect(0, 0, WORLD_W, 720);
		}
	}
	drawSky(ctx, spr) {
		if (spr) {
			const img = spr.sky;
			const extra = .18;
			const dw = WORLD_W * 1.18;
			const dh = 720 * 1.18;
			const maxPan = 230.39999999999986;
			const t = this.scroll * .02 % (maxPan * 2);
			const pan = t < maxPan ? t : maxPan * 2 - t;
			ctx.drawImage(img, -pan, -720 * extra * .4, dw, dh);
		} else {
			ctx.fillStyle = "#1a1520";
			ctx.fillRect(0, 0, WORLD_W, 720);
		}
	}
	drawMid(ctx) {
		const par = this.scroll * .28;
		ctx.fillStyle = "rgba(8,8,10,0.55)";
		ctx.beginPath();
		ctx.moveTo(0, 558);
		for (let x = 0; x <= 1360; x += 40) {
			const wx = x + par;
			const h = 70 + Math.sin(wx * .01) * 28 + Math.sin(wx * .023) * 18;
			ctx.lineTo(x, 568 - h);
		}
		ctx.lineTo(WORLD_W, GROUND_Y);
		ctx.lineTo(0, GROUND_Y);
		ctx.closePath();
		ctx.fill();
	}
	drawGround(ctx) {
		if (this.ground) {
			const patX = -(this.scroll * 1 % this.ground.width);
			ctx.save();
			ctx.translate(patX, GROUND_Y);
			const pattern = ctx.createPattern(this.ground, "repeat");
			if (pattern) {
				ctx.fillStyle = pattern;
				ctx.fillRect(-patX, 0, WORLD_W - patX + 256, 162);
			}
			ctx.restore();
		} else {
			ctx.fillStyle = "#1a1714";
			ctx.fillRect(0, GROUND_Y, WORLD_W, 122);
		}
		ctx.fillStyle = "rgba(196,92,74,0.35)";
		ctx.fillRect(0, GROUND_Y, WORLD_W, 2);
	}
	drawPlayer(ctx, spr) {
		const h = this.ph();
		const visW = this.sliding ? 118 : 96;
		const visH = this.sliding ? 72 : 118;
		const dx = 269;
		const feetY = this.py + h;
		ctx.save();
		ctx.translate(dx, feetY);
		ctx.scale(this.squashX, this.squashY);
		ctx.translate(-visW * .45, -visH);
		if (this.state === "dying") {
			ctx.rotate(-.35);
			ctx.globalAlpha = clamp(1 - this.dieT * .7, .2, 1);
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
		if (this.hitFlash > .18) {
			ctx.globalCompositeOperation = "source-atop";
			ctx.fillStyle = `rgba(243,242,239,${this.hitFlash})`;
			ctx.fillRect(0, 0, visW, visH);
		}
		ctx.restore();
		if (this.landFlash > 0) {
			ctx.fillStyle = `rgba(243,242,239,${this.landFlash * .35})`;
			ctx.beginPath();
			ctx.ellipse(270, 596, 28 + (.12 - this.landFlash) * 80, 5, 0, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	drawObstacles(ctx, spr) {
		for (const o of this.obstacles) {
			if (!o.active) continue;
			const sx = o.x - this.scroll;
			if (sx > 1320 || sx + o.w < -80) continue;
			if (!spr) {
				ctx.fillStyle = "#3a342c";
				ctx.fillRect(sx, o.y, o.w, o.h);
				continue;
			}
			if (o.kind === "crate") ctx.drawImage(spr.crate, sx - 18, o.y - 22, o.w + 36, o.h + 28);
			else if (o.kind === "spike") ctx.drawImage(spr.spike, sx - 16, o.y - 10, o.w + 32, o.h + 16);
			else ctx.drawImage(spr.beam, sx - 28, o.y - 8, o.w + 56, o.h + 24);
		}
	}
	drawCoins(ctx, spr) {
		for (const c of this.coins) {
			if (!c.active) continue;
			const sx = c.x - this.scroll;
			if (sx < -40 || sx > 1320) continue;
			const bob = Math.sin(this.animT * 6 + c.x * .02) * 4;
			if (spr) drawSheet(ctx, spr.coin, 2, 2, Math.floor(c.frame) % 4, sx - 18, c.y + bob - 18, 36, 36);
			else {
				ctx.fillStyle = "#c9cdd4";
				ctx.beginPath();
				ctx.arc(sx, c.y + bob, 8, 0, Math.PI * 2);
				ctx.fill();
			}
		}
	}
	drawParticles(ctx) {
		for (const p of this.particles) {
			if (!p.active) continue;
			const a = p.life / p.max;
			if (p.kind === "ember") ctx.fillStyle = `rgba(196,92,74,${a})`;
			else if (p.kind === "spark") ctx.fillStyle = `rgba(243,242,239,${a})`;
			else ctx.fillStyle = `rgba(90,82,72,${a * .8})`;
			ctx.fillRect(p.x, p.y, p.size, p.size);
		}
	}
	drawImpact(ctx, spr) {
		if (this.impactFrame < 0 || !spr) return;
		drawSheet(ctx, spr.impact, 2, 2, this.impactFrame, this.impactX - 64, this.impactY - 64, 128, 128);
	}
	drawFloaters(ctx) {
		ctx.font = "600 16px 'IBM Plex Sans', sans-serif";
		ctx.textAlign = "center";
		for (const f of this.floaters) {
			if (!f.active) continue;
			ctx.fillStyle = `rgba(243,242,239,${clamp(f.life * 2, 0, 1)})`;
			ctx.fillText(f.text, f.x, f.y);
		}
		ctx.textAlign = "left";
	}
	drawVignette(ctx) {
		const g = ctx.createRadialGradient(WORLD_W * .45, 324, 144, WORLD_W * .5, 360, WORLD_W * .72);
		g.addColorStop(0, "rgba(0,0,0,0)");
		g.addColorStop(1, "rgba(0,0,0,0.38)");
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, WORLD_W, 720);
	}
};
var idleHud = {
	state: "title",
	score: 0,
	combo: 0,
	comboFlash: 0,
	highScore: 0,
	distance: 0,
	speed: 0,
	newBest: false,
	bestCombo: 0,
	muted: false,
	peakCombo: 0
};
function AshlineGame() {
	const canvasRef = (0, import_react.useRef)(null);
	const engineRef = (0, import_react.useRef)(null);
	const [hud, setHud] = (0, import_react.useState)(idleHud);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [failed, setFailed] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		let cancelled = false;
		const engine = new Engine(canvas, (snap) => {
			if (!cancelled) setHud(snap);
		});
		engineRef.current = engine;
		engine.init().then(() => {
			if (cancelled) {
				engine.destroy();
				return;
			}
			setReady(true);
			engine.start();
		}).catch((err) => {
			if (!cancelled) setFailed(err instanceof Error ? err.message : "Could not start");
		});
		return () => {
			cancelled = true;
			engine.destroy();
			engineRef.current = null;
		};
	}, []);
	const onMute = (0, import_react.useCallback)(() => {
		const eng = engineRef.current;
		if (!eng) return;
		eng.setMuted(!hud.muted);
	}, [hud.muted]);
	const meters = Math.floor(hud.distance / 24);
	const playing = hud.state === "playing" || hud.state === "dying";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg select-none",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full touch-none",
				"aria-label": "ASHLINE playfield"
			}),
			!ready && !failed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-10 flex items-center justify-center bg-bg",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-sm tracking-[0.2em] text-muted uppercase",
					children: "Loading the ridge"
				})
			}),
			failed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute inset-0 z-10 flex items-center justify-center bg-bg px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "max-w-sm text-center text-sm text-muted",
					children: failed
				})
			}),
			ready && hud.state === "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleOverlay, { highScore: hud.highScore }),
			ready && playing && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HudOverlay, {
				score: hud.score,
				combo: hud.combo,
				comboFlash: hud.comboFlash,
				highScore: hud.highScore,
				meters
			}),
			ready && hud.state === "over" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverOverlay, {
				score: hud.score,
				highScore: hud.highScore,
				newBest: hud.newBest,
				meters,
				peakCombo: hud.peakCombo
			}),
			ready && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute top-0 right-0 z-20 p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "ghost",
					size: "icon",
					className: "pointer-events-auto bg-surface/70 text-muted hover:text-fg",
					"aria-label": hud.muted ? "Unmute" : "Mute",
					onClick: onMute,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "relative block size-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: cn("absolute inset-0 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]", hud.muted ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: cn("absolute inset-0 transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]", hud.muted ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]") })]
					})
				})
			}),
			ready && playing && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "outline",
					className: "pointer-events-auto h-14 flex-1 rounded-[28px] border-border bg-surface/80 text-fg",
					onPointerDown: (e) => {
						e.preventDefault();
						e.stopPropagation();
						engineRef.current?.tapJump();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" }), "Jump"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					type: "button",
					variant: "outline",
					className: "pointer-events-auto h-14 flex-1 rounded-[28px] border-border bg-surface/80 text-fg",
					onPointerDown: (e) => {
						e.preventDefault();
						e.stopPropagation();
						engineRef.current?.tapSlide();
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-4" }), "Slide"]
				})]
			})
		]
	});
}
function TitleOverlay({ highScore }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ash-enter font-display text-xs tracking-[0.32em] text-muted uppercase",
					children: "Dusk ridge courier"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "ash-enter-2 mt-3 font-display text-6xl font-bold tracking-[-0.04em] text-fg sm:text-7xl",
					children: "ASHLINE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ash-enter-3 mt-4 text-base leading-relaxed text-muted",
					children: "The highway is coming apart. Jump the wrecks, slide the beams, keep the line."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ash-enter-4 mt-8 font-display text-sm tracking-[0.18em] text-fg uppercase",
					children: "Tap or press space"
				}),
				highScore > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "ash-enter-4 mt-3 text-sm text-muted tabular-nums",
					children: ["Best ", highScore.toLocaleString()]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
			className: "ash-enter-4 pointer-events-none mt-16 hidden gap-8 text-xs tracking-wide text-subtle uppercase sm:flex",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Space · tap" })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Down · swipe" })]
			})]
		})]
	});
}
function HudOverlay({ score, combo, comboFlash, highScore, meters }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-3xl font-semibold tracking-tight text-fg tabular-nums",
				children: score.toLocaleString()
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs tracking-wide text-muted uppercase tabular-nums",
				children: [meters, " m"]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-[max(1.25rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 text-center",
				children: combo > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "ash-pop font-display text-2xl font-semibold text-fg tabular-nums",
					style: { opacity: comboFlash > 0 ? 1 : .85 },
					children: ["x", combo]
				}, combo)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "pr-14 text-right text-xs tracking-wide text-muted uppercase tabular-nums",
				children: ["Best ", highScore.toLocaleString()]
			})
		]
	});
}
function OverOverlay({ score, highScore, newBest, meters, peakCombo }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg/55 px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-[32px] border border-border bg-surface p-6 pt-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ash-enter text-xs tracking-[0.28em] text-muted uppercase",
					children: "Line broken"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ash-enter-2 mt-3 font-display text-5xl font-semibold tracking-tight text-fg tabular-nums",
					children: score.toLocaleString()
				}),
				newBest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ash-enter-3 mt-2 text-sm text-ok",
					children: "New best"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "ash-enter-3 mt-2 text-sm text-muted tabular-nums",
					children: ["Best ", highScore.toLocaleString()]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ash-enter-3 mt-6 grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[20px] bg-surface-2 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-subtle uppercase",
							children: "Distance"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-display text-lg text-fg tabular-nums",
							children: [meters, " m"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[20px] bg-surface-2 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tracking-wide text-subtle uppercase",
							children: "Peak combo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-1 font-display text-lg text-fg tabular-nums",
							children: ["x", Math.max(1, peakCombo)]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "ash-enter-4 mt-8 text-center text-sm text-muted",
					children: "Tap or press space to run again"
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AshlineGame, {});
}
//#endregion
export { Home as component };
