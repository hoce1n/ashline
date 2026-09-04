export type Actions = {
  jumpHeld: boolean;
  jumpPressed: boolean;
  slideHeld: boolean;
  slidePressed: boolean;
  confirmPressed: boolean;
};

const JUMP_CODES = new Set(["Space", "ArrowUp", "KeyW", "KeyZ"]);
const SLIDE_CODES = new Set(["ArrowDown", "KeyS", "KeyX", "ControlLeft", "ControlRight"]);
const CONFIRM_CODES = new Set(["Space", "Enter", "KeyW", "ArrowUp"]);

export class Input {
  private keys = new Set<string>();
  private prevJump = false;
  private prevSlide = false;
  private prevConfirm = false;
  private jumpTap = false;
  private slideTap = false;
  private confirmTap = false;
  private jumpHold = false;
  private jumpHoldUntil = 0;
  private pointerId: number | null = null;
  private startY = 0;
  private startX = 0;
  private startT = 0;
  private swiped = false;
  private el: HTMLElement | null = null;

  attach(el: HTMLElement) {
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
    this.jumpHoldUntil = Math.max(this.jumpHoldUntil, performance.now() + 280);
  }

  setJumpHeld(held: boolean) {
    this.jumpHold = held;
    if (held) {
      this.jumpTap = true;
      this.confirmTap = true;
      this.jumpHoldUntil = 0;
    }
  }

  tapSlide() {
    this.slideTap = true;
  }

  sample(): Actions {
    const tapHold = this.jumpHoldUntil > 0 && performance.now() < this.jumpHoldUntil;
    let jumpHeld = this.keysHas(JUMP_CODES) || this.jumpTap || this.jumpHold || tapHold;
    let slideHeld = this.keysHas(SLIDE_CODES) || this.slideTap;
    let confirmHeld = this.keysHas(CONFIRM_CODES) || this.confirmTap;

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : [];
    if (pads) {
      for (const pad of pads) {
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
    if (!tapHold) this.jumpHoldUntil = 0;

    return { jumpHeld, jumpPressed, slideHeld, slidePressed, confirmPressed };
  }

  private keysHas(codes: Set<string>) {
    for (const c of codes) if (this.keys.has(c)) return true;
    return false;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    this.keys.add(e.code);
    if (e.key === " " || e.key === "Spacebar") this.keys.add("Space");
    if (e.key === "ArrowDown") this.keys.add("ArrowDown");
    if (e.key === "ArrowUp") this.keys.add("ArrowUp");
    if (e.key === "s" || e.key === "S") this.keys.add("KeyS");
    if (e.key === "w" || e.key === "W") this.keys.add("KeyW");
    if (JUMP_CODES.has(e.code) || SLIDE_CODES.has(e.code) || e.code === "Enter" || e.key === " ") {
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    if (e.key === " " || e.key === "Spacebar") this.keys.delete("Space");
    if (e.key === "ArrowDown") this.keys.delete("ArrowDown");
    if (e.key === "ArrowUp") this.keys.delete("ArrowUp");
    if (e.key === "s" || e.key === "S") this.keys.delete("KeyS");
    if (e.key === "w" || e.key === "W") this.keys.delete("KeyW");
  };

  private onBlur = () => {
    this.keys.clear();
    this.pointerId = null;
  };

  private onVis = () => {
    if (document.hidden) this.keys.clear();
  };

  private onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.pointerId = e.pointerId;
    this.startY = e.clientY;
    this.startX = e.clientX;
    this.startT = performance.now();
    this.swiped = false;
    this.el?.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (this.pointerId !== e.pointerId) return;
    const dy = e.clientY - this.startY;
    if (!this.swiped && dy > 48 && Math.abs(e.clientX - this.startX) < 90) {
      this.swiped = true;
      this.slideTap = true;
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    if (this.pointerId !== e.pointerId) return;
    const dt = performance.now() - this.startT;
    const dy = e.clientY - this.startY;
    if (!this.swiped && dt < 420 && dy < 36) {
      this.jumpTap = true;
      this.confirmTap = true;
      this.jumpHoldUntil = Math.max(this.jumpHoldUntil, performance.now() + 280);
    }
    this.pointerId = null;
  };
}
