export const ChordTypes = {
	"major": [0, 4, 7],
	"minor": [0, 3, 7],
	"diminished": [0, 3, 6],
	"augmented": [0, 4, 8]
} as const;

export type ChordType = keyof typeof ChordTypes;

export const NOTES = ["A", "B♭", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯"] as const;

export type Note = typeof NOTES[number];

export function noteToNumber(note: Note) {
	return NOTES.indexOf(note);
}

export function numberToNote(number: number) {
	return NOTES[number % NOTES.length];
}

export const SCALE_MAJOR = [0, 2, 4, 5, 7, 9, 11];
export const SCALE_MINOR_NATURAL = [0, 2, 3, 5, 7, 8, 10];
export const SCALE_MINOR_HARMONIC = [0, 2, 3, 5, 7, 8, 11];

export function findChordType(numbers: number[]): ChordType {
	for (let type in ChordTypes) {
		if (ChordTypes[type].join(",") == numbers.join(",")) { return type as ChordType; }
	}
	throw new Error("FIXME")
}
