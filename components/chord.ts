import App from "./app.ts";
import { ChordType, ChordTypes, SeventhType, Sevenths, Note, noteToNumber } from "./music.ts";


const DEFAULT_ROOT: Note = "C";
const DEFAULT_TYPE: ChordType = "major";
const DEFAULT_OCTAVE = 4;

export interface ChordData {
	octave: number;
	root: Note;
	type: ChordType;
	seventh: SeventhType | null;
}

export default class Chord extends HTMLElement {
	get app() { return this.closest<App>("ck-app")!; }

	static get observedAttributes() { return ["root", "octave", "type", "seventh"]; }

	get octave() { return Number(this.getAttribute("octave")) || DEFAULT_OCTAVE; }
	set octave(octave: number) {this.setAttribute("octave", String(octave)); }

	get root(): Note { return this.getAttribute("root") as Note || DEFAULT_ROOT; }
	set root(root: Note) {this.setAttribute("root", root); }

	get type(): ChordType { return this.getAttribute("type") as ChordType || DEFAULT_TYPE; }
	set type(type: ChordType) {this.setAttribute("type", type); }

	get seventh(): SeventhType | null { return this.getAttribute("seventh") as SeventhType; }
	set seventh(seventh: SeventhType | null) { seventh ? this.setAttribute("seventh", seventh) : this.removeAttribute("seventh"); }

	protected label = document.createElement("span");
	protected config = document.createElement("button");

	constructor() {
		super();
		this.addEventListener("pointerdown", e => this.onPointerDown(e));
		this.config.addEventListener("click", e => this.onClickConfig(e));

		// problem #1: kdyz ukazu na pointerdown, tak se pak schova na pointerup
		// problem #2: kdyz udelam na click toggle, tak dalsi click ho nejdriv schova a pak zase ukaze
	}

	static fromJSON(data: ChordData) {
		let chord = new this();
		Object.assign(chord, data);
		return chord;
	}

	toJSON(): ChordData {
		return {
			type: this.type,
			octave: this.octave,
			root: this.root,
			seventh: this.seventh
		}
	}

	connectedCallback() {
		const { label, config } = this;

		this.replaceChildren(label, config);
		config.textContent = "⚙️";
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
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

		this.dispatchEvent(new Event("change", {bubbles:true}));
	}

	cloneNode(subtree: boolean) {
		let clone = super.cloneNode(subtree) as typeof this;

		// circle layout
		clone.style.removeProperty("--index");
		delete clone.dataset.circle;

		return clone;
	}

	get notes(): number[] {
		const { octave, root, type, seventh } = this;
		let base = (octave+1)*12;
		base += noteToNumber(root);
		let notes = ChordTypes[type].map(note => note + base);
		if (seventh) { notes.push(base + Sevenths[seventh]); }
		return notes;
	}

	protected onClickConfig(e: MouseEvent) {
		this.app.toggleMenu(this);
	}

	protected onPointerDown(e: PointerEvent) {
		const { app, config } = this;

		if (config.contains(e.target as Element)) {
			e.stopPropagation();
			return;
		}

		let ac = new AbortController();
		let { signal } = ac;
		let abort = () => {
			ac.abort();
			app.stop(this);
		}
		this.addEventListener("pointerup", abort, {signal})
		this.addEventListener("pointerleave", abort, {signal})
		app.play(this);
	}

	protected updateLabel() {
		this.label.innerHTML = formatLabel(this);
	}

	protected updateOctave() {
		this.style.setProperty("--octave", String(this.octave));
	}

	protected updateHue() {
		let number = noteToNumber(this.root);
		let angle = number * 360/12;
		this.style.setProperty("--hue", `${angle}deg`);
	}
}


const TYPE_SUFFIX: Record<ChordType, string> = {
	"major": "",
	"minor": "m",
	"augmented": "+",
	"diminished": "<sup>o</sup>"
}

const SEVENTH_SUFFIX: Record<SeventhType, string> = {
	"diminished": "6",
	"minor": "7",
	"major": "M7"
}

function formatLabel(chord: Chord) {
	let parts = [
		chord.root,
		TYPE_SUFFIX[chord.type]
	];
	if (chord.seventh) {
		parts.push(SEVENTH_SUFFIX[chord.seventh]);
	}
	return parts.join("");
}
