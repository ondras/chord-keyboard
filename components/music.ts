export const NOTES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "B♭", "B"] as const;
export type Note = typeof NOTES[number];

export function noteToNumber(note: Note) {
	return NOTES.indexOf(note);
}

export function numberToNote(number: number) {
	return NOTES[number % NOTES.length];
}

export const ChordTypes = {
	"major": [0, 4, 7],
	"minor": [0, 3, 7],
	"diminished": [0, 3, 6],
	"augmented": [0, 4, 8]
} as const;

export type ChordType = keyof typeof ChordTypes;


export const SCALE_MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const SCALE_MINOR_NATURAL = [0, 2, 3, 5, 7, 8, 10];
export const SCALE_MINOR_HARMONIC = [0, 2, 3, 5, 7, 8, 11];

export function findChordType(numbers: number[]): ChordType {
	let type: ChordType;
	for (type in ChordTypes) {
		if (ChordTypes[type as ChordType].join(",") == numbers.join(",")) { return type; }
	}
	throw new Error("FIXME")
}

export type SeventhType = "diminished" | "minor" | "major";
export const Sevenths: Record<SeventhType, number> = {
	"diminished": 9,
	"minor": 10,
	"major": 11
}

export function buildRootSelect() {
	let select = document.createElement("select");
	select.name = "root";
	let options = NOTES.map(note => new Option(note));
	select.append(...options);
	return select;
}

export function buildOctaveSelect() {
	let select = document.createElement("select");
	select.name = "octave";
	for (let i=1;i<=7;i++) {
		let option = new Option(`Oct. ${i}`, String(i));
		select.append(option);
	}
	return select;
}

export function buildSeventhSelect() {
	let select = document.createElement("select");
	select.name = "seventh";
	select.append(
		new Option("No 7th", ""),
		new Option("Major 7th", "major"),
		new Option("Minor 7th", "minor"),
		new Option("Diminished 7th", "diminished")
	)
	return select;
}
