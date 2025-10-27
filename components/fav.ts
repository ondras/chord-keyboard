import Chord from "./chord.ts";


export default class Fav extends HTMLElement {
	addChord(chord: Chord) {
		this.append(chord.cloneNode(true));
		this.pulse();
	}

	removeChord(chord: Chord) {
		chord.remove();
		this.pulse();
	}

	protected pulse() {

	}
}
