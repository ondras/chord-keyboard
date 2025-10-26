import Song from "./song.ts";
import Fav from "./fav.ts";
import Chords from "./chords.ts";
import Chord from "./chord.ts";
import Synth from "./synth.ts";
import * as midi from "./midi.ts";
import Menu from "./menu.ts";


const channel = 0;

type Mode = "play" | "edit" | "organize";
const DEFAULT_MODE: Mode = "play";


export default class App extends HTMLElement {
	static get observedAttributes() { return ["mode"]; }

	protected output: MIDIOutput = new Synth();
	protected playingNotes = new Map<number, number>();

	protected get fav() { return this.querySelector<Fav>("ck-fav")!; }
	protected get song() { return this.querySelector<Song>("ck-song")!; }
	protected get chords() { return this.querySelector<Chords>("ck-chords")!; }

	protected get menu() { return this.querySelector<Menu>("ck-menu")!; }

	get mode(): Mode { return this.getAttribute("mode") as Mode || DEFAULT_MODE; }
	set mode(mode: Mode) {this.setAttribute("mode", mode); }

	constructor() {
		super();
		window.addEventListener("hashchange", _ => this.loadState())
	}

	connectedCallback() {
		this.innerHTML = HTML;
		this.loadState();
	}

	play(chord: Chord) {
		chord.notes.forEach(note => this.playNote(note));
	}

	stop(chord: Chord) {
		chord.notes.forEach(note => this.stopNote(note));
	}

	toggleMenu(chord: Chord) {
		this.menu.showPopover({source:chord});
	}

	protected playNote(note: number) {
		const { playingNotes, output } = this;
		let current = playingNotes.get(note) || 0;

		if (!current) { // zacit hrat
			let midiMessage = [midi.NOTE_ON+channel, note, 100];
			output.send(midiMessage);
		}

		current++;
		playingNotes.set(note, current);
	}

	protected stopNote(note: number) {
		const { playingNotes, output } = this;
		let current = playingNotes.get(note) || 0;
		if (!current) { return; } // divny, nema se stavat

		current--;
		playingNotes.set(note, current);

		if (!current) { // prestat hrat
			let midiMessage = [midi.NOTE_OFF+channel, note, 100];
			output.send(midiMessage);
		}
	}

	protected loadState() {
		let name = location.hash.substring(1) || "chords";
		let modules = {
			fav: this.fav,
			song: this.song,
			chords: this.chords,
		}
		Object.entries(modules).forEach(([key, module]) => module.hidden = (key != name));
	}
}


const HTML = `
<main>
	<ck-chords></ck-chords>
	<ck-song></ck-song>
	<ck-fav></ck-fav>
</main>
<nav>
	<a href="#chords">🎹 Chords</a>
	<a href="#song">🎶 Song</a>
	<a href="#fav">⭐ Favorites</a>
</nav>
<ck-menu></ck-menu>
`;
