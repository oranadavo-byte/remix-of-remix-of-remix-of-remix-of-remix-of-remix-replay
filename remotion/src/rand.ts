export const seeded = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const makeItems = <T,>(count: number, seed: number, fn: (r: () => number, i: number) => T): T[] => {
  const r = seeded(seed);
  return new Array(count).fill(0).map((_, i) => fn(r, i));
};
