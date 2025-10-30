// components/midi.ts
var NOTE_ON = 144;
var NOTE_OFF = 128;
async function requestAccess() {
  return navigator.requestMIDIAccess();
}

// components/sampler.ts
var samples = /* @__PURE__ */ new Map();
var Synth = class extends EventTarget {
  id = "sampler";
  manufacturer = "ondras";
  name = "sample player";
  type = "output";
  version = "0.0.1";
  state = "connected";
  connection = "open";
  onstatechange = null;
  ctx = new AudioContext();
  playing = /* @__PURE__ */ new Map();
  output;
  async open() {
    return this;
  }
  async close() {
    return this;
  }
  constructor() {
    super();
    const { ctx } = this;
    let compressor = ctx.createDynamicsCompressor();
    compressor.connect(ctx.destination);
    this.output = compressor;
  }
  send(data, timestamp) {
    let [status, midiNote, velocity] = data;
    switch (status & 240) {
      case NOTE_ON:
        velocity ? this.noteOn(midiNote) : this.noteOff(midiNote);
        break;
      case NOTE_OFF:
        this.noteOff(midiNote);
        break;
    }
  }
  async noteOn(midiNote) {
    const { playing, ctx, output } = this;
    if (playing.has(midiNote)) {
      return;
    }
    let buffer = await getSampleBuffer(midiNote, ctx);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(output);
    src.start();
    playing.set(midiNote, src);
  }
  noteOff(midiNote) {
    const { playing } = this;
    let audioNode = playing.get(midiNote);
    if (!audioNode) {
      return;
    }
    audioNode.stop();
    playing.delete(midiNote);
  }
};
function getSampleBuffer(midiNote, ctx) {
  if (samples.has(midiNote)) {
    return samples.get(midiNote);
  }
  let { promise, resolve } = Promise.withResolvers();
  samples.set(midiNote, promise);
  let sampleName = getSampleName(midiNote);
  let url = `https://raw.githubusercontent.com/fuhton/piano-mp3/refs/heads/master/piano-mp3/${sampleName}.mp3`;
  fetch(url).then(async (response) => {
    let buffer = await response.arrayBuffer();
    let audioBuffer = await ctx.decodeAudioData(buffer);
    resolve(audioBuffer);
  });
  return promise;
}
var NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B"
];
function getSampleName(midiNote) {
  let octave = Math.floor(midiNote / 12) - 1;
  let note = midiNote % 12;
  return `${NAMES[note]}${octave}`;
}

// components/app.ts
var channel = 0;
var App = class extends HTMLElement {
  outputs = [];
  playingNotes = /* @__PURE__ */ new Map();
  get fav() {
    return this.querySelector("ck-fav");
  }
  get song() {
    return this.querySelector("ck-song");
  }
  get chords() {
    return this.querySelector("ck-chords");
  }
  get menu() {
    return this.querySelector("ck-menu");
  }
  constructor() {
    super();
    window.addEventListener("hashchange", (_) => this.loadState());
  }
  async connectedCallback() {
    this.innerHTML = HTML;
    this.querySelector(`[href="#fav"] span`).append(this.fav.icon);
    this.querySelector(`[href="#song"] span`).append(this.song.icon);
    this.loadState();
    try {
      let midiAccess = await requestAccess();
      this.outputs = [
        new Synth(),
        ...midiAccess.outputs.values()
      ];
    } catch (e) {
      this.outputs = [
        new Synth()
      ];
    }
  }
  play(chord) {
    chord.notes.forEach((note) => this.playNote(note));
  }
  stop(chord) {
    chord.notes.forEach((note) => this.stopNote(note));
  }
  toggleMenu(chord) {
    this.menu.toggleForChord(chord);
  }
  playNote(note) {
    const { playingNotes, outputs } = this;
    let current = playingNotes.get(note) || 0;
    if (!current) {
      let midiMessage = [
        NOTE_ON + channel,
        note,
        100
      ];
      outputs.forEach((output) => output.send(midiMessage));
    }
    current++;
    playingNotes.set(note, current);
  }
  stopNote(note) {
    const { playingNotes, outputs } = this;
    let current = playingNotes.get(note) || 0;
    if (!current) {
      return;
    }
    current--;
    playingNotes.set(note, current);
    if (!current) {
      let midiMessage = [
        NOTE_OFF + channel,
        note,
        100
      ];
      outputs.forEach((output) => output.send(midiMessage));
    }
  }
  loadState() {
    let name = location.hash.substring(1) || "chords";
    let modules = {
      fav: this.fav,
      song: this.song,
      chords: this.chords
    };
    Object.entries(modules).forEach(([key, module]) => module.hidden = key != name);
    [
      ...this.querySelectorAll("a")
    ].forEach((link) => link.classList.toggle("active", link.href.endsWith(location.hash)));
  }
};
var HTML = `
<main>
	<ck-chords></ck-chords>
	<ck-song></ck-song>
	<ck-fav></ck-fav>
</main>
<nav>
	<a href="#chords"><span>\u{1F3B9}</span>Chords</a>
	<a href="#song"><span></span>Song</a>
	<a href="#fav"><span></span>Favorites</a>
</nav>
<ck-menu></ck-menu>
`;

// components/music.ts
var NOTES = [
  "C",
  "C\u266F",
  "D",
  "D\u266F",
  "E",
  "F",
  "F\u266F",
  "G",
  "G\u266F",
  "A",
  "B\u266D",
  "B"
];
function noteToNumber(note) {
  return NOTES.indexOf(note);
}
function numberToNote(number) {
  return NOTES[number % NOTES.length];
}
var ChordTypes = {
  "major": [
    0,
    4,
    7
  ],
  "minor": [
    0,
    3,
    7
  ],
  "diminished": [
    0,
    3,
    6
  ],
  "augmented": [
    0,
    4,
    8
  ]
};
var SCALE_MAJOR = [
  0,
  2,
  4,
  5,
  7,
  9,
  11
];
var SCALE_MINOR_NATURAL = [
  0,
  2,
  3,
  5,
  7,
  8,
  10
];
var SCALE_MINOR_HARMONIC = [
  0,
  2,
  3,
  5,
  7,
  8,
  11
];
function findChordType(numbers) {
  let type;
  for (type in ChordTypes) {
    if (ChordTypes[type].join(",") == numbers.join(",")) {
      return type;
    }
  }
  throw new Error("FIXME");
}
var Sevenths = {
  "diminished": 9,
  "minor": 10,
  "major": 11
};
function buildRootSelect() {
  let select = document.createElement("select");
  select.name = "root";
  let options = NOTES.map((note) => new Option(note));
  select.append(...options);
  return select;
}
function buildOctaveSelect() {
  let select = document.createElement("select");
  select.name = "octave";
  for (let i = 1; i <= 7; i++) {
    let option = new Option(`Oct. ${i}`, String(i));
    select.append(option);
  }
  return select;
}
function buildSeventhSelect() {
  let select = document.createElement("select");
  select.name = "seventh";
  select.append(new Option("No 7th", ""), new Option("Major 7th", "major"), new Option("Minor 7th", "minor"), new Option("Diminished 7th", "diminished"));
  return select;
}

// components/chord.ts
var DEFAULT_ROOT = "C";
var DEFAULT_TYPE = "major";
var DEFAULT_OCTAVE = 4;
var Chord = class extends HTMLElement {
  get app() {
    return this.closest("ck-app");
  }
  static get observedAttributes() {
    return [
      "root",
      "octave",
      "type",
      "seventh"
    ];
  }
  get octave() {
    return Number(this.getAttribute("octave")) || DEFAULT_OCTAVE;
  }
  set octave(octave) {
    this.setAttribute("octave", String(octave));
  }
  get root() {
    return this.getAttribute("root") || DEFAULT_ROOT;
  }
  set root(root) {
    this.setAttribute("root", root);
  }
  get type() {
    return this.getAttribute("type") || DEFAULT_TYPE;
  }
  set type(type) {
    this.setAttribute("type", type);
  }
  get seventh() {
    return this.getAttribute("seventh");
  }
  set seventh(seventh) {
    seventh ? this.setAttribute("seventh", seventh) : this.removeAttribute("seventh");
  }
  label = document.createElement("span");
  config = document.createElement("button");
  constructor() {
    super();
    this.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    this.config.addEventListener("click", (e) => this.onClickConfig(e));
  }
  static fromJSON(data) {
    let chord = new this();
    Object.assign(chord, data);
    return chord;
  }
  toJSON() {
    return {
      type: this.type,
      octave: this.octave,
      root: this.root,
      seventh: this.seventh
    };
  }
  connectedCallback() {
    const { label, config } = this;
    this.replaceChildren(label, config);
    config.textContent = "\u2699\uFE0F";
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "root":
      case "type":
      case "seventh":
        this.updateLabel();
        this.updateHue();
        break;
      case "octave":
        this.updateOctave();
        break;
    }
    this.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  }
  cloneNode(subtree) {
    let clone = super.cloneNode(subtree);
    clone.style.removeProperty("--index");
    delete clone.dataset.circle;
    return clone;
  }
  get notes() {
    const { octave, root, type, seventh } = this;
    let base = (octave + 1) * 12;
    base += noteToNumber(root);
    let notes = ChordTypes[type].map((note) => note + base);
    if (seventh) {
      notes.push(base + Sevenths[seventh]);
    }
    return notes;
  }
  onClickConfig(e) {
    this.app.toggleMenu(this);
  }
  onPointerDown(e) {
    const { app, config } = this;
    if (config.contains(e.target)) {
      e.stopPropagation();
      return;
    }
    let ac = new AbortController();
    let { signal } = ac;
    let abort = () => {
      ac.abort();
      app.stop(this);
    };
    this.addEventListener("pointerup", abort, {
      signal
    });
    this.addEventListener("pointerleave", abort, {
      signal
    });
    app.play(this);
  }
  updateLabel() {
    this.label.innerHTML = formatLabel(this);
  }
  updateOctave() {
    this.style.setProperty("--octave", String(this.octave));
  }
  updateHue() {
    let number = noteToNumber(this.root);
    let angle = number * 360 / 12;
    this.style.setProperty("--hue", `${angle}deg`);
  }
};
var TYPE_SUFFIX = {
  "major": "",
  "minor": "m",
  "augmented": "+",
  "diminished": "<sup>o</sup>"
};
var SEVENTH_SUFFIX = {
  "diminished": "6",
  "minor": "7",
  "major": "M7"
};
function formatLabel(chord) {
  let parts = [
    chord.root,
    TYPE_SUFFIX[chord.type]
  ];
  if (chord.seventh) {
    parts.push(SEVENTH_SUFFIX[chord.seventh]);
  }
  return parts.join("");
}

// components/layout.ts
var DEFAULT_ROOT2 = "C";
var DEFAULT_OCTAVE2 = 4;
var Layout = class extends HTMLElement {
  get app() {
    return this.closest("ck-layout");
  }
  static get observedAttributes() {
    return [
      "root",
      "octave",
      "type"
    ];
  }
  get octave() {
    return Number(this.getAttribute("octave")) || DEFAULT_OCTAVE2;
  }
  set octave(octave) {
    this.setAttribute("octave", String(octave));
  }
  get root() {
    return this.getAttribute("root") || DEFAULT_ROOT2;
  }
  set root(root) {
    this.setAttribute("root", root);
  }
  get type() {
    return this.getAttribute("type");
  }
  set type(type) {
    this.setAttribute("type", type);
  }
  constructor() {
    super();
  }
  connectedCallback() {
    this.generate();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.generate();
  }
  generate() {
    let chords = [];
    switch (this.type) {
      case "fifths":
        let secondaryRoot = numberToNote(noteToNumber(this.root) + 9);
        chords = [
          ...generateFifths(this.octave, this.root, "major"),
          ...generateFifths(this.octave, secondaryRoot, "minor")
        ];
        break;
      case "triads-major":
        chords = generateTriads(this.octave, this.root, "major");
        break;
      case "triads-minor-natural":
        chords = generateTriads(this.octave, this.root, "minor-natural");
        break;
      case "triads-minor-harmonic":
        chords = generateTriads(this.octave, this.root, "minor-harmonic");
        break;
    }
    this.replaceChildren(...chords);
  }
};
function generateFifths(octave, root, type) {
  let base = noteToNumber(root);
  let offsets = new Array(12).fill(0).map((_, i) => 5 * i);
  return offsets.map((offset, index) => {
    let chord = new Chord();
    chord.octave = octave;
    chord.type = type;
    chord.root = numberToNote(base + offset);
    chord.style.setProperty("--index", String(index));
    chord.dataset.circle = type == "major" ? "large" : "small";
    return chord;
  });
}
function generateTriads(octave, root, type) {
  let base = noteToNumber(root);
  let triadOffsetsInScale = [
    0,
    2,
    4
  ];
  let scale;
  switch (type) {
    case "major":
      scale = SCALE_MAJOR;
      break;
    case "minor-natural":
      scale = SCALE_MINOR_NATURAL;
      break;
    case "minor-harmonic":
      scale = SCALE_MINOR_HARMONIC;
      break;
  }
  return scale.map((majorNote, scaleIndex, allNotes) => {
    let chord = new Chord();
    chord.root = numberToNote((majorNote + base) % 12);
    chord.octave = octave;
    let notes = triadOffsetsInScale.map((triadOffset) => {
      let index = scaleIndex + triadOffset;
      let tone = allNotes[index % allNotes.length];
      return (tone + 12 - majorNote) % 12;
    });
    chord.type = findChordType(notes);
    return chord;
  });
}

// components/chords.ts
var Chords = class extends HTMLElement {
  layout = new Layout();
  header = document.createElement("header");
  get layoutSelect() {
    return this.header.querySelector("[name=layout]");
  }
  get rootSelect() {
    return this.header.querySelector("[name=root]");
  }
  get octaveSelect() {
    return this.header.querySelector("[name=octave]");
  }
  connectedCallback() {
    const { header, layout } = this;
    this.replaceChildren(header, layout);
    header.innerHTML = HEADER_HTML;
    const { layoutSelect } = this;
    layoutSelect.addEventListener("change", (_) => {
      layout.type = layoutSelect.value;
      layoutSelect.value = "";
    });
    let rootSelect = buildRootSelect();
    rootSelect.value = layout.root;
    rootSelect.addEventListener("change", (_) => layout.root = rootSelect.value);
    let octaveSelect = buildOctaveSelect();
    octaveSelect.value = String(layout.octave);
    octaveSelect.addEventListener("change", (_) => layout.octave = Number(octaveSelect.value));
    header.append(rootSelect, octaveSelect);
  }
};
var HEADER_HTML = `
<select name="layout">
  <option value="" selected>Fill with&hellip;</option>
  <option value="fifths">Circle of fifths</option>
  <option value="triads-major">Maj scale triads</option>
  <option value="triads-minor-natural">Min scale triads natural</option>
  <option value="triads-minor-harmonic">Min scale triads harmonic</option>
</select>
`;

// components/song.ts
var Song = class extends HTMLElement {
  get icon() {
    return "\u{1F3B6}";
  }
  addChord(chord) {
    this.append(chord.cloneNode(true));
  }
  removeChord(chord) {
    chord.remove();
  }
  hasChord(chord) {
    return chord.parentElement == this;
  }
};

// components/fav.ts
var Fav = class extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", (_) => this.save());
  }
  get icon() {
    return "\u2B50";
  }
  connectedCallback() {
    this.load();
  }
  addChord(chord) {
    this.append(chord.cloneNode(true));
    this.save();
    this.pulse();
  }
  removeChord(chord) {
    chord.remove();
    this.save();
    this.pulse();
  }
  hasChord(chord) {
    return chord.parentElement == this;
  }
  get chords() {
    return [
      ...this.children
    ].filter((ch) => ch instanceof Chord);
  }
  pulse() {
  }
  save() {
    let data = {
      chords: this.chords
    };
    let str = JSON.stringify(data);
    localStorage.setItem("fav", str);
  }
  load() {
    let str = localStorage.getItem("fav") || "{}";
    let data = JSON.parse(str);
    let chords = data.chords.map((ch) => Chord.fromJSON(ch));
    this.replaceChildren(...chords);
  }
};

// components/menu.ts
var Menu = class extends HTMLElement {
  get app() {
    return this.closest("ck-app");
  }
  constructor() {
    super();
    this.popover = "auto";
  }
  toggleForChord(chord) {
    const { app } = this;
    let isFav = app.fav.hasChord(chord);
    let isSong = app.song.hasChord(chord);
    let items = [
      !isFav ? buildAdd(chord, this, app.fav) : null,
      !isSong ? buildAdd(chord, this, app.song) : null,
      ...isFav ? [
        buildRemove(chord, this, app.fav),
        buildDuplicate(chord, this, app.fav)
      ] : [],
      ...isSong ? [
        buildRemove(chord, this, app.song),
        buildDuplicate(chord, this, app.song)
      ] : [],
      buildRoot(chord),
      buildType(chord),
      buildOctave(chord),
      buildSeventh(chord)
    ];
    let nodes = items.filter((item) => item);
    this.replaceChildren(...nodes);
    this.togglePopover({
      source: chord
    });
  }
};
function buildType(chord) {
  let select = document.createElement("select");
  select.name = "type";
  select.append(new Option("Major", "major"), new Option("Minor", "minor"), new Option("Diminished", "diminished"), new Option("Augmented", "augmented"));
  select.value = chord.type;
  select.addEventListener("change", (_) => chord.type = select.value);
  return select;
}
function buildAdd(chord, popover, what) {
  let button = document.createElement("button");
  button.append(`${what.icon} Add`);
  button.addEventListener("click", (_) => {
    what.addChord(chord);
    popover.hidePopover();
  });
  return button;
}
function buildRemove(chord, popover, what) {
  let button = document.createElement("button");
  button.append("\u274C Remove");
  button.addEventListener("click", (_) => {
    what.removeChord(chord);
    popover.hidePopover();
  });
  return button;
}
function buildDuplicate(chord, popover, what) {
  let button = document.createElement("button");
  button.append("\u2795 Clone");
  button.addEventListener("click", (_) => {
    let clone = chord.cloneNode(true);
    what.addChord(clone);
    popover.hidePopover();
  });
  return button;
}
function buildRoot(chord) {
  let select = buildRootSelect();
  select.value = chord.root;
  select.addEventListener("change", (_) => chord.root = select.value);
  return select;
}
function buildOctave(chord) {
  let select = buildOctaveSelect();
  select.value = String(chord.octave);
  select.addEventListener("change", (_) => chord.octave = Number(select.value));
  return select;
}
function buildSeventh(chord) {
  let select = buildSeventhSelect();
  select.value = String(chord.seventh || "");
  select.addEventListener("change", (_) => chord.seventh = select.value || null);
  return select;
}

// index.ts
customElements.define("ck-app", App);
customElements.define("ck-chord", Chord);
customElements.define("ck-layout", Layout);
customElements.define("ck-chords", Chords);
customElements.define("ck-fav", Fav);
customElements.define("ck-song", Song);
customElements.define("ck-menu", Menu);
