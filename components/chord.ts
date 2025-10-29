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

	protected label = document.createElement("span");
	protected config = document.createElement("button");

	constructor() {
		super();
		this.addEventListener("pointerdown", e => this.onPointerDown(e));
		this.config.addEventListener("click", e => this.onClickConfig(e));

		// problem #1: kdyz ukazu na pointerdown, tak se pak schova na pointerup
		// problem #2: kdyz udelam na click toggle, tak dalsi click ho nejdriv schova a pak zase ukaze
	}

	connectedCallback() {
		const { label, config } = this;

		this.replaceChildren(label, config);
		config.textContent = "⚙️";

		this.updateLabel();
		this.updateOctave();
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		switch (name) {
			case "root":
			case "type":
				this.updateLabel();
			break;

			case "octave":
				this.updateOctave();
			break;
		}
	}

	get notes(): number[] {
		let base = (this.octave+1)*12;
		base += noteToNumber(this.root);
		return ChordTypes[this.type].map(note => note + base);
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
}


const TYPE_SUFFIX: Record<ChordType, string> = {
	"major": "",
	"minor": "m",
	"augmented": "+",
	"diminished": "<sup>o</sup>",
}

function formatLabel(chord: Chord) {
	return `${chord.root}${TYPE_SUFFIX[chord.type]}`;
}