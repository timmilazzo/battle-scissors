// The second move slot's Skills as the game plays them (logic only, no DOM): the twin of scissors.js's shredDef and
// pins.js's pinDef. skillTier(id) = the tier bought (Save.skills[id], 0..3; meta.js buySkillTier), skillDef(id) = its
// CONFIG.skills entry with that tier applied, flattened to the numbers game.js plays by (cached on state.skill.def at a
// run's start, so the hot loop never allocates and never reads tiers itself):
//   need        charge events to fill the meter (0 = none: Basting pays Thread instead)
//   focus       focusSlow, focusSec (+focusSecUp at T1), need (needT2 at T2), refund (T3, else 0)
//   thimble     thimbleStops (thimbleStopsT1 at T1), bump (T2: bumped back instead of popped), need (needT3 at T3)
//   mark        markMult, spread (T1), markRefund (T2, else 0), marks per use (marksT3 at T3, else 1)
//   pinking     pinkingLen (pinkingLenT1 at T1), pinkingW, armor (T2: the lane cuts through armor), trail (T3)
//   basting     bastingCost, bastingHolds (bastingHoldsT1 at T1), bastingSec (bastingSecT2 at T2), bastingDmgMult (T3, else 1)
import { CONFIG as C } from './config.js';
import { Save } from './save.js';

export const SKILL_TIERS = 3;
export const skillTier = id => Math.max(0, Math.min(SKILL_TIERS, Save.skills[id] | 0));

// A fresh object (CONFIG itself is never changed); tier defaults to the one bought.
export function skillDef(id, tier = skillTier(id)) {
  const base = C.skills[id];
  if (!base) return null;
  const d = { ...base, id, tier };
  if (id === 'focus') {
    if (tier >= 1) d.focusSec = base.focusSec + base.focusSecUp;
    d.need = tier >= 2 ? base.needT2 : base.need;
    d.refund = tier >= 3 ? base.refund : 0;
  } else if (id === 'thimble') {
    d.thimbleStops = tier >= 1 ? base.thimbleStopsT1 : base.thimbleStops;
    d.bump = tier >= 2;
    d.need = tier >= 3 ? base.needT3 : base.need;
  } else if (id === 'mark') {
    d.spread = tier >= 1;
    d.markRefund = tier >= 2 ? base.markRefund : 0;
    d.marks = tier >= 3 ? base.marksT3 : 1;
  } else if (id === 'pinking') {
    d.pinkingLen = tier >= 1 ? base.pinkingLenT1 : base.pinkingLen;
    d.armor = tier >= 2 && !!base.pinkingArmorT2;
    d.trail = tier >= 3;
  } else if (id === 'basting') {
    d.need = 0;
    d.bastingHolds = tier >= 1 ? base.bastingHoldsT1 : base.bastingHolds;
    d.bastingSec = tier >= 2 ? base.bastingSecT2 : base.bastingSec;
    d.bastingDmgMult = tier >= 3 ? base.bastingDmgMult : 1;
  }
  return d;
}
