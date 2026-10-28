// sprites.mjs — side-view ASCII sprites for Langit ASCII

const ADVANCE_RATIO = 0.6;

const WOOD_CHARS = new Set("|/\\_-()");
const LEAF_CHARS = new Set(".,'*o");

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function birdCellPx(species, depth, height) {
  const birdBaseFont = clamp(Math.round(height / 90), 8, 18);
  return clamp(Math.round(birdBaseFont * species.size * (0.5 + 0.6 * depth)), 6, 44);
}

// 13 species
// Profile facing right: one eye 'o', beak '>'
// Allowed symbols: body #%@; wing edges /\; trailing edges _-'; feather tips ,'; eye o; beak >; tail ~; mythic glow *; spaces
const SPECIES = [
  {
    id: "sparrow",
    name: "Sparrow",
    vernacular: "Pipit",
    group: "wild",
    weight: 4.0,
    size: 0.72,
    cruise: 150,
    flapHz: 5.5,
    glide: 0.05,
    canPerch: true,
    accent: "#8aa6b8",
    cols: 10,
    rows: 5,
    frames: [
      // up
      [
        "   /\\     ",
        "  /%%\\    ",
        "~(####o#> ",
        "  \\####/  ",
        "          "
      ],
      // level
      [
        "          ",
        "  /%%%%%\\ ",
        "~(####o#> ",
        "  \\####/  ",
        "          "
      ],
      // down
      [
        "          ",
        "          ",
        "~(####o#> ",
        "  /%%%%%\\ ",
        "  \\%%%%%/ "
      ]
    ],
    perch: [
      // idle
      [
        "   /\\  ",
        "  /%%\\ ",
        " (o##> ",
        " ##### ",
        "  ###  ",
        "   ,'  "
      ],
      // preen
      [
        "  __   ",
        "  /%%\\ ",
        " (o##> ",
        " ##### ",
        "  ###  ",
        "   ,'  "
      ]
    ]
  },
  {
    id: "swallow",
    name: "Swallow",
    vernacular: "Walet",
    group: "wild",
    weight: 3.5,
    size: 0.7,
    cruise: 170,
    flapHz: 6.0,
    glide: 0.15,
    canPerch: false,
    accent: "#6fb6c9",
    cols: 13,
    rows: 5,
    frames: [
      // up
      [
        "      /\\     ",
        "~    /%%\\    ",
        "~~(######o#> ",
        "~    \\####/  ",
        "             "
      ],
      // level
      [
        "             ",
        "~   /%%%%%%\\ ",
        "~~(######o#> ",
        "~    \\####/  ",
        "             "
      ],
      // down
      [
        "             ",
        "~            ",
        "~~(######o#> ",
        "~    /%%%%\\  ",
        "    /%%%%%%\\ "
      ]
    ],
    perch: null
  },
  {
    id: "dove",
    name: "Dove",
    vernacular: "Merpati",
    group: "wild",
    weight: 3.0,
    size: 0.85,
    cruise: 110,
    flapHz: 3.6,
    glide: 0.15,
    canPerch: true,
    accent: "#cfd8dc",
    cols: 11,
    rows: 5,
    frames: [
      // up
      [
        "    /\\     ",
        "  //%%\\\\   ",
        "~(######o> ",
        " (#######) ",
        "  \\#####/  "
      ],
      // level
      [
        "           ",
        "  /%%%%%\\  ",
        "~(######o> ",
        " (#######) ",
        "  \\#####/  "
      ],
      // down
      [
        "           ",
        "           ",
        "~(######o> ",
        " (#######) ",
        "  \\%%%%%/  "
      ]
    ],
    perch: [
      // idle
      [
        "   /\\   ",
        "  /%%\\  ",
        " (o###> ",
        " (#####)",
        "  ##### ",
        "   ,'   "
      ],
      // preen
      [
        "  __    ",
        "  /%%\\  ",
        " (o###> ",
        " (#####)",
        "  ##### ",
        "   ,'   "
      ]
    ]
  },
  {
    id: "crow",
    name: "Crow",
    vernacular: "Gagak",
    group: "wild",
    weight: 2.4,
    size: 1.05,
    cruise: 95,
    flapHz: 3.0,
    glide: 0.25,
    canPerch: true,
    accent: "#2b3138",
    cols: 12,
    rows: 6,
    frames: [
      // up
      [
        "    /\\      ",
        "   /%%\\     ",
        "~(#######o> ",
        " (########) ",
        "  \\######/  ",
        "            "
      ],
      // level
      [
        "            ",
        "  /%%%%%%\\  ",
        "~(#######o> ",
        " (########) ",
        "  \\######/  ",
        "            "
      ],
      // down
      [
        "            ",
        "            ",
        "~(#######o> ",
        " (########) ",
        "  /%%%%%%\\  ",
        "  \\%%%%%%/  "
      ]
    ],
    perch: [
      // idle
      [
        "   /\\   ",
        "  /%%\\  ",
        " (o###> ",
        " (#####)",
        " (#####)",
        "  ##### ",
        "   ,'   "
      ],
      // preen
      [
        "  __    ",
        "  /%%\\  ",
        " (o###> ",
        " (#####)",
        " (#####)",
        "  ##### ",
        "   ,'   "
      ]
    ]
  },
  {
    id: "kingfisher",
    name: "Kingfisher",
    vernacular: "Raja Udang",
    group: "wild",
    weight: 2.0,
    size: 0.72,
    cruise: 160,
    flapHz: 5.2,
    glide: 0.1,
    canPerch: true,
    accent: "#3fb6c9",
    cols: 10,
    rows: 5,
    frames: [
      // up
      [
        "   /\\     ",
        "  /%%\\    ",
        "~(##@@o>> ",
        "  (###)   ",
        "   \\#/    "
      ],
      // level
      [
        "          ",
        "  /%%%%\\  ",
        "~(##@@o>> ",
        "  (###)   ",
        "   \\#/    "
      ],
      // down
      [
        "          ",
        "          ",
        "~(##@@o>> ",
        "  /%%%%\\  ",
        "  \\####/  "
      ]
    ],
    perch: [
      // idle
      [
        "  /\\   ",
        " /%%\\  ",
        "(o@##>>",
        " ####  ",
        "  ##   ",
        "  ,'   "
      ],
      // preen
      [
        "  _    ",
        " /%%\\  ",
        "(o@##>>",
        " ####  ",
        "  ##   ",
        "  ,'   "
      ]
    ]
  },
  {
    id: "eagle",
    name: "Eagle",
    vernacular: "Elang",
    group: "wild",
    weight: 1.4,
    size: 1.35,
    cruise: 90,
    flapHz: 1.6,
    glide: 0.65,
    canPerch: true,
    accent: "#b08a5a",
    cols: 17,
    rows: 7,
    frames: [
      // up
      [
        "     /\\          ",
        "    /%%\\         ",
        "   /%%%%\\        ",
        "~~(##########o<> ",
        "  (############) ",
        "   \\##########/  ",
        "                 "
      ],
      // level
      [
        "                 ",
        "   /%%%%%%%%%\\   ",
        "   |%%%%%%%%%|   ",
        "~~(##########o<> ",
        "  (############) ",
        "   \\##########/  ",
        "                 "
      ],
      // down
      [
        "                 ",
        "                 ",
        "                 ",
        "~~(##########o<> ",
        "  (############) ",
        "   /%%%%%%%%%\\   ",
        "   \\%%%%%%%%%/   "
      ]
    ],
    perch: [
      // idle
      [
        "    /\\     ",
        "   /%%\\    ",
        "  (o####<> ",
        " (########)",
        " (########)",
        "  (######) ",
        "   ######  ",
        "    ,'     "
      ],
      // preen
      [
        "   __      ",
        "   /%%\\    ",
        "  (o####<> ",
        " (########)",
        " (########)",
        "  (######) ",
        "   ######  ",
        "    ,'     "
      ]
    ]
  },
  {
    id: "hornbill",
    name: "Hornbill",
    vernacular: "Rangkong",
    group: "wild",
    weight: 1.2,
    size: 1.1,
    cruise: 100,
    flapHz: 2.6,
    glide: 0.2,
    canPerch: true,
    accent: "#3d3a35",
    cols: 14,
    rows: 6,
    frames: [
      // up
      [
        "     /\\       ",
        "    /%%\\  @@  ",
        "   /%%%%\\ @@  ",
        "~~@#####o#>>>>",
        "  (######)    ",
        "   \\####/     "
      ],
      // level
      [
        "              ",
        "          @@  ",
        "  /%%%%\\  @@  ",
        "~~@#####o#>>>>",
        "  (######)    ",
        "   \\####/     "
      ],
      // down
      [
        "              ",
        "          @@  ",
        "          @@  ",
        "~~@#####o#>>>>",
        "  /%%%%%%\\    ",
        "  \\%%%%%%/    "
      ]
    ],
    perch: [
      // idle
      [
        "   @@@    ",
        "   @@@    ",
        "  (o##>>>>",
        "  (###)   ",
        "  (#####) ",
        "   #####  ",
        "   #####  ",
        "     ,'   "
      ],
      // preen
      [
        "   @@@    ",
        "   @@@    ",
        "  (o##>>>>",
        "  (###)   ",
        "  (#####) ",
        "   #####  ",
        "   #####  ",
        "     ,'   "
      ]
    ]
  },
  {
    id: "parrot",
    name: "Parrot",
    vernacular: "Nuri",
    group: "fancy",
    weight: 2.0,
    size: 0.9,
    cruise: 120,
    flapHz: 4.2,
    glide: 0.1,
    canPerch: true,
    accent: "#48c774",
    cols: 11,
    rows: 6,
    frames: [
      // up
      [
        "   /\\      ",
        "  /%%\\     ",
        " (%%%%)    ",
        "~~~####o#> ",
        "  (####)   ",
        "   \\##/    "
      ],
      // level
      [
        "           ",
        "  /%%%%\\   ",
        "  |%%%%|   ",
        "~~~####o#> ",
        "  (####)   ",
        "   \\##/    "
      ],
      // down
      [
        "           ",
        "           ",
        "           ",
        "~~~####o#> ",
        "  /%%%%\\   ",
        "  \\%%%%/   "
      ]
    ],
    perch: [
      // idle
      [
        "   /\\   ",
        "  /%%\\  ",
        " (o##>  ",
        " (####) ",
        " ~####  ",
        " ~ ##   ",
        "   ,'   "
      ],
      // preen
      [
        "  __    ",
        "  /%%\\  ",
        " (o##>  ",
        " (####) ",
        " ~####  ",
        " ~ ##   ",
        "   ,'   "
      ]
    ]
  },
  {
    id: "cockatoo",
    name: "Cockatoo",
    vernacular: "Kakatua",
    group: "fancy",
    weight: 1.6,
    size: 1.05,
    cruise: 105,
    flapHz: 3.4,
    glide: 0.15,
    canPerch: true,
    accent: "#f1ead8",
    cols: 12,
    rows: 7,
    frames: [
      // up
      [
        "      %%@   ",
        "    /\\@@@   ",
        "   /%%%%@   ",
        "  /%%%%%@   ",
        "~(#####o#>  ",
        "  \\####/    ",
        "            "
      ],
      // level
      [
        "      %%@   ",
        "      @@@   ",
        "  /%%%%%\\   ",
        "  |%%%%%|   ",
        "~(#####o#>  ",
        "  \\####/    ",
        "            "
      ],
      // down
      [
        "      %%@   ",
        "      @@@   ",
        "       @@   ",
        "       @@   ",
        "~(#####o#>  ",
        "  /%%%%%\\   ",
        "  \\%%%%%/   "
      ]
    ],
    perch: [
      // idle
      [
        "    %@   ",
        "   @@@   ",
        "  /%%%@  ",
        "(o##>    ",
        " #####   ",
        "  ###    ",
        "  ###    ",
        "   ,'    "
      ],
      // preen
      [
        "    %@   ",
        "   _@@   ",
        "  /%%%@  ",
        "(o##>    ",
        " #####   ",
        "  ###    ",
        "  ###    ",
        "   ,'    "
      ]
    ]
  },
  {
    id: "paradise",
    name: "Bird of Paradise",
    vernacular: "Cendrawasih",
    group: "fancy",
    weight: 1.3,
    size: 0.85,
    cruise: 115,
    flapHz: 3.8,
    glide: 0.1,
    canPerch: true,
    accent: "#ff9f43",
    cols: 14,
    rows: 7,
    frames: [
      // up
      [
        "      /\\      ",
        "     /%%\\     ",
        "~~~~/%%%%\\    ",
        "~~~~#####o#>  ",
        "  (######)    ",
        "   \\####/     ",
        "              "
      ],
      // level
      [
        "              ",
        "   /%%%%%%\\   ",
        "~~~%%%%%%%%\\  ",
        "~~~~#####o#>  ",
        "  (######)    ",
        "   \\####/     ",
        "              "
      ],
      // down
      [
        "              ",
        "              ",
        "~~~~          ",
        "~~~~#####o#>  ",
        "  /%%%%%%\\    ",
        "  \\%%%%%%/    ",
        "              "
      ]
    ],
    perch: [
      // idle
      [
        "    /\\    ",
        "   /%%\\   ",
        "  (o##>   ",
        "  #####   ",
        " ~######  ",
        " ~ #####  ",
        " ~  ###   ",
        " ~   ##   ",
        "     ,'   "
      ],
      // preen
      [
        "   __     ",
        "   /%%\\   ",
        "  (o##>   ",
        "  #####   ",
        " ~######  ",
        " ~ #####  ",
        " ~  ###   ",
        " ~   ##   ",
        "     ,'   "
      ]
    ]
  },
  {
    id: "pterodactyl",
    name: "Pterodactyl",
    vernacular: "Pterodactyl",
    group: "mythic",
    weight: 0.14,
    size: 1.75,
    cruise: 70,
    flapHz: 1.2,
    glide: 0.75,
    canPerch: false,
    accent: "#b9a7c9",
    cols: 20,
    rows: 8,
    frames: [
      // up
      [
        "      /---/\\        ",
        "     /%%%%%%\\       ",
        "    /%%%%%%%%\\      ",
        "   /%%%%%%%%%%\\     ",
        "  /%%%%%%%%%%%%\\    ",
        "~(#######o>>>>>>    ",
        "   \\####/           ",
        "                    "
      ],
      // level
      [
        "                    ",
        "  /--------------\\  ",
        "  |%%%%%%%%%%%%%%|  ",
        "  |%%%%%%%%%%%%%%|  ",
        "  |%%%%%%%%%%%%%%|  ",
        "~(#######o>>>>>>    ",
        "   \\####/           ",
        "                    "
      ],
      // down
      [
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "                    ",
        "~(#######o>>>>>>    ",
        "  \\%%%%%%%%%%%%%%/  ",
        "   \\------------/   "
      ]
    ],
    perch: null
  },
  {
    id: "dragon",
    name: "Dragon",
    vernacular: "Naga",
    group: "mythic",
    weight: 0.1,
    size: 2.1,
    cruise: 60,
    flapHz: 0.9,
    glide: 0.65,
    canPerch: false,
    accent: "#d05c5c",
    cols: 24,
    rows: 9,
    frames: [
      // up
      [
        "     /---/\\             ",
        "    /%%%%%%\\            ",
        "   /%%%%%%%%\\           ",
        "  /%%%%%%%%%%\\          ",
        " /%%%%%%%%%%%%\\         ",
        "~~~@*****######o>>>>>   ",
        "  (############)        ",
        "   \\##########/         ",
        "                        "
      ],
      // level
      [
        "                        ",
        "  /--------------\\      ",
        "  |%%%%%%%%%%%%%%|      ",
        "  |%%%%%%%%%%%%%%|      ",
        "  |%%%%%%%%%%%%%%|      ",
        "~~~@*****######o>>>>>   ",
        "  (############)        ",
        "   \\##########/         ",
        "                        "
      ],
      // down
      [
        "                        ",
        "                        ",
        "                        ",
        "                        ",
        "                        ",
        "~~~@*****######o>>>>>   ",
        "  (############)        ",
        "  /%%%%%%%%%%%%%%\\      ",
        "  \\--------------/      "
      ]
    ],
    perch: null
  },
  {
    id: "phoenix",
    name: "Phoenix",
    vernacular: "Phoenix",
    group: "mythic",
    weight: 0.08,
    size: 1.65,
    cruise: 85,
    flapHz: 1.4,
    glide: 0.45,
    canPerch: true,
    accent: "#ffb347",
    cols: 19,
    rows: 8,
    frames: [
      // up
      [
        "      /\\           ",
        "     /%%\\          ",
        "    /%%%%\\         ",
        "   *%%%%%%*        ",
        "~~*@#####o#>       ",
        "  (#######)        ",
        "   \\#####/         ",
        "                   "
      ],
      // level
      [
        "                   ",
        "   /%%%%%\\         ",
        "   |%%%%%|         ",
        "  **%%%%%**        ",
        "~~*@#####o#>       ",
        "  (#######)        ",
        "   \\#####/         ",
        "                   "
      ],
      // down
      [
        "                   ",
        "                   ",
        "                   ",
        "                   ",
        "~~*@#####o#>       ",
        "  (#######)        ",
        "  **%%%%%**        ",
        "   \\%%%%%/         "
      ]
    ],
    perch: [
      // idle
      [
        "    /\\     ",
        "   /%%\\    ",
        "  (o##>    ",
        "  *#####   ",
        "  (#######)",
        "   ######  ",
        "   *####*  ",
        "    *##*   ",
        "     ,'    "
      ],
      // preen
      [
        "   __      ",
        "   /%%\\    ",
        "  (o##>    ",
        "  *#####   ",
        "  (#######)",
        "   ######  ",
        "   *####*  ",
        "    *##*   ",
        "     ,'    "
      ]
    ]
  }
];

// Precompute framesText, perchText, perchCols, perchRows
for (const s of SPECIES) {
  s.framesText = s.frames.map(f => f.join("\n"));
  s.perchText = s.perch ? s.perch.map(f => f.join("\n")) : null;
  s.perchCols = s.perch ? s.perch[0][0].length : 0;
  s.perchRows = s.perch ? s.perch[0].length : 0;
}

const SPECIES_BY_ID = new Map();
for (const s of SPECIES) {
  SPECIES_BY_ID.set(s.id, s);
}

function pickSpecies(mode, random = Math.random) {
  if (SPECIES_BY_ID.has(mode)) {
    return SPECIES_BY_ID.get(mode);
  }
  let pool;
  if (mode === "mythic") {
    pool = SPECIES.filter(s => s.group === "mythic");
  } else if (mode === "real") {
    pool = SPECIES.filter(s => s.group === "wild" || s.group === "fancy");
  } else {
    pool = SPECIES;
  }
  const totalWeight = pool.reduce((sum, s) => sum + s.weight, 0);
  let roll = random() * totalWeight;
  for (const s of pool) {
    if (roll < s.weight) return s;
    roll -= s.weight;
  }
  return pool[pool.length - 1];
}

// Tree templates
// gnarled: 30 cols x 22 rows, 3 anchors
// broad:   34 cols x 24 rows, 3 anchors
// slender: 24 cols x 26 rows, 3 anchors
const TREE_TEMPLATES = [
  {
    id: "gnarled",
    cols: 30,
    rows: 22,
    // Branch tips on wood chars: col, row, facing (1 = right, -1 = left)
    anchors: [
      { col: 6, row: 8, facing: -1 },
      { col: 21, row: 9, facing: 1 },
      { col: 20, row: 14, facing: 1 }
    ],
    lines: [
      "          .o*o..              ", // 0
      "       .oo****oo..            ", // 1
      "     .o**********oo.          ", // 2
      "    .o*************o.         ", // 3
      "   .o****************.        ", // 4
      "   .o****************o.       ", // 5
      "   .o******************o.     ", // 6
      "   .o***'  \\//  '******o.     ", // 7
      "      /    /|     '****o.     ", // 8  anchor (6, 8, -1) char '/'
      "     /    / |       '\\        ", // 9  anchor (21, 9, 1) char '\'
      "    /    /  |         \\       ", // 10
      "   (____/   |          )      ", // 11
      "            |         /       ", // 12
      "            (|       /        ", // 13
      "            ||      /         ", // 14 anchor (20, 14, 1) char '/'
      "            ||     /          ", // 15
      "            (|    /           ", // 16
      "            ||   (            ", // 17
      "            ||   |            ", // 18
      "            ||   |            ", // 19
      "           /||   |            ", // 20
      "         _/ ||   \\_           "  // 21
    ]
  },
  {
    id: "broad",
    cols: 34,
    rows: 24,
    anchors: [
      { col: 6, row: 10, facing: -1 },
      { col: 26, row: 9, facing: 1 },
      { col: 8, row: 15, facing: -1 }
    ],
    lines: [
      "             ..o*o..              ", // 0
      "          .oo*******oo.           ", // 1
      "        .o*************o.         ", // 2
      "      .o*****************o.       ", // 3
      "     .o*******************o.      ", // 4
      "    .o*********************o.     ", // 5
      "    .o**********************o.    ", // 6
      "    .o******'   ||   '******o.    ", // 7
      "    .o****'    /||\\    '****o.    ", // 8
      "       /      / || \\      \\       ", // 9  anchor (26, 9, 1) char '\'
      "      /      /  ||  \\      \\      ", // 10 anchor (6, 10, -1) char '/'
      "     /      /   ||   \\      \\     ", // 11
      "    (______/    ||    \\______)    ", // 12
      "                ||                ", // 13
      "         /      ||                ", // 14
      "        /       ||                ", // 15 anchor (8, 15, -1) char '/'
      "       /        ||                ", // 16
      "      (________/||                ", // 17
      "                ||                ", // 18
      "                ||                ", // 19
      "               (||)               ", // 20
      "               (||)               ", // 21
      "               /||\\               ", // 22
      "             _/ || \\_             "  // 23
    ]
  },
  {
    id: "slender",
    cols: 24,
    rows: 26,
    anchors: [
      { col: 5, row: 10, facing: -1 },
      { col: 19, row: 12, facing: 1 },
      { col: 15, row: 17, facing: 1 }
    ],
    lines: [
      "         .o*o           ", // 0
      "       .o****o.         ", // 1
      "      .o******o.        ", // 2
      "     .o********o.       ", // 3
      "     .o********o.       ", // 4
      "     .o********o.       ", // 5
      "     .o********o.       ", // 6
      "      .o******o.        ", // 7
      "       .o' || 'o.       ", // 8
      "      /    ||   \\       ", // 9
      "     /     ||    \\      ", // 10 anchor (5, 10, -1) char '/'
      "    (_____/||     \\     ", // 11
      "           ||      \\    ", // 12 anchor (19, 12, 1) char '\'
      "           ||     _)    ", // 13
      "           ||           ", // 14
      "           ||    /      ", // 15
      "           ||   /       ", // 16
      "           ||  /        ", // 17 anchor (15, 17, 1) char '/'
      "           || (_        ", // 18
      "           ||           ", // 19
      "           ||           ", // 20
      "          (||)          ", // 21
      "          (||)          ", // 22
      "          (||)          ", // 23
      "          /||\\          ", // 24
      "        _/ || \\_        "  // 25
    ]
  }
];

function buildTreeLayers(template) {
  const woodLines = [];
  const leafLines = [];
  for (const line of template.lines) {
    let w = "";
    let l = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (WOOD_CHARS.has(ch)) {
        w += ch;
        l += " ";
      } else if (LEAF_CHARS.has(ch)) {
        w += " ";
        l += ch;
      } else {
        w += " ";
        l += " ";
      }
    }
    woodLines.push(w);
    leafLines.push(l);
  }
  return {
    woodText: woodLines.join("\n"),
    leafText: leafLines.join("\n")
  };
}

// Precompute woodText and leafText on templates
for (const tmpl of TREE_TEMPLATES) {
  const layers = buildTreeLayers(tmpl);
  tmpl.woodText = layers.woodText;
  tmpl.leafText = layers.leafText;
}

// Distant canopy: 64 cols x 6 rows of leaf/wood chars, no anchors
const DISTANT_CANOPY = {
  cols: 64,
  rows: 6,
  text: [
    "  ..o**o..      .o**o.        ..o**o..      .o**o.        ..o** ",
    ".'o******o'.  .o******o'.   .'o******o'.  .o******o'.   .'o*****",
    ".************'.************'.************'.************'.*******",
    "****************************************************************",
    " |  ||  | |    |  ||  | |    |  ||  | |    |  ||  | |    |  ||  ",
    " |  ||  | |    |  ||  | |    |  ||  | |    |  ||  | |    |  ||  "
  ].join("\n")
};

// Cloud templates: 4 puffy side-view silhouettes
// Only . : ; ' - _ ~ and spaces
const CLOUD_TEMPLATES = [
  {
    cols: 18,
    rows: 5,
    text: [
      "     .---.        ",
      "   .-'    '-.     ",
      " .-'         '-.  ",
      "(               ) ",
      " '-------------~  "
    ].join("\n")
  },
  {
    cols: 25,
    rows: 4,
    text: [
      "     .-'     '-.         ",
      " .-'                   ) ",
      "(                      ) ",
      " '--------------------~  "
    ].join("\n")
  },
  {
    cols: 14,
    rows: 4,
    text: [
      "    .---.     ",
      "  .-'    '-.  ",
      " (          ) ",
      "  '--------~  "
    ].join("\n")
  },
  {
    cols: 30,
    rows: 7,
    text: [
      "           .-----.            ",
      "        .-'       '-.         ",
      "     .-'             '-.---.  ",
      "   .-'                      ) ",
      " .-'                         )",
      "(                            )",
      " '--------------------------~ "
    ].join("\n")
  }
];


export {
  ADVANCE_RATIO,
  WOOD_CHARS,
  LEAF_CHARS,
  SPECIES,
  SPECIES_BY_ID,
  TREE_TEMPLATES,
  CLOUD_TEMPLATES,
  DISTANT_CANOPY,
  pickSpecies,
  birdCellPx,
  buildTreeLayers
};
