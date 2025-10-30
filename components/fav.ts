import Chord, { ChordData } from "./chord.ts";


export default class Fav extends HTMLElement {
	get icon() { return "⭐"; }

	connectedCallback() {
		this.load();
	}

	addChord(chord: Chord) {
		this.append(chord.cloneNode(true));
		this.save();
		this.pulse();
	}

	removeChord(chord: Chord) {
		chord.remove();
		this.save();
		this.pulse();
	}

	hasChord(chord: Chord) {
		return (chord.parentElement == this);
	}

	protected get chords() { return [...this.children].filter(ch => ch instanceof Chord); }

	protected pulse() {

	}

	protected save() {
		let data = {chords:this.chords};
		let str = JSON.stringify(data);
		localStorage.setItem("fav", str);
	}

	protected load() {
		let str = localStorage.getItem("fav") || "{}";
		let data = JSON.parse(str) as {chords:ChordData[]};
		let chords = data.chords.map(ch => Chord.fromJSON(ch));
		this.replaceChildren(...chords);
	}
}
