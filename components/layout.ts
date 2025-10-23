import App from "./app.ts";
import Chord from "./chord.ts";
import { noteToNumber, numberToNote, Note, SCALE_MAJOR, SCALE_MINOR_NATURAL, SCALE_MINOR_HARMONIC, ChordType, findChordType } from "./music.ts";


type LayoutType = "fifths" | "triads-major" | "triads-minor";
const ATTRIBUTES = ["root", "octave", "type"] as const;


const DEFAULT_ROOT = "C";
const DEFAULT_OCTAVE = 4;

export default class Layout extends HTMLElement {
	get app() { return this.closest<App>("ck-layout")!; }

	static get observedAttributes() { return ATTRIBUTES; }

	get octave() { return Number(this.getAttribute("octave")) || DEFAULT_OCTAVE; }
	set octave(octave: number) {this.setAttribute("octave", String(octave)); }

	get root(): Note { return this.getAttribute("root") as Note || DEFAULT_ROOT; }
	set root(root: Note) {this.setAttribute("root", root); }

	get type(): LayoutType { return this.getAttribute("type") as LayoutType; }
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
		let chords: Chord[] = [];

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

			case "triads-minor":
				chords = generateTriads(this.octave, this.root, "minor");
			break;
		}
		this.replaceChildren(...chords);
	}
}

function generateFifths(octave: number, root: Note, type: ChordType) {
	let base = noteToNumber(root);
	let offsets = new Array(12).fill(0).map((_, i) => 5*i);
	return offsets.map((offset, index) => {
		let chord = new Chord();
		chord.octave = octave;
		chord.type = type;
		chord.root = numberToNote(base + offset);
		chord.style.setProperty("--index", String(index));
		return chord;
	});
}

function generateTriads(octave: number, root: Note, type: "major" | "minor") {
	let base = noteToNumber(root);
	let triadOffsetsInScale = [0, 2, 4];

	return SCALE_MINOR_HARMONIC.map((majorNote, scaleIndex, allNotes) => {
		let chord = new Chord();
		chord.root = numberToNote((majorNote + base) % 12);
		chord.octave = octave;

		let notes = triadOffsetsInScale.map(triadOffset => {
			let index = (scaleIndex + triadOffset);
			let tone = allNotes[index % allNotes.length];
			return (tone + 12 - majorNote) % 12;
		});
		chord.type = findChordType(notes)

		return chord;
	})
}
