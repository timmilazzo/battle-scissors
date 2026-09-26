// mulberry32 PRNG by Tommy Ettinger, https://gist.github.com/tommyettinger/46a874533244883189143505d203312c (public domain).
// makeRng(seed) returns a function giving the seed's deterministic sequence of floats in [0, 1).
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
