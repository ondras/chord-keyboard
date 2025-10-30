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

		let isFav = app.fav.hasChord(chord);
		let isSong = app.song.hasChord(chord);

		let items = [
			!isFav ? buildAdd(chord, this, app.fav) : null,
			!isSong ? buildAdd(chord, this, app.song) : null,

			...(isFav ? [
				buildRemove(chord, this, app.fav),
				buildDuplicate(chord, this, app.fav)
			] : []),

			 ...(isSong ? [
				buildRemove(chord, this, app.song),
				buildDuplicate(chord, this, app.song)
			] : []),

			buildRoot(chord),
			buildType(chord),
			buildOctave(chord),
			buildSeventh(chord)
		];

		let nodes = items.filter(item => item) as HTMLElement[];
		this.replaceChildren(...nodes);

		this.togglePopover({source:chord});
	}
}

function buildType(chord: Chord) {
	let select = document.createElement("select");
	select.name = "type";
	select.append(
		new Option("Major", "major"),
		new Option("Minor", "minor"),
		new Option("Diminished", "diminished"),
		new Option("Augmented", "augmented")
	);
	select.value = chord.type;
	select.addEventListener("change", _ => chord.type = select.value as music.ChordType);

	return select;
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

function buildDuplicate(chord: Chord, popover: HTMLElement, what: typeof App.prototype.fav | typeof App.prototype.song) {
	let button = document.createElement("button");
	button.append("➕ Clone");
	button.addEventListener("click", _ => {
		let clone = chord.cloneNode(true) as Chord;
		what.addChord(clone);
		popover.hidePopover();
	});
	return button;
}

function buildRoot(chord: Chord) {
	let select = music.buildRootSelect();
	select.value = chord.root;
	select.addEventListener("change", _ => chord.root = select.value as music.Note);
	return select;
}

function buildOctave(chord: Chord) {
	let select = music.buildOctaveSelect();
	select.value = String(chord.octave);
	select.addEventListener("change", _ => chord.octave = Number(select.value));
	return select;
}

function buildSeventh(chord: Chord) {
	let select = music.buildSeventhSelect();
	select.value = String(chord.seventh || "");
	select.addEventListener("change", _ => chord.seventh = select.value as music.SeventhType || null);
	return select;
}
