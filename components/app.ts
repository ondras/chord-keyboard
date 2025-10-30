import * as midi from "./midi.ts";
import Song from "./song.ts";
import Fav from "./fav.ts";
import Chords from "./chords.ts";
import Chord from "./chord.ts";
import Synth from "./synth.ts";
import Menu from "./menu.ts";


const channel = 0;

export default class App extends HTMLElement {
	protected outputs: MIDIOutput[] = [];
	protected playingNotes = new Map<number, number>();

	get fav() { return this.querySelector<Fav>("ck-fav")!; }
	get song() { return this.querySelector<Song>("ck-song")!; }
	get chords() { return this.querySelector<Chords>("ck-chords")!; }

	protected get menu() { return this.querySelector<Menu>("ck-menu")!; }

	constructor() {
		super();
		window.addEventListener("hashchange", _ => this.loadState())
	}

	async connectedCallback() {
		this.innerHTML = HTML;

		this.querySelector(`[href="#fav"] span`)!.append(this.fav.icon);
		this.querySelector(`[href="#song"] span`)!.append(this.song.icon);

		this.loadState();

		try {
			let midiAccess = await midi.requestAccess();
			this.outputs = [new Synth(), ...midiAccess.outputs.values()];
		} catch (e) {
			this.outputs = [new Synth()];
		}
	}

	play(chord: Chord) {
		chord.notes.forEach(note => this.playNote(note));
	}

	stop(chord: Chord) {
		chord.notes.forEach(note => this.stopNote(note));
	}

	toggleMenu(chord: Chord) {
		this.menu.toggleForChord(chord);
	}

	protected playNote(note: number) {
		const { playingNotes, outputs } = this;
		let current = playingNotes.get(note) || 0;

		if (!current) { // zacit hrat
			let midiMessage = [midi.NOTE_ON+channel, note, 100];
			outputs.forEach(output => output.send(midiMessage));
		}

		current++;
		playingNotes.set(note, current);
	}

	protected stopNote(note: number) {
		const { playingNotes, outputs } = this;
		let current = playingNotes.get(note) || 0;
		if (!current) { return; } // divny, nema se stavat

		current--;
		playingNotes.set(note, current);

		if (!current) { // prestat hrat
			let midiMessage = [midi.NOTE_OFF+channel, note, 100];
			outputs.forEach(output => output.send(midiMessage));
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

		[...this.querySelectorAll("a")].forEach(link => link.classList.toggle("active", link.href.endsWith(location.hash)));
	}
}


const HTML = `
<main>
	<ck-chords></ck-chords>
	<ck-song></ck-song>
	<ck-fav></ck-fav>
</main>
<nav>
	<a href="#chords"><span>🎹</span>Chords</a>
	<a href="#song"><span></span>Song</a>
	<a href="#fav"><span></span>Favorites</a>
</nav>
<ck-menu></ck-menu>
`;
