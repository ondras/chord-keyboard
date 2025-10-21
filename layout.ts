import App from "./app.ts";
import Chord from "./chord.ts";
import { noteToNumber, numberToNote, Note, SCALE_MAJOR, SCALE_MINOR_NATURAL, SCALE_MINOR_HARMONIC, findChordType } from "./music.ts";


type LayoutType = "fifths" | "major-triads";
const ATTRIBUTES = ["root", "octave", "type"] as const;


const DEFAULT_ROOT = "C";
const DEFAULT_TYPE: LayoutType = "major-triads";
const DEFAULT_OCTAVE = 5;

export default class Layout extends HTMLElement {
	get app() { return this.closest<App>("ck-layout")!; }

	static get observedAttributes() { return ATTRIBUTES; }

	get octave() { return Number(this.getAttribute("octave")) || DEFAULT_OCTAVE; }
	set octave(octave: number) {this.setAttribute("octave", String(octave)); }

	get root(): Note { return this.getAttribute("root") as Note || DEFAULT_ROOT; }
	set root(root: Note) {this.setAttribute("root", root); }

	get type(): LayoutType { return this.getAttribute("type") as LayoutType || DEFAULT_TYPE; }
	set type(type: LayoutType) {this.setAttribute("type", type); }

	constructor() {
		super();
	}

	connectedCallback() {
		this.generate();
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		this.generate();
	}

	protected generate() {
		let chords: Chord[];
		switch (this.type) {
			case "fifths":
				chords = generateFifths(this.octave, this.root);
			break;

			case "major-triads":
				chords = generateTriads(this.octave, this.root, "major");
			break;
		}
		this.replaceChildren(...chords);
	}
}

function generateFifths(octave: number, root: Note) {
	let base = noteToNumber(root);
	let offsets = new Array(12).fill(0).map((_, i) => 5*i);
	return offsets.map(offset => {
		let chord = new Chord();
		chord.octave = octave;
		chord.root = numberToNote(base + offset);
		return chord;
	});
}


function generateTriads(octave: number, root: Note, type: "major" | "minor") {
	let base = noteToNumber(root);
	let triadOffsetsInScale = [0, 2, 4];

	return SCALE_MINOR_HARMONIC.map((majorNote, scaleIndex, allNotes) => {
		let chord = new Chord();
		chord.root = numberToNote((majorNote + base) % 12);

		let notes = triadOffsetsInScale.map(triadOffset => {
			let index = (scaleIndex + triadOffset);
			let tone = allNotes[index % allNotes.length];
			return (tone + 12 - majorNote) % 12;
		});

		console.log("majorNote", majorNote);
		console.log("notes", notes);

		chord.type = findChordType(notes)

		return chord;
	})
}
