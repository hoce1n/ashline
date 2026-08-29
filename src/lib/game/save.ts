const KEY = "ashline-save-v1";
const SAVE_VERSION = 1;

export type SaveData = {
  version: number;
  highScore: number;
  bestCombo: number;
  bestDistance: number;
  muted: boolean;
};

const defaults: SaveData = {
  version: SAVE_VERSION,
  highScore: 0,
  bestCombo: 0,
  bestDistance: 0,
  muted: false,
};

function migrate(raw: Partial<SaveData>): SaveData {
  return {
    ...defaults,
    ...raw,
    version: SAVE_VERSION,
    highScore: Math.max(0, Number(raw.highScore) || 0),
    bestCombo: Math.max(0, Number(raw.bestCombo) || 0),
    bestDistance: Math.max(0, Number(raw.bestDistance) || 0),
    muted: Boolean(raw.muted),
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    return migrate(JSON.parse(raw) as Partial<SaveData>);
  } catch {
    return { ...defaults };
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, version: SAVE_VERSION }));
  } catch {
    // private mode / quota — keep playing in memory
  }
}
