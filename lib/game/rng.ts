export class SeededRng {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next() {
    this.seed = (1664525 * this.seed + 1013904223) >>> 0;
    return this.seed / 0xffffffff;
  }

  int(maxExclusive: number) {
    if (maxExclusive <= 0) return 0;
    return Math.floor(this.next() * maxExclusive);
  }

  getSeed() {
    return this.seed >>> 0;
  }
}

export const createSeed = () => Math.floor(Math.random() * 0xffffffff) >>> 0;
