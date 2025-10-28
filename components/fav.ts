import Chord from "./chord.ts";


export default class Fav extends HTMLElement {
	get icon() { return "⭐"; }

	addChord(chord: Chord) {
		this.append(chord.cloneNode(true));
		this.pulse();
	}

	removeChord(chord: Chord) {
		chord.remove();
		this.pulse();
	}

	hasChord(chord: Chord) {
		return (chord.parentElement == this);
	}

	protected pulse() {

	}
}
