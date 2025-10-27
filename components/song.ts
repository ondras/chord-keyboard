import Chord from "./chord.ts";


export default class Song extends HTMLElement {
	addChord(chord: Chord) {
		this.append(chord.cloneNode(true));
		// FIXME event
	}

	removeChord(chord: Chord) {
		chord.remove();
		// FIXME event
	}
}
