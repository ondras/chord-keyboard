import App from "./app.ts";
import { ChordType, ChordTypes, Note, noteToNumber } from "./music.ts";


const DEFAULT_ROOT: Note = "C";
const DEFAULT_TYPE: ChordType = "major";
const DEFAULT_OCTAVE = 4;

export default class Chord extends HTMLElement {
	get app() { return this.closest<App>("ck-app")!; }

	static get observedAttributes() { return ["root", "octave", "type"]; }

	get octave() { return Number(this.getAttribute("octave")) || DEFAULT_OCTAVE; }
	set octave(octave: number) {this.setAttribute("octave", String(octave)); }

	get root(): Note { return this.getAttribute("root") as Note || DEFAULT_ROOT; }
	set root(root: Note) {this.setAttribute("root", root); }

	get type(): ChordType { return this.getAttribute("type") as ChordType || DEFAULT_TYPE; }
	set type(type: ChordType) {this.setAttribute("type", type); }


	constructor() {
		super();
		this.addEventListener("pointerdown", e => this.onPointerDown(e));
		this.addEventListener("click", e => this.onClick());
	}

	connectedCallback() {
		this.updateLabel();
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		this.updateLabel();
	}

	get notes(): number[] {
		let base = (this.octave+1)*12;
		base += noteToNumber(this.root);
		return ChordTypes[this.type].map(note => note + base);
	}

	protected onClick() {
		const { app } = this;
		if (app.mode == "play") { return; }
		app.toggleMenu(this);
	}

	protected onPointerDown(e: PointerEvent) {
		const { app } = this;
		if (app.mode != "play") { return; }

		let ac = new AbortController();
		let { signal } = ac;
		let abort = () => {
			ac.abort();
			this.app.stop(this);
		}
		this.addEventListener("pointerup", abort, {signal})
		this.addEventListener("pointerleave", abort, {signal})
		this.app.play(this);
	}

	protected updateLabel() {
		this.textContent = `(${this.octave}) ${this.root} ${this.type}`;
	}
}
