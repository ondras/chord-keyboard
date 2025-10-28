import Chord from "./chord.ts";


export default class Song extends HTMLElement {
	get icon() { return "🎶"; }

	addChord(chord: Chord) {
		this.append(chord.cloneNode(true));
		// FIXME event
	}

	removeChord(chord: Chord) {
		chord.remove();
		// FIXME event
	}

	hasChord(chord: Chord) {
		return (chord.parentElement == this);
	}
}
