import App from "./app.ts";
import { ChordType, Note, noteToNumber } from "./music.ts";


const ATTRIBUTES = ["root", "octave", "type"] as const;


const DEFAULT_ROOT: Note = "C";
const DEFAULT_TYPE: ChordType = "major";
const DEFAULT_OCTAVE = 5;

export default class Chord extends HTMLElement {
	get app() { return this.closest<App>("ck-app")!; }

	static get observedAttributes() { return ATTRIBUTES; }

	get octave() { return Number(this.getAttribute("octave")) || DEFAULT_OCTAVE; }
	set octave(octave: number) {this.setAttribute("octave", String(octave)); }

	get root(): Note { return this.getAttribute("root") as Note || DEFAULT_ROOT; }
	set root(root: Note) {this.setAttribute("root", root); }

	get type(): ChordType { return this.getAttribute("type") as ChordType || DEFAULT_TYPE; }
	set type(type: ChordType) {this.setAttribute("type", type); }


	constructor() {
		super();
		this.addEventListener("pointerdown", e => this.app.play(this))
		this.addEventListener("pointerup", e => this.app.stop(this));
	}

	connectedCallback() {
		this.updateLabel();
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		this.updateLabel();
	}

	get notes() {
		let base = this.octave*12;
		base += noteToNumber(this.root);
		return [0, 4, 7].map(note => note + base);
	}

	protected updateLabel() {
		this.textContent = `(${this.octave}) ${this.root} ${this.type}`;
	}
}
