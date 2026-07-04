// Hulpjes voor de SVG-grafieken.

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Vloeiend pad door alle punten via monotone kubieke interpolatie
 * (Fritsch–Carlson): geen overshoot, de curve blijft binnen de datawaarden —
 * mooier dan hoekige segmenten, zonder de data te vervormen.
 */
export function monotonePath(xs: number[], ys: number[]): string {
  const n = xs.length;
  if (n === 0) return "";
  if (n === 1) return `M${r2(xs[0])},${r2(ys[0])}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(xs[i + 1] - xs[i]);
    slope.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }

  const m: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    if (slope[i - 1] * slope[i] <= 0) {
      m.push(0);
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      m.push((w1 + w2) / (w1 / slope[i - 1] + w2 / slope[i]));
    }
  }
  m.push(slope[n - 2]);

  let d = `M${r2(xs[0])},${r2(ys[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = xs[i] + dx[i] / 3;
    const c1y = ys[i] + (m[i] * dx[i]) / 3;
    const c2x = xs[i + 1] - dx[i] / 3;
    const c2y = ys[i + 1] - (m[i + 1] * dx[i]) / 3;
    d += `C${r2(c1x)},${r2(c1y)} ${r2(c2x)},${r2(c2y)} ${r2(xs[i + 1])},${r2(ys[i + 1])}`;
  }
  return d;
}

/** Gelijkmatig verdeelde indices voor x-as-labels (eerste en laatste altijd). */
export function tickIndices(length: number, count: number): number[] {
  if (length <= count) return Array.from({ length }, (_, i) => i);
  const ticks = Array.from({ length: count }, (_, k) =>
    Math.round((k * (length - 1)) / (count - 1))
  );
  return [...new Set(ticks)];
}
