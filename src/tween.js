// Minimal tweens. tween(obj, props, ms, ease, onDone, tag) moves each numeric obj[key] from its current value to
// props[key] over ms, then calls onDone(obj). A group only advances when its update(dt) runs (dt in seconds), so
// pausing a group's update freezes its tweens (the world group stops during hit-stop). cancel(tag) drops tweens
// without calling onDone. Allocation happens only when a tween starts; update() itself allocates nothing.
export const easing = {
  linear: t => t,
  outCubic: t => 1 - (1 - t) ** 3,
  outBack: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};

export function makeTweens() {
  const list = [], done = [];
  return {
    add(obj, props, ms, ease = easing.linear, onDone = null, tag = null) {
      const keys = Object.keys(props);
      const tw = { obj, keys, from: keys.map(k => obj[k]), to: keys.map(k => props[k]), ms: Math.max(ms, 1e-6), t: 0, ease, onDone, tag };
      list.push(tw);
      return tw;
    },
    update(dt) {
      const ms = dt * 1000, n = list.length;
      let keep = 0;
      for (let i = 0; i < n; i++) {
        const tw = list[i];
        tw.t += ms;
        if (tw.t >= tw.ms) {                                     // finished: land exactly on the target values
          for (let k = 0; k < tw.keys.length; k++) tw.obj[tw.keys[k]] = tw.to[k];
          done.push(tw);
        } else {
          const e = tw.ease(tw.t / tw.ms);
          for (let k = 0; k < tw.keys.length; k++) tw.obj[tw.keys[k]] = tw.from[k] + (tw.to[k] - tw.from[k]) * e;
          list[keep++] = tw;
        }
      }
      for (let i = n; i < list.length; i++) list[keep++] = list[i];   // (nothing can be added mid-loop, but stay safe)
      list.length = keep;
      for (let i = 0; i < done.length; i++) if (done[i].onDone) done[i].onDone(done[i].obj);   // may start new tweens
      done.length = 0;
    },
    cancel(tag) {
      let keep = 0;
      for (let i = 0; i < list.length; i++) if (list[i].tag !== tag) list[keep++] = list[i];
      list.length = keep;
    },
    clear() { list.length = 0; },
    get count() { return list.length; },
  };
}

// The default group: world tweens, advanced by game.update() except during hit-stop.
export const tweens = makeTweens();
export function tween(obj, props, ms, ease, onDone, tag) { return tweens.add(obj, props, ms, ease, onDone, tag); }
