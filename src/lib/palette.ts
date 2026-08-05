export interface Palette {
  primary: string;
  accent: string;
}

export interface PaletteOption extends Palette {
  id: string;
  label: string;
}

/** Curated in-house palettes users can pick when they don't want logo colours. */
export const HOUSE_PALETTES: PaletteOption[] = [
  { id: "royal", label: "Royal blue", primary: "#2f4bd0", accent: "#ffd24a" },
  { id: "cream", label: "Cream & gold", primary: "#f6f1e6", accent: "#c08a2e" },
  { id: "ink", label: "Ink & citron", primary: "#1b1a17", accent: "#e6e33a" },
  { id: "forest", label: "Forest & sand", primary: "#183d33", accent: "#e5c07b" },
  { id: "berry", label: "Berry & blush", primary: "#5b1740", accent: "#ffb3c7" },
  { id: "ocean", label: "Ocean & coral", primary: "#0d3b4f", accent: "#ff7a59" },
];

export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLight(hex: string): boolean {
  return luminance(hex) > 0.45;
}

function readableOn(hex: string): string {
  return isLight(hex) ? "#141414" : "#ffffff";
}

function mix(a: string, b: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(
    r1 + (r2 - r1) * amount,
    g1 + (g2 - g1) * amount,
    b1 + (b2 - b1) * amount,
  );
}

/** Maps a palette onto the --lp-* variables consumed by LinkPage. */
export function paletteVars(palette: Palette): Record<string, string> {
  const { primary, accent } = palette;
  const lightBg = isLight(primary);
  const heading = readableOn(primary);
  const card = lightBg ? "#ffffff" : mix(primary, "#ffffff", 0.92);
  const cardTitle = mix(primary, lightBg ? "#000000" : "#000000", lightBg ? 0.65 : 0.55);
  return {
    "--lp-bg": primary,
    "--lp-heading": heading,
    "--lp-body": lightBg ? mix(primary, "#000000", 0.55) : mix(primary, "#ffffff", 0.75),
    "--lp-cta": accent,
    "--lp-cta-fg": readableOn(accent),
    "--lp-card": card,
    "--lp-card-title": cardTitle,
    "--lp-card-sub": mix(cardTitle, card, 0.45),
    "--lp-arrow": lightBg ? mix(accent, "#000000", 0.25) : accent,
    "--lp-frame": accent,
  } as Record<string, string>;
}

export function parsePalette(value: unknown): Palette | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const primary = typeof obj["primary"] === "string" ? obj["primary"] : "";
  const accent = typeof obj["accent"] === "string" ? obj["accent"] : "";
  if (!isValidHex(primary) || !isValidHex(accent)) return null;
  return { primary, accent };
}

/* ---------------- Logo colour extraction (browser only) ---------------- */

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image"));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

/**
 * Extracts the dominant colours from a logo and turns them into 4 ready-made
 * palette options (dark, light, accent-led and inverted).
 */
export async function extractPalettesFromLogo(file: File): Promise<PaletteOption[]> {
  const img = await loadImage(file);
  const size = 80;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!;
    if (a < 160) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    // Skip near-white / near-black backgrounds when bucketing dominants.
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max > 245 && min > 240) continue;
    if (max < 18) continue;
    const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    bucket.n += 1;
    buckets.set(key, bucket);
  }

  const colors = [...buckets.values()]
    .map((b) => ({
      hex: rgbToHex(b.r / b.n, b.g / b.n, b.b / b.n),
      n: b.n,
      sat: saturation(b.r / b.n, b.g / b.n, b.b / b.n),
    }))
    .sort((a, b) => b.n * (0.4 + b.sat) - a.n * (0.4 + a.sat));

  if (colors.length === 0) return [];

  const first = colors[0]!.hex;
  const second = (colors.find((c) => c.hex !== first && Math.abs(luminance(c.hex) - luminance(first)) > 0.1) ?? colors[1] ?? colors[0])!.hex;
  const vivid = (colors.slice().sort((a, b) => b.sat - a.sat)[0] ?? colors[0])!.hex;

  const deep = isLight(first) ? mix(first, "#0c0c14", 0.78) : first;
  const soft = mix(first, "#ffffff", 0.86);
  const accentFor = (bg: string) => {
    const candidate = isLight(bg) ? mix(vivid, "#000000", 0.2) : mix(vivid, "#ffffff", 0.18);
    return Math.abs(luminance(candidate) - luminance(bg)) < 0.18
      ? isLight(bg)
        ? mix(candidate, "#000000", 0.45)
        : mix(candidate, "#ffffff", 0.45)
      : candidate;
  };

  const options: PaletteOption[] = [
    { id: "logo-deep", label: "Logo deep", primary: deep, accent: accentFor(deep) },
    { id: "logo-soft", label: "Logo soft", primary: soft, accent: accentFor(soft) },
    { id: "logo-vivid", label: "Logo vivid", primary: vivid, accent: accentFor(vivid) },
    {
      id: "logo-contrast",
      label: "Logo contrast",
      primary: isLight(second) ? mix(second, "#111111", 0.7) : second,
      accent: accentFor(isLight(second) ? mix(second, "#111111", 0.7) : second),
    },
  ];

  // De-duplicate identical looking options.
  const seen = new Set<string>();
  return options.filter((o) => {
    const key = `${o.primary}${o.accent}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
