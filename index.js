// components/midi.ts
var NOTE_ON = 144;
var NOTE_OFF = 128;
function noteNumberToFrequency(n) {
  return 440 * 2 ** ((n - 69) / 12);
}

// components/synth.ts
var ATTACK = 0.05;
var RELEASE = 0.05;
var Synth = class extends EventTarget {
  id = "synth";
  manufacturer = "ondras";
  name = "web audio synth";
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
    let [status, note, velocity] = data;
    switch (status & 240) {
      case NOTE_ON:
        velocity ? this.noteOn(note) : this.noteOff(note);
        break;
      case NOTE_OFF:
        this.noteOff(note);
        break;
    }
  }
  noteOn(note) {
    const { playing, ctx, output } = this;
    if (playing.has(note)) {
      return;
    }
    let audioNodes = createOscillator(ctx, noteNumberToFrequency(note));
    audioNodes.gain.connect(output);
    playing.set(note, audioNodes);
  }
  noteOff(note) {
    const { playing } = this;
    let audioNodes = playing.get(note);
    if (!audioNodes) {
      return;
    }
    destroyOscillator(audioNodes);
    playing.delete(note);
  }
};
function createOscillator(ctx, frequency) {
  let oscillator = ctx.createOscillator();
  let gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(1, ctx.currentTime + ATTACK);
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  oscillator.start();
  return {
    oscillator,
    gain
  };
}
function destroyOscillator(audioNodes) {
  const { oscillator, gain } = audioNodes;
  const { currentTime } = gain.context;
  gain.gain.setValueAtTime(1, currentTime);
  gain.gain.linearRampToValueAtTime(0, currentTime + RELEASE);
  oscillator.stop(currentTime + RELEASE);
}

// components/app.ts
var channel = 0;
var DEFAULT_MODE = "play";
var App = class extends HTMLElement {
  static get observedAttributes() {
    return [
      "mode"
    ];
  }
  output = new Synth();
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
  get mode() {
    return this.getAttribute("mode") || DEFAULT_MODE;
  }
  set mode(mode) {
    this.setAttribute("mode", mode);
  }
  constructor() {
    super();
    window.addEventListener("hashchange", (_) => this.loadState());
  }
  connectedCallback() {
    this.innerHTML = HTML;
    this.loadState();
  }
  play(chord) {
    chord.notes.forEach((note) => this.playNote(note));
  }
  stop(chord) {
    chord.notes.forEach((note) => this.stopNote(note));
  }
  toggleMenu(chord) {
    this.menu.showPopover({
      source: chord
    });
  }
  playNote(note) {
    const { playingNotes, output } = this;
    let current = playingNotes.get(note) || 0;
    if (!current) {
      let midiMessage = [
        NOTE_ON + channel,
        note,
        100
      ];
      output.send(midiMessage);
    }
    current++;
    playingNotes.set(note, current);
  }
  stopNote(note) {
    const { playingNotes, output } = this;
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
      output.send(midiMessage);
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
  }
};
var HTML = `
<main>
	<ck-chords></ck-chords>
	<ck-song></ck-song>
	<ck-fav></ck-fav>
</main>
<nav>
	<a href="#chords">\u{1F3B9} Chords</a>
	<a href="#song">\u{1F3B6} Song</a>
	<a href="#fav">\u2B50 Favorites</a>
</nav>
<ck-menu></ck-menu>
`;

// components/music.ts
var NOTES = [
  "A",
  "B\u266D",
  "B",
  "C",
  "C\u266F",
  "D",
  "D\u266F",
  "E",
  "F",
  "F\u266F",
  "G",
  "G\u266F"
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
      "type"
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
  constructor() {
    super();
    this.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    this.addEventListener("click", (e) => this.onClick());
  }
  connectedCallback() {
    this.updateLabel();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.updateLabel();
  }
  get notes() {
    let base = (this.octave + 1) * 12;
    base += noteToNumber(this.root);
    return ChordTypes[this.type].map((note) => note + base);
  }
  onClick() {
    const { app } = this;
    if (app.mode == "play") {
      return;
    }
    app.toggleMenu(this);
  }
  onPointerDown(e) {
    const { app } = this;
    if (app.mode != "play") {
      return;
    }
    let ac = new AbortController();
    let { signal } = ac;
    let abort = () => {
      ac.abort();
      this.app.stop(this);
    };
    this.addEventListener("pointerup", abort, {
      signal
    });
    this.addEventListener("pointerleave", abort, {
      signal
    });
    this.app.play(this);
  }
  updateLabel() {
    this.textContent = `(${this.octave}) ${this.root} ${this.type}`;
  }
};

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
    return this.querySelector("header [name=layout]");
  }
  get rootSelect() {
    return this.querySelector("header [name=root]");
  }
  connectedCallback() {
    const { header, layout } = this;
    this.replaceChildren(header, layout);
    header.innerHTML = HEADER_HTML;
    const { layoutSelect, rootSelect } = this;
    layoutSelect.addEventListener("change", (_) => {
      layout.type = layoutSelect.value;
      layoutSelect.value = "";
    });
    let options = NOTES.map((note) => new Option(note));
    rootSelect.append(...options);
    rootSelect.value = layout.root;
    rootSelect.addEventListener("change", (_) => layout.root = rootSelect.value);
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

<select name="root"></select>
`;

// components/fav.ts
var Fav = class extends HTMLElement {
};

// components/song.ts
var Song = class extends HTMLElement {
};

// components/menu.ts
var Menu = class extends HTMLElement {
  constructor() {
    super();
    this.popover = "auto";
  }
  connectedCallback() {
    this.innerHTML = ":-)";
  }
};

// index.ts
customElements.define("ck-app", App);
customElements.define("ck-chord", Chord);
customElements.define("ck-layout", Layout);
customElements.define("ck-chords", Chords);
customElements.define("ck-fav", Song);
customElements.define("ck-song", Fav);
customElements.define("ck-menu", Menu);
