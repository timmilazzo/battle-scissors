// The game's made-up leaderboard names (src/names.js has the same lists; change both together). A name made only of
// these words skips the model's check: the game offers them, so they're known to be fine.
export const NAME_ADJ = ['Brave', 'Snippy', 'Nimble', 'Plucky', 'Dapper', 'Trusty', 'Stubborn', 'Crafty', 'Swift', 'Sharp',
  'Bold', 'Mighty', 'Tidy', 'Frayed', 'Steady', 'Clever', 'Jolly', 'Fearless', 'Speedy', 'Gallant', 'Lucky', 'Sturdy',
  'Zippy', 'Daring', 'Keen', 'Spry', 'Scrappy', 'Snappy', 'Hasty', 'Shiny'];
export const NAME_NOUN = ['Bobbin', 'Thimble', 'Spool', 'Button', 'Needle', 'Shears', 'Snips', 'Seam', 'Stitch', 'Hem',
  'Selvage', 'Pincushion', 'Pinking', 'Ribbon', 'Toggle', 'Grommet', 'Basting', 'Darner', 'Bodkin', 'Notion', 'Zipper',
  'Eyelet', 'Tassel', 'Snipper', 'Rivet', 'Pompom', 'Fringe', 'Hook', 'Popper', 'Gusset'];

export function isMadeUpName(name: string): boolean {
  const [a, n, ...rest] = name.split(' ');
  return rest.length === 0 && NAME_ADJ.includes(a) && NAME_NOUN.includes(n);
}
