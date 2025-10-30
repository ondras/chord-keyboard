export const NOTE_ON = 0x90;
export const NOTE_OFF = 0x80;

export const NOTE_MIN = 21;
export const NOTE_MAX = 127;

export function noteNumberToFrequency(n: number) {
	return 440 * (2 ** ((n-69)/12));
}

export async function requestAccess() {
	return navigator.requestMIDIAccess();
}
