import Chord from "./chord.ts";
import App from "./app.ts";
import * as music from "./music.ts";


export default class Menu extends HTMLElement {
	get app() { return this.closest<App>("ck-app")!; }

	constructor() {
		super();
		this.popover = "auto";
	}

	toggleForChord(chord: Chord) {
		const { app } = this;

		let items = [
			app.fav.hasChord(chord) ? buildRemove(chord, this, app.fav) : buildAdd(chord, this, app.fav),
			app.song.hasChord(chord) ? buildRemove(chord, this, app.song) : buildAdd(chord, this, app.song),
			buildDuplicate(chord),
			buildType(chord),
			buildRoot(chord),
			buildOctave(chord)
		].map(item => item);

		this.replaceChildren(...items);

		this.togglePopover({source:chord});
	}
}

function buildType(chord: Chord) {
	let label = document.createElement("label");
	let select = document.createElement("select");
	select.append(
		new Option("Major", "major"),
		new Option("Minor", "minor"),
		new Option("Diminished", "diminished"),
		new Option("Augmented", "augmented")
	);
	select.value = chord.type;
	select.addEventListener("change", _ => chord.type = select.value as music.ChordType);
	label.append("Triad:", select);

	return label;
}

function buildAdd(chord: Chord, popover: HTMLElement, what: typeof App.prototype.fav | typeof App.prototype.song) {
	let button = document.createElement("button");
	button.append(`${what.icon} Add`);
	button.addEventListener("click", _ => {
		what.addChord(chord);
		popover.hidePopover();
	});
	return button;
}

function buildRemove(chord: Chord, popover: HTMLElement, what: typeof App.prototype.fav | typeof App.prototype.song) {
	let button = document.createElement("button");
	button.append("❌ Remove");
	button.addEventListener("click", _ => {
		what.removeChord(chord);
		popover.hidePopover();
	});
	return button;
}

function buildDuplicate(chord: Chord) {
	let button = document.createElement("button");
	button.append("➕ Clone");
	button.addEventListener("click", _ => {
		let clone = chord.cloneNode(true);
	});
	return button;
}

function buildRoot(chord: Chord) {
	let label = document.createElement("label");
	let select = music.buildRootSelect();
	select.value = chord.root;
	select.addEventListener("change", _ => chord.root = select.value as music.Note);
	label.append("Root:", select);
	return label;
}

function buildOctave(chord: Chord) {
	let label = document.createElement("label");
	let select = music.buildOctaveSelect();
	select.value = String(chord.octave);
	select.addEventListener("change", _ => chord.octave = Number(select.value));
	label.append("Octave:", select);
	return label;
}
