  // ---------- achievements ----------
  // Tiers set the flake reward. Mythic ones are meant to be brutal.
  const TIERS = {
    b: { n: 'Bronze', c: '#d08a4e', r: 25 }, s: { n: 'Silver', c: '#c9d6e8', r: 75 }, g: { n: 'Gold', c: '#ffd24a', r: 200 },
    p: { n: 'Platinum', c: '#7fe8ff', r: 500 }, m: { n: 'Mythic', c: '#ff5cf0', r: 1500 },
  };
  const ACH_CATS = ['Distance', 'Score', 'Combos', 'Tricks & air', 'Slalom', 'Rails', 'Collecting', 'Flares & power-ups', 'Daily course', 'Missions', 'Friends', 'Career', 'Leaderboard', 'Collection', 'Specials'];
  // Ladders: [category, family, stat key, 'run' (best single run) or 'life' (career total), description, divisor, unit, tiers [target, tier, name, older id]]
  // In descriptions {n} is the target, {deg} the spin in degrees, {s}/{es} plural endings.
  const FAMILIES = [
    ['Distance', 'dist', 'meters', 'run', 'Ride {n} m in one run', 1, '', [[250, 'b', 'First Tracks'], [500, 'b', 'Finding Your Edge'], [1000, 'b', 'Kilometer Club'], [1500, 's', 'Cruising'], [2000, 's', 'Two-K Tear'], [3000, 's', 'Long Haul', 'm3k'], [4000, 'g', 'Leg Burner'], [6000, 'g', 'Endless Night', 'm6k'], [8000, 'g', 'Iron Legs'], [10000, 'p', 'Ten Thousand Turns'], [15000, 'p', 'Marathon of Snow'], [20000, 'm', 'Beyond the Map'], [25000, 'm', 'The Long Night']]],
    ['Score', 'score', 'score', 'run', 'Score {n} in one run', 1, '', [[500, 'b', 'Getting Started'], [1000, 'b', 'Four Digits'], [2000, 'b', 'Warmed Up', 's2k'], [4000, 'b', 'Hot Streak'], [6000, 's', 'On a Roll', 's6k'], [8000, 's', 'Point Machine'], [12000, 'g', 'Mountain Legend', 's12k'], [16000, 'g', 'Summit Score'], [20000, 'g', 'Twenty Grand'], [25000, 'p', 'Myth', 's25k'], [35000, 'p', 'Legend of the Slopes'], [50000, 'm', 'Fifty Thousand Stars'], [75000, 'm', 'Avalanche of Points'], [100000, 'm', 'Six Digits']]],
    ['Combos', 'combo', 'maxCombo', 'run', 'Get a x{n} near-miss combo', 1, '', [[3, 'b', 'Close Call'], [5, 'b', 'Close Shave', 'c5'], [8, 's', "Hair's Breadth"], [10, 's', 'Thread the Needle', 'c10'], [12, 's', 'Living Dangerously'], [15, 'g', 'Daredevil'], [20, 'g', 'Untouchable', 'c20'], [25, 'p', 'Ghost Through Trees'], [30, 'm', 'Perfect Thirty']]],
    ['Combos', 'miss', 'nearMiss', 'run', 'Pull off {n} near misses in one run', 1, '', [[10, 'b', 'Brush Past'], [25, 'b', 'Tree Hugger'], [50, 's', 'Slalom of Pines'], [100, 'g', 'Thrill Seeker'], [200, 'p', 'Adrenaline Junkie'], [400, 'm', 'Phantom Rider']]],
    ['Combos', 'lmiss', 'nearMiss', 'life', 'Pull off {n} near misses in total', 1, '', [[100, 'b', 'Close Encounters'], [500, 's', 'Living on the Edge'], [1000, 's', 'Risk Taker'], [2500, 'g', 'Fearless'], [5000, 'p', 'Nerves of Steel'], [10000, 'p', 'Ice in the Veins'], [25000, 'm', 'Untouchable Forever']]],
    ['Tricks & air', 'spin', 'maxRot', 'run', 'Land a {deg}', 1, '', [[1, 'b', 'Full Circle', '360'], [2, 's', 'Double Spin', '720'], [3, 'g', 'Ten-Eighty', '1080'], [4, 'm', 'Fourteen-Forty', '1440']]],
    ['Tricks & air', 'tricks', 'tricks', 'run', 'Land {n} spin tricks in one run', 1, '', [[2, 'b', 'Trickster'], [4, 's', 'Show Off', 'tr4'], [6, 's', 'Highlight Reel'], [8, 'g', 'Style Points'], [12, 'p', 'Air Show'], [16, 'p', 'Spin Doctor'], [20, 'm', 'Gravity Optional']]],
    ['Tricks & air', 'airs', 'airs', 'run', 'Land {n} jump{s} in one run', 1, '', [[1, 'b', 'First Flight', 'air'], [5, 's', 'Frequent Flyer'], [10, 'g', 'Jet Lag'], [20, 'p', 'Never Touch the Ground']]],
    ['Tricks & air', 'hang', 'maxAir', 'run', 'Stay in the air for {n} s on one jump', 60, 's', [[60, 'b', 'Hang Time'], [90, 's', 'Big Air'], [120, 'g', 'Orbit'], [140, 'm', 'Astronaut']]],
    ['Tricks & air', 'ltricks', 'tricks', 'life', 'Land {n} spin tricks in total', 1, '', [[10, 'b', 'Spinner'], [50, 's', 'Twister'], [100, 's', 'Tornado'], [250, 'g', 'Cyclone'], [500, 'p', 'Hurricane'], [1000, 'm', 'Eye of the Storm']]],
    ['Tricks & air', 'leap', 'leaps', 'run', 'Jump {n} crevasse{s} in one run', 1, '', [[1, 's', 'Leap of Faith'], [5, 'g', 'Gap Jumper'], [12, 'm', 'Bridge Not Needed']]],
    ['Tricks & air', 'lleap', 'leaps', 'life', 'Jump {n} crevasses in total', 1, '', [[25, 'g', 'Crack Hopper'], [100, 'p', 'Canyon Crosser']]],
    ['Tricks & air', 'lairs', 'airs', 'life', 'Land {n} jumps in total', 1, '', [[25, 'b', 'Airborne'], [100, 's', 'Frequent Flier Miles'], [500, 'g', 'Sky Dweller']]],
    ['Slalom', 'gates', 'gateMax', 'run', 'Clear {n} slalom gates in a row', 1, '', [[2, 'b', 'Slalom Rookie'], [4, 'b', 'Gatekeeper', 'g4'], [6, 's', 'Weaver'], [8, 'g', 'Slalom King', 'g8'], [10, 'g', 'Gate Crasher'], [12, 'p', 'Olympic Line'], [15, 'p', 'Flag Collector'], [20, 'm', 'Perfect Slalom']]],
    ['Slalom', 'lgates', 'gates', 'life', 'Clear {n} slalom gates in total', 1, '', [[25, 'b', 'Flag Bearer'], [100, 's', 'Course Setter'], [250, 's', 'Gate Keeper Pro'], [500, 'g', 'Slalom Vet'], [1000, 'p', 'Thousand Gates'], [2500, 'm', 'Gate God']]],
    ['Rails', 'rails', 'rails', 'run', 'Grind {n} rail{s} in one run', 1, '', [[1, 'b', 'Rail Rat', 'rail'], [3, 's', 'Grind Time', 'r3'], [5, 's', 'Rail Hopper'], [8, 'g', 'Steel Rider'], [12, 'p', 'Grind Lord'], [15, 'm', 'Iron Rails']]],
    ['Rails', 'grind', 'maxGrind', 'run', 'Score {n} from a single grind', 1, '', [[50, 'b', 'Metal Contact'], [80, 's', 'Long Slide'], [100, 's', 'Sparks Fly', 'grind'], [120, 'g', 'Endless Rail']]],
    ['Rails', 'lrails', 'rails', 'life', 'Grind {n} rails in total', 1, '', [[10, 'b', 'Rail Regular'], [50, 's', 'Grinder'], [100, 'g', 'Rail Master'], [250, 'p', 'Railroad'], [500, 'm', 'Transcontinental']]],
    ['Collecting', 'flakes', 'flakes', 'run', 'Grab {n} flakes in one run', 1, '', [[10, 'b', 'Snowflake'], [30, 'b', 'Flake Hunter', 'fl30'], [50, 's', 'Flurry'], [100, 'g', 'Blizzard Bank', 'fl100'], [150, 'g', 'Snow Globe'], [200, 'p', 'Whiteout'], [300, 'p', 'Polar Vault'], [500, 'm', 'Ice Age']]],
    ['Collecting', 'lant', 'lanterns', 'run', 'Grab {n} lanterns in one run', 1, '', [[3, 'b', 'Spark of Light'], [8, 's', 'Lamplighter', 'l8'], [12, 's', 'Torchbearer'], [20, 'g', 'Lighthouse'], [30, 'p', 'Northern Lights'], [50, 'm', 'Sunrise at Midnight']]],
    ['Collecting', 'lflakes', 'flakes', 'life', 'Grab {n} flakes in total', 1, '', [[100, 'b', 'Pocket Change'], [500, 'b', 'Piggy Bank'], [1000, 's', 'Snow Saver'], [2500, 's', 'Flake Fortune'], [5000, 'g', 'Frozen Assets'], [10000, 'p', 'Snowbank'], [25000, 'm', 'Flake Tycoon']]],
    ['Collecting', 'llant', 'lanterns', 'life', 'Grab {n} lanterns in total', 1, '', [[25, 'b', 'Night Light'], [100, 's', 'Lantern Collector'], [250, 'g', 'Glow Up'], [500, 'p', 'Lantern Keeper'], [1000, 'm', 'Keeper of the Flame']]],
    ['Flares & power-ups', 'smash', 'smashes', 'run', 'Smash {n} things with Flares in one run', 1, '', [[3, 'b', 'Fender Bender'], [8, 's', 'Wrecking Ball', 'sm8'], [15, 'g', 'Bulldozer'], [25, 'g', 'Demolition Run'], [40, 'p', 'Avalanche'], [60, 'm', 'Unstoppable Force']]],
    ['Flares & power-ups', 'flares', 'flaresFired', 'run', 'Fire {n} Flare{s} in one run', 1, '', [[1, 'b', 'Flare Up'], [2, 's', 'Light Show'], [3, 'g', 'Firestorm'], [5, 'p', 'Supernova']]],
    ['Flares & power-ups', 'saves', 'saves', 'run', 'Survive {n} crash{es} with shield{s} in one run', 1, '', [[1, 'b', 'Bubble Wrap', 'sh'], [3, 's', 'Nine Lives'], [5, 'g', 'Indestructible']]],
    ['Flares & power-ups', 'lsmash', 'smashes', 'life', 'Smash {n} things with Flares in total', 1, '', [[50, 'b', 'Breaker'], [250, 's', 'Smasher'], [500, 'g', 'Wrecker'], [1000, 'p', 'Destroyer'], [2500, 'm', 'Force of Nature']]],
    ['Flares & power-ups', 'lflares', 'flares', 'life', 'Fire {n} Flares in total', 1, '', [[10, 'b', 'Flare Gun'], [50, 's', 'Pyro'], [100, 'g', 'Fireworks'], [250, 'p', 'Sun Maker']]],
    ['Flares & power-ups', 'lsaves', 'saves', 'life', 'Survive {n} crashes with shields in total', 1, '', [[10, 'b', 'Safety First'], [50, 's', 'Guardian Angel']]],
    ['Flares & power-ups', 'shields', 'shields', 'life', 'Grab {n} shields in total', 1, '', [[10, 'b', 'Shield Up'], [50, 's', 'Armored'], [100, 'g', 'Fortress']]],
    ['Flares & power-ups', 'magnets', 'magnets', 'life', 'Grab {n} magnets in total', 1, '', [[10, 'b', 'Magnetic'], [50, 's', 'Attraction']]],
    ['Flares & power-ups', 'doubles', 'doubles', 'life', 'Grab {n} 2X pickups in total', 1, '', [[10, 'b', 'Seeing Double'], [50, 's', 'Twice as Nice']]],
    ['Daily course', 'dscore', 'dailyScore', 'run', 'Score {n} on the daily course', 1, '', [[2000, 'b', 'Daily Contender'], [5000, 's', 'Daily Threat'], [10000, 'g', 'Daily Dominator'], [20000, 'p', 'Daily Legend']]],
    ['Daily course', 'ddays', 'dailyDays', 'life', 'Ride the daily course on {n} different day{s}', 1, '', [[1, 'b', 'Daily Grind', 'daily'], [3, 'b', 'Three Day Weekend'], [7, 's', 'Week of Snow'], [14, 's', 'Two Week Trip'], [30, 'g', 'Monthly Regular'], [60, 'p', 'Season Regular'], [100, 'm', 'Hundred Days']]],
    ['Daily course', 'dstreak', 'dailyStreak', 'life', 'Ride the daily course {n} days in a row', 1, '', [[2, 'b', 'Back Again'], [3, 'b', 'Three in a Row'], [5, 's', 'Five Straight'], [7, 'g', 'Perfect Week'], [14, 'p', 'Fortnight'], [30, 'm', 'Unbroken']]],
    ['Missions', 'mis', 'missions', 'life', 'Complete {n} daily mission{s}', 1, '', [[1, 'b', 'Mission Accomplished'], [10, 's', 'On Assignment'], [50, 'g', 'Field Agent'], [150, 'p', 'Special Ops'], [365, 'm', 'Year of Missions']]],
    ['Missions', 'sweep', 'sweeps', 'life', 'Finish all three daily missions on {n} day{s}', 1, '', [[1, 's', 'Clean Sweep'], [7, 'g', 'Week of Wins'], [30, 'p', 'Mission Master'], [100, 'm', 'Perfect Record']]],
    ['Career', 'runs', 'runs', 'life', 'Finish {n} run{s}', 1, '', [[1, 'b', 'Dropping In'], [10, 'b', 'Regular'], [25, 'b', 'Local'], [50, 's', 'Season Pass'], [100, 's', 'Ski Bum'], [250, 'g', 'Lifer'], [500, 'p', 'Mountain Resident'], [1000, 'm', 'One Thousand Drops']]],
    ['Career', 'lmeters', 'meters', 'life', 'Ride {n} m in total', 1, '', [[5000, 'b', 'Getting Around'], [10000, 'b', 'Ten Kilometers Down'], [25000, 's', 'Road Tripper'], [50000, 's', 'Long Distance'], [100000, 'g', 'Cross Country'], [250000, 'p', 'Continental Divide'], [500000, 'p', 'Half a Million'], [1000000, 'm', 'One Million Meters']]],
    ['Career', 'lscore', 'score', 'life', 'Score {n} in total', 1, '', [[25000, 'b', 'Point Collector'], [100000, 's', 'Hundred Grand'], [250000, 'g', 'Quarter Million'], [500000, 'p', 'High Roller'], [1000000, 'p', 'Millionaire'], [5000000, 'm', 'Five Million Club']]],
    ['Career', 'time', 'secs', 'life', 'Ride for {n} in total', 1, 'time', [[600, 'b', 'Ten Minutes In'], [1800, 'b', 'Half Hour Hero'], [3600, 's', 'Hour of Power'], [10800, 'g', 'Three Hour Tour'], [36000, 'p', 'Ten Hour Legend'], [86400, 'm', 'A Full Day on the Mountain']]],
    ['Career', 'crash', 'crashes', 'life', 'Wipe out {n} times', 1, '', [[10, 'b', 'Yard Sale'], [100, 's', 'Face Plant Pro'], [500, 'g', 'Snow Angel']]],
    ['Career', 'bcv', 'bcVisits', 'life', 'Reach the Backcountry in {n} runs', 1, '', [[5, 's', 'Explorer'], [25, 'g', 'Backcountry Regular'], [100, 'p', 'Into the Unknown']]],
    ['Career', 'sumv', 'summitVisits', 'life', 'Reach the Summit in {n} runs', 1, '', [[5, 'p', 'Thin Air'], [25, 'm', 'Sky Walker']]],
    ['Career', 'ghosts', 'ghostPasses', 'life', "Ride past your ghost's wipeout {n} times", 1, '', [[5, 's', 'Ghost Chaser'], [10, 's', 'Ghostbuster'], [25, 'g', 'Self Improvement'], [50, 'p', 'Always Better']]],
    ['Collection', 'spent', 'spent', 'life', 'Spend {n} flakes', 1, '', [[500, 'b', 'Shopper'], [2500, 's', 'Big Spender'], [10000, 'g', 'Whale']]],
    ['Friends', 'races', 'races', 'life', 'Finish {n} live race{s}', 1, '', [[1, 'b', 'Green Light'], [10, 's', 'Regular Racer'], [50, 'g', 'Race Circuit']]],
    ['Friends', 'rwins', 'raceWins', 'life', 'Win {n} live race{s}', 1, '', [[1, 's', 'First Place'], [10, 'g', 'Podium Habit'], [50, 'p', 'Undefeated']]],
    ['Friends', 'gwins', 'ghostWins', 'life', "Beat a friend's ghost {n} time{s}", 1, '', [[1, 'b', 'Ghost of a Chance'], [10, 's', 'Haunting']]],
    ['Specials', 'chal', 'challenges', 'life', 'Send {n} challenge{s} to friends', 1, '', [[1, 'b', 'Trash Talker'], [10, 's', 'Rivalry']]],
  ];
  const upgradeLevels = v => UPG.reduce((n, u) => n + Math.min(u.max, v.up[u.id] || 0), 0);
  const SPECIALS = [
    { cat: 'Distance', id: 'blue', n: 'Blue Skies', t: 'Reach Blue square', tier: 'b', k: 'zone', g: 1, nobar: true },
    { cat: 'Distance', id: 'blk', n: 'Into the Black', t: 'Reach Black diamond', tier: 'b', k: 'zone', g: 2, nobar: true },
    { cat: 'Distance', id: 'dbl', n: 'Double Trouble', t: 'Reach Double black', tier: 's', k: 'zone', g: 3, nobar: true },
    { cat: 'Distance', id: 'bc', n: 'Off the Map', t: 'Reach the Backcountry', tier: 'g', k: 'zone', g: 4, nobar: true },
    { cat: 'Distance', id: 'summit', n: 'Top of the World', t: 'Reach the Summit', tier: 'p', k: 'zone', g: 5, nobar: true },
    { cat: 'Tricks & air', id: 'sketchy', n: 'Sketchy', t: 'Survive a bad landing with a shield', tier: 's', k: 'sketchy', g: 1, nobar: true },
    { cat: 'Career', id: 'lv10', n: 'Rising Rider', t: 'Reach rider level 10', tier: 's', f: () => riderLevel() >= 10 },
    { cat: 'Career', id: 'lv25', n: 'Seasoned', t: 'Reach rider level 25', tier: 'g', f: () => riderLevel() >= 25 },
    { cat: 'Career', id: 'lv50', n: 'Fixture of the Mountain', t: 'Reach rider level 50', tier: 'p', f: () => riderLevel() >= 50 },
    { cat: 'Friends', id: 'buddy', n: 'Buddy System', t: 'Make a friend', tier: 'b', f: () => friendCount() >= 1 },
    { cat: 'Friends', id: 'crew', n: 'Crew', t: 'Have 5 friends', tier: 's', f: () => friendCount() >= 5 },
    { cat: 'Career', id: 'ghost', n: 'Beat Your Ghost', t: 'Ride past where your best run ended', tier: 's', k: 'passedGhost', g: 1, nobar: true },
    { cat: 'Leaderboard', id: 'top10', n: 'Top Ten', t: 'Hold a top 10 spot on the all-time board (15+ riders)', tier: 's', f: () => riderCount >= 15 && rankOn(false) >= 1 && rankOn(false) <= 10 },
    { cat: 'Leaderboard', id: 'top3', n: 'Podium', t: 'Hold a top 3 spot on the all-time board (10+ riders)', tier: 'g', f: () => riderCount >= 10 && rankOn(false) >= 1 && rankOn(false) <= 3 },
    { cat: 'Leaderboard', id: 'dking', n: 'Daily Champion', t: "Hold #1 on today's course (5+ riders)", tier: 'p', f: () => dailyCount >= 5 && rankOn(true) === 1 },
    { cat: 'Leaderboard', id: 'king', n: 'King of the Mountain', t: 'Hold #1 on the all-time board (10+ riders)', tier: 'm', f: () => riderCount >= 10 && rankOn(false) === 1 },
    { cat: 'Specials', id: 'purist', n: 'Purist', t: 'Reach the Backcountry without firing a Flare', tier: 'p', k: 'purist', g: 1, nobar: true },
    { cat: 'Specials', id: 'nosafety', n: 'No Safety Net', t: 'Reach Double black without grabbing or using a shield', tier: 'g', k: 'noShield', g: 1, nobar: true },
    { cat: 'Specials', id: 'grounded', n: 'Feet on the Ground', t: 'Score 5,000 in one run without leaving the ground', tier: 'g', k: 'grounded', g: 1, nobar: true },
    { cat: 'Specials', id: 'dbldown', n: 'Double Down', t: 'Hit a x10 combo while 2X points is active', tier: 'g', k: 'combo2x', g: 1, nobar: true },
    { cat: 'Specials', id: 'owl', n: 'Night Owl', t: 'Start a run between midnight and 4 AM', tier: 'b', k: 'owl', g: 1, nobar: true },
    { cat: 'Specials', id: 'early', n: 'Early Bird', t: 'Start a run between 5 and 8 AM', tier: 'b', k: 'early', g: 1, nobar: true },
    { cat: 'Specials', id: 'tinker', n: 'Tinkerer', t: 'Change a key binding in Settings', tier: 'b', f: (s, v) => !!(v.settings && JSON.stringify(v.settings.keys) !== JSON.stringify(DEF_KEYS)) },
    { cat: 'Collection', id: 'buy', n: 'Retail Therapy', t: 'Buy something at the ski shop', tier: 'b', f: (s, v) => !!v.bought },
    { cat: 'Collection', id: 'max', n: 'Fully Loaded', t: 'Max out any upgrade', tier: 's', f: (s, v) => UPG.some(u => (v.up[u.id] || 0) >= u.max) },
    { cat: 'Collection', id: 'gear5', n: 'Gearing Up', t: 'Own 5 upgrade levels', tier: 's', f: (s, v) => upgradeLevels(v) >= 5 },
    { cat: 'Collection', id: 'allup', n: 'Maxed Out', t: 'Max out every upgrade', tier: 'g', f: (s, v) => upgradeLevels(v) >= UPG.reduce((n, u) => n + u.max, 0) },
    { cat: 'Collection', id: 'skin3', n: 'Fashionista', t: 'Own 3 rider skins', tier: 'b', f: () => ownedSkinCount() >= 3 },
    { cat: 'Collection', id: 'skin6', n: 'Wardrobe', t: 'Own 6 rider skins', tier: 's', f: () => ownedSkinCount() >= 6 },
    { cat: 'Collection', id: 'skin10', n: 'Collector', t: 'Own 10 rider skins', tier: 'g', f: () => ownedSkinCount() >= 10 },
    { cat: 'Collection', id: 'skinall', n: 'Full Closet', t: 'Own every rider skin', tier: 'm', f: () => ownedSkinCount() >= SKINS.length },
    { cat: 'Collection', id: 'flex', n: 'Looking Sharp', t: 'Buy a name color or a title', tier: 'b', f: (s, v) => !!(v.owned && (v.owned.color.length || v.owned.title.length)) },
    { cat: 'Collection', id: 'trails3', n: 'Trailblazer', t: 'Buy 3 trails', tier: 's', f: (s, v) => !!(v.owned && v.owned.trail.length >= 3) },
    { cat: 'Collection', id: 'stylish', n: 'Style Icon', t: 'Own every trail and crash effect', tier: 'g', f: (s, v) => !!(v.owned && TRAILS.every(x => !x.cost || v.owned.trail.includes(x.id)) && CRASHES.every(x => !x.cost || v.owned.crash.includes(x.id))) },
    { cat: 'Specials', id: 'revived', n: 'Not Today', t: 'Use a Second chance', tier: 'b', k: 'revived', g: 1, nobar: true },
    { cat: 'Collection', id: 'quiver', n: 'Quiver Complete', t: 'Unlock every board', tier: 'p', f: () => BOARDS.every((b, i) => boardOwned(i)) },
    { cat: 'Collection', id: 'a10', n: 'Achiever', t: 'Unlock 10 achievements', tier: 'b', f: () => achCount() >= 10 },
    { cat: 'Collection', id: 'a25', n: 'Overachiever', t: 'Unlock 25 achievements', tier: 's', f: () => achCount() >= 25 },
    { cat: 'Collection', id: 'a50', n: 'Trophy Hunter', t: 'Unlock 50 achievements', tier: 's', f: () => achCount() >= 50 },
    { cat: 'Collection', id: 'a100', n: 'Trophy Case', t: 'Unlock 100 achievements', tier: 'g', f: () => achCount() >= 100 },
    { cat: 'Collection', id: 'a150', n: 'Hall of Fame', t: 'Unlock 150 achievements', tier: 'p', f: () => achCount() >= 150 },
    { cat: 'Collection', id: 'a200', n: 'Living Legend', t: 'Unlock 200 achievements', tier: 'm', f: () => achCount() >= 200 },
  ];
  const fmtTarget = (g, div, unit) => {
    if (unit === 'time') return g >= 3600 ? `${fmt(g / 3600)} hour${g === 3600 ? '' : 's'}` : `${fmt(g / 60)} minutes`;
    const v = g / div; return v % 1 ? v.toFixed(1) : fmt(v);
  };
  const ACH = [];
  for (const [cat, fam, k, scope, t, div, unit, tiers] of FAMILIES) for (const [g, tier, n, id] of tiers) {
    const desc = t.replace('{n}', fmtTarget(g, div, unit)).replace('{deg}', g * 360).replace('{s}', g === 1 ? '' : 's').replace('{es}', g === 1 ? '' : 'es');
    ACH.push({ id: id || `${fam}-${g}`, cat, n, t: desc, tier, k, g, scope, div, unit });
  }
  ACH.push(...SPECIALS);
  ACH.push({ cat: 'Collection', id: 'all', n: 'Completionist', t: 'Unlock every other achievement', tier: 'm', f: () => achCount() >= ACH.length - 1 });
  const ACH_IDS = new Set(ACH.map(a => a.id));
  const isAch = id => ACH_IDS.has(id);
  const achCount = () => { let n = 0; for (const id of new Set(save.done)) if (ACH_IDS.has(id)) n++; return n; };
  const rank = achCount;
  const lockedAch = () => { const d = new Set(save.done); return ACH.filter(a => !d.has(a.id)); };
  const achValue = (a, s) => a.scope === 'life' ? (save.life[a.k] || 0) : (s[a.k] || 0);
  const achPass = (a, s) => { try { return a.f ? !!a.f(s, save) : achValue(a, s) >= a.g; } catch (e) { return false; } };
  const achProgSource = a => a.scope === 'life' ? (save.life[a.k] || 0) : (save.bs[a.k] || 0);
  const achProg = a => (a.k && !a.nobar && a.g > 1) ? Math.min(1, achProgSource(a) / a.g) : -1;
  const achProgText = a => {
    const v = Math.min(a.g, achProgSource(a));
    if (a.unit === 'time') return `${fmt(v / 60)} / ${fmt(a.g / 60)} min`;
    const d = a.div || 1, f = x => (x / d) % 1 ? (x / d).toFixed(1) : fmt(x / d);
    return `${f(v)} / ${f(a.g)}${a.unit ? ' ' + a.unit : ''}`;
  };

  const UPG = [
    { id: 'flare', n: 'Long Flare', max: 3, cost: [120, 350, 800], d: l => `Flare lasts ${((200 + 60 * l) / 60).toFixed(1)} s` + (l < 3 ? `, next ${((260 + 60 * l) / 60).toFixed(1)} s.` : '.') },
    { id: 'magnet', n: 'Magnet', max: 3, cost: [100, 300, 700], d: l => l === 0 ? 'Unlocks magnet pickups that pull flakes and lanterns to you.' : `Magnet lasts ${((240 + 150 * l) / 60).toFixed(1)} s` + (l < 3 ? `, next ${((390 + 150 * l) / 60).toFixed(1)} s.` : '.') },
    { id: 'combo', n: 'Steady Nerves', max: 3, cost: [150, 400, 900], d: l => `Combo timer ${((150 + 45 * l) / 60).toFixed(1)} s` + (l < 3 ? `, next ${((195 + 45 * l) / 60).toFixed(1)} s.` : '.') },
    { id: 'shield', n: 'Starter Shield', max: 1, cost: [600], d: l => l ? 'Every run starts with a shield.' : 'Start every run with a shield already on.' },
    { id: 'soft', n: 'Soft Landing', max: 3, cost: [250, 600, 1200], d: l => `Ride away from landings up to ${landDeg(l)}\u00b0 crooked` + (l < 3 ? `, next ${landDeg(l + 1)}\u00b0.` : '.') },
    { id: 'lucky', n: 'Lucky Flakes', max: 3, cost: [400, 900, 1800], d: l => (l ? `+${l * 10}% flakes from every run` : 'Earn more flakes from every run') + (l < 3 ? `, next +${(l + 1) * 10}%.` : '.') },
    { id: 'grind', n: 'Grind Master', max: 3, cost: [300, 700, 1400], d: l => (l ? `Rails score ${100 + 25 * l}%` : 'Score more on rails') + (l < 3 ? `, next ${125 + 25 * l}%.` : '.') },
  ];
  const flareDur = () => 200 + 60 * save.up.flare;
  const landTol = () => 0.8 + 0.12 * (save.up.soft || 0);
  const landDeg = l => Math.round((0.8 + 0.12 * l) * 180 / Math.PI);
  const comboWin = () => 150 + 45 * save.up.combo;
  const magnetDur = () => 240 + 150 * save.up.magnet;

  const ZONES = [
    { at: 0,    name: 'Green circle', color: '#3ddc84', shape: 'circle' },
    { at: 250,  name: 'Blue square',  color: '#4aa3ff', shape: 'square' },
    { at: 650,  name: 'Black diamond', color: '#e8eef7', shape: 'diamond' },
    { at: 1200, name: 'Double black', color: '#ff5577', shape: 'double' },
    { at: 2400, name: 'Backcountry', color: '#ffb347', shape: 'warn' },
    { at: 4000, name: 'Summit', color: '#cdb4ff', shape: 'peak' },
  ];

