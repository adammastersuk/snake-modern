export class SeededRng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  next(): number {
    this.state ^= this.state << 13;
    this.state ^= this.state >>> 17;
    this.state ^= this.state << 5;
    return (this.state >>> 0) / 4294967296;
  }

  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  getSeed(): number {
    return this.state >>> 0;
  }
}

export const createSeed = () => (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
