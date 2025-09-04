import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';

SQLite.enablePromise(true);

export const getDBConnection = async (): Promise<SQLiteDatabase> => {
 const db= SQLite.openDatabase({ name: 'mydb.db', location: 'default' });
 return db
};



export const createSubjectTable = async (db: SQLiteDatabase): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS subject (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      teacher_name TEXT,
      abbreviation TEXT,
      semester TEXT,
      active_subject INTEGER,
      date TEXT
    );
  `;
  await db.executeSql(query);
};

export const createImageTable = async (db: SQLiteDatabase): Promise<void> => {
  const query = `
    CREATE TABLE IF NOT EXISTS image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject_id INTEGER NOT NULL,
      image_uri TEXT NOT NULL,
      FOREIGN KEY (subject_id) REFERENCES subject(id) ON DELETE CASCADE
    );
  `;
  await db.executeSql(query);
};

export const setupDatabaseTables = async (): Promise<void> => {
  const db = await getDBConnection();
  await createSubjectTable(db);
  await createImageTable(db);
};

export const addSubject = async (
  db: SQLiteDatabase,
  subject: {
    name: string;
    teacher_name?: string;
    abbreviation?: string;
    semester?: string;
    active_subject?: number;
    date?: string;
  }
): Promise<void> => {
  const query = `
    INSERT INTO subject (name, teacher_name, abbreviation, semester, active_subject, date)
    VALUES (?, ?, ?, ?, ?, ?);
  `;

  const values = [
    subject.name,
    subject.teacher_name ?? null,
    subject.abbreviation ?? null,
    subject.semester ?? null,
    subject.active_subject ?? 1,
    subject.date ?? new Date().toISOString()
  ];

  await db.executeSql(query, values);
};


export const getAllSubjects = async (db: SQLiteDatabase): Promise<any[]> => {
  const query = `SELECT * FROM subject ORDER BY id DESC;`;
  const results = await db.executeSql(query);
  const subjects: any[] = [];

  for (let i = 0; i < results[0].rows.length; i++) {
    subjects.push(results[0].rows.item(i));
  }

  return subjects;
};

export const deleteSubjectById =async (db: SQLiteDatabase, subjectId: number): Promise<void> => {
  try {
    // 1. Pehle is subject ke sare image paths nikal lo
    const results = await db.executeSql(
      `SELECT image_uri FROM image WHERE subject_id = ?;`,
      [subjectId]
    );

    const imageUris: string[] = [];
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows.item(i);
        imageUris.push(row.image_uri);
      }
    });

    // 2. Filesystem se images delete karo
    for (const uri of imageUris) {
      try {
        const exists = await RNFS.exists(uri);
        if (exists) {
          await RNFS.unlink(uri);
          console.log(`Deleted file: ${uri}`);
        }
      } catch (err) {
        console.error(`File delete error (${uri}):`, err);
      }
    }

    // 3. Subject delete karo → images DB se auto-delete (CASCADE)
    await db.executeSql(`DELETE FROM subject WHERE id = ?;`, [subjectId]);

    console.log(`✅ Subject ${subjectId} and its images deleted`);
  } catch (err) {
    console.error('Delete subject and images error:', err);
    throw err;
  }
};

export const getSubjectById = async (db: SQLiteDatabase, subjectId: number): Promise<Subject | null> => {
  const query = `SELECT * FROM subject WHERE id = ?;`;
  const results = await db.executeSql(query, [subjectId]);

  if (results[0].rows.length > 0) {
    return results[0].rows.item(0) as Subject;
  }

  return null;
};

export const updateSubject = async (
  db: SQLiteDatabase,
  id: number,
  updatedData: {
    name: string;
    teacher_name?: string;
    abbreviation?: string;
    semester?: string;
    active_subject?: number;
    date?: string;
  }
): Promise<void> => {
  const query = `
    UPDATE subject
    SET name = ?, teacher_name = ?, abbreviation = ?, semester = ?, active_subject = ?, date = ?
    WHERE id = ?;
  `;
  const values = [
    updatedData.name,
    updatedData.teacher_name ?? null,
    updatedData.abbreviation ?? null,
    updatedData.semester ?? null,
    updatedData.active_subject ?? 1,
    updatedData.date ?? new Date().toISOString(),
    id
  ];
  await db.executeSql(query, values);
};

export const getActiveSubjects = async (db: SQLiteDatabase): Promise<any[]> => {
  const query = `SELECT * FROM subject WHERE active_subject = 1 ORDER BY id DESC;`;
  const results = await db.executeSql(query);
  const subjects: any[] = [];

  for (let i = 0; i < results[0].rows.length; i++) {
    subjects.push(results[0].rows.item(i));
  }

  return subjects;
};

export const addImages = async (
  db: SQLiteDatabase,
  subjectId: number,
  imageUris: string[]
): Promise<void> => {
  const query = `
    INSERT INTO image (subject_id, image_uri)
    VALUES (?, ?);
  `;

  const insertPromises = imageUris.map(uri =>
    db.executeSql(query, [subjectId, uri])
  );

  await Promise.all(insertPromises); // Run all inserts in parallel
};

export const getImageById = async (
  db: SQLiteDatabase,
  imageId: number
): Promise<any | null> => {
  const query = `SELECT * FROM image WHERE id = ?;`;
  const result = await db.executeSql(query, [imageId]);

  if (result[0].rows.length > 0) {
    return result[0].rows.item(0);
  }

  return null;
};

export const getImagesBySubjectId = async (
  db: SQLiteDatabase,
  subjectId: number
): Promise<any[]> => {
  const query = `SELECT * FROM image WHERE subject_id = ? ORDER BY id DESC;`;
  const result = await db.executeSql(query, [subjectId]);

  const images: any[] = [];
  for (let i = 0; i < result[0].rows.length; i++) {
    images.push(result[0].rows.item(i));
  }

  return images;
};

export const deleteImagesByUri = async (db: SQLiteDatabase, uris: string[]) => {
  if (!uris || uris.length === 0) return;

  // Normalize URIs for DB (remove file:// if present)
  const cleanUris = uris.map(u => (typeof u === 'string' ? u.replace(/^file:\/\//, '') : u));

  // Delete rows from DB using normalized paths
  const placeholders = cleanUris.map(() => '?').join(',');
  await db.executeSql(`DELETE FROM image WHERE image_uri IN (${placeholders})`, cleanUris);

  // Now remove actual files from disk using same normalized paths
  for (const cleanPath of cleanUris) {
    try {
      // If the record stored a content:// uri it won't exist as a file path.
      // Try both cleanPath and with file:// prefix for safety.
      const existsPlain = await RNFS.exists(cleanPath);
      if (existsPlain) {
        await RNFS.unlink(cleanPath);
        console.log(`Deleted file: ${cleanPath}`);
        continue;
      }

      const withFilePrefix = `file://${cleanPath}`;
      const existsPrefixed = await RNFS.exists(withFilePrefix);
      if (existsPrefixed) {
        await RNFS.unlink(withFilePrefix);
        console.log(`Deleted file (prefixed): ${withFilePrefix}`);
        continue;
      }

      console.log(`File not found (not deleted): ${cleanPath}`);
    } catch (error) {
      console.error('File delete error:', error);
    }
  }
};


export type Subject = {
  icon: "0" | "sort" | "map" | "filter" | "fill" | "at" | "scroll" | "bold" | "children" | "key" | "file-pdf" | "1" | "font-awesome" | "address-book" | "address-card" | "bell-slash" | "bell" | "bookmark" | "building" | "calendar-check" | "calendar-days" | "calendar-minus" | "calendar-plus" | "calendar-xmark" | "calendar" | "chart-bar" | "chess-bishop" | "chess-king" | "chess-knight" | "chess-pawn" | "chess-queen" | "chess-rook" | "circle-check" | "circle-dot" | "circle-down" | "circle-left" | "circle-pause" | "circle-play" | "circle-question" | "circle-right" | "circle-stop" | "circle-up" | "circle-user" | "circle-xmark" | "circle" | "clipboard" | "clock" | "clone" | "closed-captioning" | "comment-dots" | "comment" | "comments" | "compass" | "copy" | "copyright" | "credit-card" | "envelope-open" | "envelope" | "eye-slash" | "eye" | "face-angry" | "face-dizzy" | "face-flushed" | "face-frown-open" | "face-frown" | "face-grimace" | "face-grin-beam-sweat" | "face-grin-beam" | "face-grin-hearts" | "face-grin-squint-tears" | "face-grin-squint" | "face-grin-stars" | "face-grin-tears" | "face-grin-tongue-squint" | "face-grin-tongue-wink" | "face-grin-tongue" | "face-grin-wide" | "face-grin-wink" | "face-grin" | "face-kiss-beam" | "face-kiss-wink-heart" | "face-kiss" | "face-laugh-beam" | "face-laugh-squint" | "face-laugh-wink" | "face-laugh" | "face-meh-blank" | "face-meh" | "face-rolling-eyes" | "face-sad-cry" | "face-sad-tear" | "face-smile-beam" | "face-smile-wink" | "face-smile" | "face-surprise" | "face-tired" | "file-audio" | "file-code" | "file-excel" | "file-image" | "file-lines" | "file-powerpoint" | "file-video" | "file-word" | "file-zipper" | "file" | "flag" | "floppy-disk" | "folder-closed" | "folder-open" | "folder" | "futbol" | "gem" | "hand-back-fist" | "hand-lizard" | "hand-peace" | "hand-point-down" | "hand-point-left" | "hand-point-right" | "hand-point-up" | "hand-pointer" | "hand-scissors" | "hand-spock" | "hand" | "handshake" | "hard-drive" | "heart" | "hospital" | "hourglass-half" | "hourglass" | "id-badge" | "id-card" | "image" | "images" | "keyboard" | "lemon" | "life-ring" | "lightbulb" | "message" | "money-bill-1" | "moon" | "newspaper" | "note-sticky" | "object-group" | "object-ungroup" | "paper-plane" | "paste" | "pen-to-square" | "rectangle-list" | "rectangle-xmark" | "registered" | "share-from-square" | "snowflake" | "square-caret-down" | "square-caret-left" | "square-caret-right" | "square-caret-up" | "square-check" | "square-full" | "square-minus" | "square-plus" | "square" | "star-half-stroke" | "star-half" | "star" | "sun" | "thumbs-down" | "thumbs-up" | "trash-can" | "user" | "window-maximize" | "window-minimize" | "window-restore" | "web-awesome" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "a" | "align-center" | "align-justify" | "align-left" | "align-right" | "anchor-circle-check" | "anchor-circle-exclamation" | "anchor-circle-xmark" | "anchor-lock" | "anchor" | "angle-down" | "angle-left" | "angle-right" | "angle-up" | "angles-down" | "angles-left" | "angles-right" | "angles-up" | "ankh" | "apple-whole" | "archway" | "arrow-down-1-9" | "arrow-down-9-1" | "arrow-down-a-z" | "arrow-down-long" | "arrow-down-short-wide" | "arrow-down-up-across-line" | "arrow-down-up-lock" | "arrow-down-wide-short" | "arrow-down-z-a" | "arrow-down" | "arrow-left-long" | "arrow-left" | "arrow-pointer" | "arrow-right-arrow-left" | "arrow-right-from-bracket" | "arrow-right-long" | "arrow-right-to-bracket" | "arrow-right-to-city" | "arrow-right" | "arrow-rotate-left" | "arrow-rotate-right" | "arrow-trend-down" | "arrow-trend-up" | "arrow-turn-down" | "arrow-turn-up" | "arrow-up-1-9" | "arrow-up-9-1" | "arrow-up-a-z" | "arrow-up-from-bracket" | "arrow-up-from-ground-water" | "arrow-up-from-water-pump" | "arrow-up-long" | "arrow-up-right-dots" | "arrow-up-right-from-square" | "arrow-up-short-wide" | "arrow-up-wide-short" | "arrow-up-z-a" | "arrow-up" | "arrows-down-to-line" | "arrows-down-to-people" | "arrows-left-right-to-line" | "arrows-left-right" | "arrows-rotate" | "arrows-spin" | "arrows-split-up-and-left" | "arrows-to-circle" | "arrows-to-dot" | "arrows-to-eye" | "arrows-turn-right" | "arrows-turn-to-dots" | "arrows-up-down-left-right" | "arrows-up-down" | "arrows-up-to-line" | "asterisk" | "atom" | "audio-description" | "austral-sign" | "award" | "b" | "baby-carriage" | "baby" | "backward-fast" | "backward-step" | "backward" | "bacon" | "bacteria" | "bacterium" | "bag-shopping" | "bahai" | "baht-sign" | "ban-smoking" | "ban" | "bandage" | "bangladeshi-taka-sign" | "barcode" | "bars-progress" | "bars-staggered" | "bars" | "baseball-bat-ball" | "baseball" | "basket-shopping" | "basketball" | "bath" | "battery-empty" | "battery-full" | "battery-half" | "battery-quarter" | "battery-three-quarters" | "bed-pulse" | "bed" | "beer-mug-empty" | "bell-concierge" | "bezier-curve" | "bicycle" | "binoculars" | "biohazard" | "bitcoin-sign" | "blender-phone" | "blender" | "blog" | "bolt-lightning" | "bolt" | "bomb" | "bone" | "bong" | "book-atlas" | "book-bible" | "book-bookmark" | "book-journal-whills" | "book-medical" | "book-open-reader" | "book-open" | "book-quran" | "book-skull" | "book-tanakh" | "book" | "border-all" | "border-none" | "border-top-left" | "bore-hole" | "bottle-droplet" | "bottle-water" | "bowl-food" | "bowl-rice" | "bowling-ball" | "box-archive" | "box-open" | "box-tissue" | "box" | "boxes-packing" | "boxes-stacked" | "braille" | "brain" | "brazilian-real-sign" | "bread-slice" | "bridge-circle-check" | "bridge-circle-exclamation" | "bridge-circle-xmark" | "bridge-lock" | "bridge-water" | "bridge" | "briefcase-medical" | "briefcase" | "broom-ball" | "broom" | "brush" | "bucket" | "bug-slash" | "bug" | "bugs" | "building-circle-arrow-right" | "building-circle-check" | "building-circle-exclamation" | "building-circle-xmark" | "building-columns" | "building-flag" | "building-lock" | "building-ngo" | "building-shield" | "building-un" | "building-user" | "building-wheat" | "bullhorn" | "bullseye" | "burger" | "burst" | "bus-simple" | "bus" | "business-time" | "c" | "cable-car" | "cake-candles" | "calculator" | "calendar-day" | "calendar-week" | "camera-retro" | "camera-rotate" | "camera" | "campground" | "candy-cane" | "cannabis" | "capsules" | "car-battery" | "car-burst" | "car-on" | "car-rear" | "car-side" | "car-tunnel" | "car" | "caravan" | "caret-down" | "caret-left" | "caret-right" | "caret-up" | "carrot" | "cart-arrow-down" | "cart-flatbed-suitcase" | "cart-flatbed" | "cart-plus" | "cart-shopping" | "cash-register" | "cat" | "cedi-sign" | "cent-sign" | "certificate" | "chair" | "chalkboard-user" | "chalkboard" | "champagne-glasses" | "charging-station" | "chart-area" | "chart-column" | "chart-diagram" | "chart-gantt" | "chart-line" | "chart-pie" | "chart-simple" | "check-double" | "check-to-slot" | "check" | "cheese" | "chess-board" | "chess" | "chevron-down" | "chevron-left" | "chevron-right" | "chevron-up" | "child-combatant" | "child-dress" | "child-reaching" | "child" | "church" | "circle-arrow-down" | "circle-arrow-left" | "circle-arrow-right" | "circle-arrow-up" | "circle-chevron-down" | "circle-chevron-left" | "circle-chevron-right" | "circle-chevron-up" | "circle-dollar-to-slot" | "circle-exclamation" | "circle-h" | "circle-half-stroke" | "circle-info" | "circle-minus" | "circle-nodes" | "circle-notch" | "circle-plus" | "circle-radiation" | "city" | "clapperboard" | "clipboard-check" | "clipboard-list" | "clipboard-question" | "clipboard-user" | "clock-rotate-left" | "cloud-arrow-down" | "cloud-arrow-up" | "cloud-bolt" | "cloud-meatball" | "cloud-moon-rain" | "cloud-moon" | "cloud-rain" | "cloud-showers-heavy" | "cloud-showers-water" | "cloud-sun-rain" | "cloud-sun" | "cloud" | "clover" | "code-branch" | "code-commit" | "code-compare" | "code-fork" | "code-merge" | "code-pull-request" | "code" | "coins" | "colon-sign" | "comment-dollar" | "comment-medical" | "comment-nodes" | "comment-slash" | "comment-sms" | "comments-dollar" | "compact-disc" | "compass-drafting" | "compress" | "computer-mouse" | "computer" | "cookie-bite" | "cookie" | "couch" | "cow" | "crop-simple" | "crop" | "cross" | "crosshairs" | "crow" | "crown" | "crutch" | "cruzeiro-sign" | "cube" | "cubes-stacked" | "cubes" | "d" | "database" | "delete-left" | "democrat" | "desktop" | "dharmachakra" | "diagram-next" | "diagram-predecessor" | "diagram-project" | "diagram-successor" | "diamond-turn-right" | "diamond" | "dice-d20" | "dice-d6" | "dice-five" | "dice-four" | "dice-one" | "dice-six" | "dice-three" | "dice-two" | "dice" | "disease" | "display" | "divide" | "dna" | "dog" | "dollar-sign" | "dolly" | "dong-sign" | "door-closed" | "door-open" | "dove" | "down-left-and-up-right-to-center" | "down-long" | "download" | "dragon" | "draw-polygon" | "droplet-slash" | "droplet" | "drum-steelpan" | "drum" | "drumstick-bite" | "dumbbell" | "dumpster-fire" | "dumpster" | "dungeon" | "e" | "ear-deaf" | "ear-listen" | "earth-africa" | "earth-americas" | "earth-asia" | "earth-europe" | "earth-oceania" | "egg" | "eject" | "elevator" | "ellipsis-vertical" | "ellipsis" | "envelope-circle-check" | "envelope-open-text" | "envelopes-bulk" | "equals" | "eraser" | "ethernet" | "euro-sign" | "exclamation" | "expand" | "explosion" | "eye-dropper" | "eye-low-vision" | "f" | "fan" | "faucet-drip" | "faucet" | "fax" | "feather-pointed" | "feather" | "ferry" | "file-arrow-down" | "file-arrow-up" | "file-circle-check" | "file-circle-exclamation" | "file-circle-minus" | "file-circle-plus" | "file-circle-question" | "file-circle-xmark" | "file-contract" | "file-csv" | "file-export" | "file-fragment" | "file-half-dashed" | "file-import" | "file-invoice-dollar" | "file-invoice" | "file-medical" | "file-pen" | "file-prescription" | "file-shield" | "file-signature" | "file-waveform" | "fill-drip" | "film" | "filter-circle-dollar" | "filter-circle-xmark" | "fingerprint" | "fire-burner" | "fire-extinguisher" | "fire-flame-curved" | "fire-flame-simple" | "fire" | "fish-fins" | "fish" | "flag-checkered" | "flag-usa" | "flask-vial" | "flask" | "florin-sign" | "folder-minus" | "folder-plus" | "folder-tree" | "font" | "football" | "forward-fast" | "forward-step" | "forward" | "franc-sign" | "frog" | "g" | "gamepad" | "gas-pump" | "gauge-high" | "gauge-simple-high" | "gauge-simple" | "gauge" | "gavel" | "gear" | "gears" | "genderless" | "ghost" | "gift" | "gifts" | "glass-water-droplet" | "glass-water" | "glasses" | "globe" | "golf-ball-tee" | "gopuram" | "graduation-cap" | "greater-than-equal" | "greater-than" | "grip-lines-vertical" | "grip-lines" | "grip-vertical" | "grip" | "group-arrows-rotate" | "guarani-sign" | "guitar" | "gun" | "h" | "hammer" | "hamsa" | "hand-dots" | "hand-fist" | "hand-holding-dollar" | "hand-holding-droplet" | "hand-holding-hand" | "hand-holding-heart" | "hand-holding-medical" | "hand-holding" | "hand-middle-finger" | "hand-sparkles" | "handcuffs" | "hands-asl-interpreting" | "hands-bound" | "hands-bubbles" | "hands-clapping" | "hands-holding-child" | "hands-holding-circle" | "hands-holding" | "hands-praying" | "hands" | "handshake-angle" | "handshake-simple-slash" | "handshake-simple" | "handshake-slash" | "hanukiah" | "hashtag" | "hat-cowboy-side" | "hat-cowboy" | "hat-wizard" | "head-side-cough-slash" | "head-side-cough" | "head-side-mask" | "head-side-virus" | "heading" | "headphones-simple" | "headphones" | "headset" | "heart-circle-bolt" | "heart-circle-check" | "heart-circle-exclamation" | "heart-circle-minus" | "heart-circle-plus" | "heart-circle-xmark" | "heart-crack" | "heart-pulse" | "helicopter-symbol" | "helicopter" | "helmet-safety" | "helmet-un" | "hexagon-nodes-bolt" | "hexagon-nodes" | "highlighter" | "hill-avalanche" | "hill-rockslide" | "hippo" | "hockey-puck" | "holly-berry" | "horse-head" | "horse" | "hospital-user" | "hot-tub-person" | "hotdog" | "hotel" | "hourglass-end" | "hourglass-start" | "house-chimney-crack" | "house-chimney-medical" | "house-chimney-user" | "house-chimney-window" | "house-chimney" | "house-circle-check" | "house-circle-exclamation" | "house-circle-xmark" | "house-crack" | "house-fire" | "house-flag" | "house-flood-water-circle-arrow-right" | "house-flood-water" | "house-laptop" | "house-lock" | "house-medical-circle-check" | "house-medical-circle-exclamation" | "house-medical-circle-xmark" | "house-medical-flag" | "house-medical" | "house-signal" | "house-tsunami" | "house-user" | "house" | "hryvnia-sign" | "hurricane" | "i-cursor" | "i" | "ice-cream" | "icicles" | "icons" | "id-card-clip" | "igloo" | "image-portrait" | "inbox" | "indent" | "indian-rupee-sign" | "industry" | "infinity" | "info" | "italic" | "j" | "jar-wheat" | "jar" | "jedi" | "jet-fighter-up" | "jet-fighter" | "joint" | "jug-detergent" | "k" | "kaaba" | "khanda" | "kip-sign" | "kit-medical" | "kitchen-set" | "kiwi-bird" | "l" | "land-mine-on" | "landmark-dome" | "landmark-flag" | "landmark" | "language" | "laptop-code" | "laptop-file" | "laptop-medical" | "laptop" | "lari-sign" | "layer-group" | "leaf" | "left-long" | "left-right" | "less-than-equal" | "less-than" | "lines-leaning" | "link-slash" | "link" | "lira-sign" | "list-check" | "list-ol" | "list-ul" | "list" | "litecoin-sign" | "location-arrow" | "location-crosshairs" | "location-dot" | "location-pin-lock" | "location-pin" | "lock-open" | "lock" | "locust" | "lungs-virus" | "lungs" | "m" | "magnet" | "magnifying-glass-arrow-right" | "magnifying-glass-chart" | "magnifying-glass-dollar" | "magnifying-glass-location" | "magnifying-glass-minus" | "magnifying-glass-plus" | "magnifying-glass" | "manat-sign" | "map-location-dot" | "map-location" | "map-pin" | "marker" | "mars-and-venus-burst" | "mars-and-venus" | "mars-double" | "mars-stroke-right" | "mars-stroke-up" | "mars-stroke" | "mars" | "martini-glass-citrus" | "martini-glass-empty" | "martini-glass" | "mask-face" | "mask-ventilator" | "mask" | "masks-theater" | "mattress-pillow" | "maximize" | "medal" | "memory" | "menorah" | "mercury" | "meteor" | "microchip" | "microphone-lines-slash" | "microphone-lines" | "microphone-slash" | "microphone" | "microscope" | "mill-sign" | "minimize" | "minus" | "mitten" | "mobile-button" | "mobile-retro" | "mobile-screen-button" | "mobile-screen" | "mobile" | "money-bill-1-wave" | "money-bill-transfer" | "money-bill-trend-up" | "money-bill-wave" | "money-bill-wheat" | "money-bill" | "money-bills" | "money-check-dollar" | "money-check" | "monument" | "mortar-pestle" | "mosque" | "mosquito-net" | "mosquito" | "motorcycle" | "mound" | "mountain-city" | "mountain-sun" | "mountain" | "mug-hot" | "mug-saucer" | "music" | "n" | "naira-sign" | "network-wired" | "neuter" | "not-equal" | "notdef" | "notes-medical" | "o" | "oil-can" | "oil-well" | "om" | "otter" | "outdent" | "p" | "pager" | "paint-roller" | "paintbrush" | "palette" | "pallet" | "panorama" | "paperclip" | "parachute-box" | "paragraph" | "passport" | "pause" | "paw" | "peace" | "pen-clip" | "pen-fancy" | "pen-nib" | "pen-ruler" | "pen" | "pencil" | "people-arrows" | "people-carry-box" | "people-group" | "people-line" | "people-pulling" | "people-robbery" | "people-roof" | "pepper-hot" | "percent" | "person-arrow-down-to-line" | "person-arrow-up-from-line" | "person-biking" | "person-booth" | "person-breastfeeding" | "person-burst" | "person-cane" | "person-chalkboard" | "person-circle-check" | "person-circle-exclamation" | "person-circle-minus" | "person-circle-plus" | "person-circle-question" | "person-circle-xmark" | "person-digging" | "person-dots-from-line" | "person-dress-burst" | "person-dress" | "person-drowning" | "person-falling-burst" | "person-falling" | "person-half-dress" | "person-harassing" | "person-hiking" | "person-military-pointing" | "person-military-rifle" | "person-military-to-person" | "person-praying" | "person-pregnant" | "person-rays" | "person-rifle" | "person-running" | "person-shelter" | "person-skating" | "person-skiing-nordic" | "person-skiing" | "person-snowboarding" | "person-swimming" | "person-through-window" | "person-walking-arrow-loop-left" | "person-walking-arrow-right" | "person-walking-dashed-line-arrow-right" | "person-walking-luggage" | "person-walking-with-cane" | "person-walking" | "person" | "peseta-sign" | "peso-sign" | "phone-flip" | "phone-slash" | "phone-volume" | "phone" | "photo-film" | "piggy-bank" | "pills" | "pizza-slice" | "place-of-worship" | "plane-arrival" | "plane-circle-check" | "plane-circle-exclamation" | "plane-circle-xmark" | "plane-departure" | "plane-lock" | "plane-slash" | "plane-up" | "plane" | "plant-wilt" | "plate-wheat" | "play" | "plug-circle-bolt" | "plug-circle-check" | "plug-circle-exclamation" | "plug-circle-minus" | "plug-circle-plus" | "plug-circle-xmark" | "plug" | "plus-minus" | "plus" | "podcast" | "poo-storm" | "poo" | "poop" | "power-off" | "prescription-bottle-medical" | "prescription-bottle" | "prescription" | "print" | "pump-medical" | "pump-soap" | "puzzle-piece" | "q" | "qrcode" | "question" | "quote-left" | "quote-right" | "r" | "radiation" | "radio" | "rainbow" | "ranking-star" | "receipt" | "record-vinyl" | "rectangle-ad" | "recycle" | "repeat" | "reply-all" | "reply" | "republican" | "restroom" | "retweet" | "ribbon" | "right-from-bracket" | "right-left" | "right-long" | "right-to-bracket" | "ring" | "road-barrier" | "road-bridge" | "road-circle-check" | "road-circle-exclamation" | "road-circle-xmark" | "road-lock" | "road-spikes" | "road" | "robot" | "rocket" | "rotate-left" | "rotate-right" | "rotate" | "route" | "rss" | "ruble-sign" | "rug" | "ruler-combined" | "ruler-horizontal" | "ruler-vertical" | "ruler" | "rupee-sign" | "rupiah-sign" | "s" | "sack-dollar" | "sack-xmark" | "sailboat" | "satellite-dish" | "satellite" | "scale-balanced" | "scale-unbalanced-flip" | "scale-unbalanced" | "school-circle-check" | "school-circle-exclamation" | "school-circle-xmark" | "school-flag" | "school-lock" | "school" | "scissors" | "screwdriver-wrench" | "screwdriver" | "scroll-torah" | "sd-card" | "section" | "seedling" | "server" | "shapes" | "share-nodes" | "share" | "sheet-plastic" | "shekel-sign" | "shield-cat" | "shield-dog" | "shield-halved" | "shield-heart" | "shield-virus" | "shield" | "ship" | "shirt" | "shoe-prints" | "shop-lock" | "shop-slash" | "shop" | "shower" | "shrimp" | "shuffle" | "shuttle-space" | "sign-hanging" | "signal" | "signature" | "signs-post" | "sim-card" | "sink" | "sitemap" | "skull-crossbones" | "skull" | "slash" | "sleigh" | "sliders" | "smog" | "smoking" | "snowman" | "snowplow" | "soap" | "socks" | "solar-panel" | "sort-down" | "sort-up" | "spa" | "spaghetti-monster-flying" | "spell-check" | "spider" | "spinner" | "splotch" | "spoon" | "spray-can-sparkles" | "spray-can" | "square-arrow-up-right" | "square-binary" | "square-envelope" | "square-h" | "square-nfi" | "square-parking" | "square-pen" | "square-person-confined" | "square-phone-flip" | "square-phone" | "square-poll-horizontal" | "square-poll-vertical" | "square-root-variable" | "square-rss" | "square-share-nodes" | "square-up-right" | "square-virus" | "square-xmark" | "staff-snake" | "stairs" | "stamp" | "stapler" | "star-and-crescent" | "star-of-david" | "star-of-life" | "sterling-sign" | "stethoscope" | "stop" | "stopwatch-20" | "stopwatch" | "store-slash" | "store" | "street-view" | "strikethrough" | "stroopwafel" | "subscript" | "suitcase-medical" | "suitcase-rolling" | "suitcase" | "sun-plant-wilt" | "superscript" | "swatchbook" | "synagogue" | "syringe" | "t" | "table-cells-column-lock" | "table-cells-large" | "table-cells-row-lock" | "table-cells-row-unlock" | "table-cells" | "table-columns" | "table-list" | "table-tennis-paddle-ball" | "table" | "tablet-button" | "tablet-screen-button" | "tablet" | "tablets" | "tachograph-digital" | "tag" | "tags" | "tape" | "tarp-droplet" | "tarp" | "taxi" | "teeth-open" | "teeth" | "temperature-arrow-down" | "temperature-arrow-up" | "temperature-empty" | "temperature-full" | "temperature-half" | "temperature-high" | "temperature-low" | "temperature-quarter" | "temperature-three-quarters" | "tenge-sign" | "tent-arrow-down-to-line" | "tent-arrow-left-right" | "tent-arrow-turn-left" | "tent-arrows-down" | "tent" | "tents" | "terminal" | "text-height" | "text-slash" | "text-width" | "thermometer" | "thumbtack-slash" | "thumbtack" | "ticket-simple" | "ticket" | "timeline" | "toggle-off" | "toggle-on" | "toilet-paper-slash" | "toilet-paper" | "toilet-portable" | "toilet" | "toilets-portable" | "toolbox" | "tooth" | "torii-gate" | "tornado" | "tower-broadcast" | "tower-cell" | "tower-observation" | "tractor" | "trademark" | "traffic-light" | "trailer" | "train-subway" | "train-tram" | "train" | "transgender" | "trash-arrow-up" | "trash-can-arrow-up" | "trash" | "tree-city" | "tree" | "triangle-exclamation" | "trophy" | "trowel-bricks" | "trowel" | "truck-arrow-right" | "truck-droplet" | "truck-fast" | "truck-field-un" | "truck-field" | "truck-front" | "truck-medical" | "truck-monster" | "truck-moving" | "truck-pickup" | "truck-plane" | "truck-ramp-box" | "truck" | "tty" | "turkish-lira-sign" | "turn-down" | "turn-up" | "tv" | "u" | "umbrella-beach" | "umbrella" | "underline" | "universal-access" | "unlock-keyhole" | "unlock" | "up-down-left-right" | "up-down" | "up-long" | "up-right-and-down-left-from-center" | "up-right-from-square" | "upload" | "user-astronaut" | "user-check" | "user-clock" | "user-doctor" | "user-gear" | "user-graduate" | "user-group" | "user-injured" | "user-large-slash" | "user-large" | "user-lock" | "user-minus" | "user-ninja" | "user-nurse" | "user-pen" | "user-plus" | "user-secret" | "user-shield" | "user-slash" | "user-tag" | "user-tie" | "user-xmark" | "users-between-lines" | "users-gear" | "users-line" | "users-rays" | "users-rectangle" | "users-slash" | "users-viewfinder" | "users" | "utensils" | "v" | "van-shuttle" | "vault" | "vector-square" | "venus-double" | "venus-mars" | "venus" | "vest-patches" | "vest" | "vial-circle-check" | "vial-virus" | "vial" | "vials" | "video-slash" | "video" | "vihara" | "virus-covid-slash" | "virus-covid" | "virus-slash" | "virus" | "viruses" | "voicemail" | "volcano" | "volleyball" | "volume-high" | "volume-low" | "volume-off" | "volume-xmark" | "vr-cardboard" | "w" | "walkie-talkie" | "wallet" | "wand-magic-sparkles" | "wand-magic" | "wand-sparkles" | "warehouse" | "water-ladder" | "water" | "wave-square" | "weight-hanging" | "weight-scale" | "wheat-awn-circle-exclamation" | "wheat-awn" | "wheelchair-move" | "wheelchair" | "whiskey-glass" | "wifi" | "wind" | "wine-bottle" | "wine-glass-empty" | "wine-glass" | "won-sign" | "worm" | "wrench" | "x-ray" | "x" | "xmark" | "xmarks-lines" | "y" | "yen-sign" | "yin-yang" | "z";
  nav: ((event: GestureResponderEvent) => void) | undefined;
  id?: number;
  name: string;
  teacher_name?: string;
  abbreviation?: string;
  semester?: string;
  active_subject?: number;
  date?: string;
};