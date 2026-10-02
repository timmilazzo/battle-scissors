// The sharpness meter and Sharpen button (DOM), shared by the weapon select screen and the Shop's Scissors tab (armory.js).
// Meter: "SHARPNESS  Fair  normal damage", a track that runs red (Dull) to green (Sharp) with a notch per band,
// lit up to the edge, and the words Dull / Sharp under its ends. Values: scissors.js (sharpness, sharpBand).
// Under it, one line on what the humans did with the pair during the day (src/story.js `sharpen`, by band).
// The Sharpen button shows the price; on a pair that's already sharp it says so and is disabled.
import { CONFIG as C } from './config.js';
import { Save } from './save.js';
import { STORY } from './story.js';
import { sharpness, sharpBand, sharpBandIndex, sharpMult, canSharpen } from './scissors.js';

export function sharpMeter() {
  const m = document.createElement('div');
  m.className = 'sharp-meter'; m.setAttribute('role', 'meter');
  m.setAttribute('aria-valuemin', '0'); m.setAttribute('aria-valuemax', '100');
  m.innerHTML = '<div class="sm-head"><span class="sm-label">Sharpness</span><b class="sm-band"></b><span class="sm-eff"></span></div>' +
    '<div class="sm-track"></div><div class="sm-ends"><span>Dull</span><span>Sharp</span></div><p class="sm-note"></p>';
  const track = m.querySelector('.sm-track'), n = C.meta.sharpBands.length;
  for (let i = 1; i < n; i++) { const t = document.createElement('i'); t.style.left = (i / n * 100) + '%'; track.append(t); }
  return m;
}
// Show weapon id's edge on a meter from sharpMeter().
export function setSharpMeter(m, id) {
  const s = sharpness(id), pct = Math.round(s * 100), eff = Math.round((sharpMult(s) - 1) * 100);
  m.dataset.band = String(sharpBandIndex(s));
  m.setAttribute('aria-valuenow', String(pct));
  m.setAttribute('aria-valuetext', sharpBand(s) + ', ' + pct + '%');
  m.querySelector('.sm-band').textContent = sharpBand(s);
  m.querySelector('.sm-eff').textContent = eff === 0 ? 'normal damage' : (eff > 0 ? '+' : '−') + Math.abs(eff) + '% damage';
  m.querySelector('.sm-note').textContent = STORY.sharpen[sharpBandIndex(s)] || '';
  m.style.setProperty('--p', pct + '%');                         // the track goes dark past the edge (index.html)
}

export function sharpenButton(onClick) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'felt-btn small sharpen-btn';
  b.innerHTML = '<span class="sb-label"></span><span class="sb-price"><span class="bt"></span><b></b></span>';
  b.addEventListener('click', onClick);
  return b;
}
// Price and state for weapon id: "Sharpen [bt] 40", or "Sharp!" once it needs none (disabled either way when unaffordable).
export function setSharpenButton(b, id) {
  const need = canSharpen(id), afford = Save.buttons >= C.meta.sharpenCost;
  b.querySelector('.sb-label').textContent = need ? 'Sharpen' : 'Sharp!';
  b.querySelector('.sb-price').hidden = !need;
  b.querySelector('.sb-price b').textContent = String(C.meta.sharpenCost);
  b.disabled = !need || !afford;
  b.classList.toggle('broke', need && !afford);
  b.title = !need ? 'Already sharp' : afford ? 'Sharpen back to full: +' + Math.round((sharpMult(1) - 1) * 100) + '% snip damage' : 'Not enough Buttons';
}
