// Leaderboard names the game makes up: an adjective and a sewing-box noun ("Plucky Bobbin"). The default on the name
// card and its Randomize button. The same lists live in supabase/functions/_shared/names.ts, where the server lets a
// made-up name through without the model's check; change both together. No imports (plain data + one function).
export const NAME_ADJ = ['Brave', 'Snippy', 'Nimble', 'Plucky', 'Dapper', 'Trusty', 'Stubborn', 'Crafty', 'Swift', 'Sharp',
  'Bold', 'Mighty', 'Tidy', 'Frayed', 'Steady', 'Clever', 'Jolly', 'Fearless', 'Speedy', 'Gallant', 'Lucky', 'Sturdy',
  'Zippy', 'Daring', 'Keen', 'Spry', 'Scrappy', 'Snappy', 'Hasty', 'Shiny'];
export const NAME_NOUN = ['Bobbin', 'Thimble', 'Spool', 'Button', 'Needle', 'Shears', 'Snips', 'Seam', 'Stitch', 'Hem',
  'Selvage', 'Pincushion', 'Pinking', 'Ribbon', 'Toggle', 'Grommet', 'Basting', 'Darner', 'Bodkin', 'Notion', 'Zipper',
  'Eyelet', 'Tassel', 'Snipper', 'Rivet', 'Pompom', 'Fringe', 'Hook', 'Popper', 'Gusset'];

// A made-up name, different from `not` (so Randomize always changes it). Visual choice only, so Math.random.
export function randomName(not = '') {
  for (;;) {
    const n = NAME_ADJ[Math.floor(Math.random() * NAME_ADJ.length)] + ' ' + NAME_NOUN[Math.floor(Math.random() * NAME_NOUN.length)];
    if (n !== not) return n;
  }
}
