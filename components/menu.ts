import Chord from "./chord.ts";
import App from "./app.ts";
import { ChordType, Note } from "./music.ts";


export default class Menu extends HTMLElement {
	get app() { return this.closest<App>("ck-app")!; }
	protected chord!: Chord;

	protected get fav() { return this.byName<HTMLInputElement>("fav"); }
	protected get song() { return this.byName<HTMLInputElement>("song"); }
	protected get type() { return this.byName<HTMLSelectElement>("type"); }
	protected get root() { return this.byName<HTMLSelectElement>("root"); }
	protected get octave() { return this.byName<HTMLSelectElement>("octave"); }

	protected byName<T extends HTMLElement = HTMLElement>(name: string) { return this.querySelector<T>(`[name=${name}]`)!; }

	constructor() {
		super();
		this.popover = "auto";
	}

	connectedCallback() {
		this.innerHTML = HTML;

		const { app, fav, song, type, root, octave } = this;

		type.addEventListener("change", _ => this.chord.type = type.value as ChordType);
		root.addEventListener("change", _ => this.chord.root = root.value as Note);
		octave.addEventListener("change", _ => this.chord.octave = Number(octave.value));
		fav.addEventListener("change", _ => fav.checked ? app.fav.addChord(this.chord) : app.fav.removeChord(this.chord));
		song.addEventListener("change", _ => song.checked ? app.song.addChord(this.chord) : app.song.removeChord(this.chord));
	}

	toggleForChord(chord: Chord) {
		this.chord = chord;

		this.type.value = chord.type;
		this.root.value = chord.root;
		this.octave.value = String(chord.octave);

		// fixme nacist stav z akordu
		this.togglePopover({source:chord});
	}
}

const HTML = `
<label>⭐<input type="checkbox" name="fav" /></label>
<label>🎶<input type="checkbox" name="song" /></label>
<label>Triad: <select name="type">
  <option value="major">Major</option>
  <option value="minor">Minor</option>
  <option value="diminished">Diminished</option>
  <option value="augmented">Augmented</option>
</select></label>
<label>Root: <select name="root"></select></label>
<label>Octave: <select name="octave"></select></label>
`;
