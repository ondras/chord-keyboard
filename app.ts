import Chord from "./chord.ts";
import Synth from "./synth.ts";
import * as midi from "./midi.ts";


const channel = 0;

export default class App extends HTMLElement {
	protected output: MIDIOutput = new Synth();

	play(chord: Chord) {
		const { output } = this;

		chord.notes.forEach(note => {
			let midiMessage = [midi.NOTE_ON+channel, note, 100];
			output.send(midiMessage);
		});
	}

	stop(chord: Chord) {
		const { output } = this;

		chord.notes.forEach(note => {
			let midiMessage = [midi.NOTE_OFF+channel, note, 100];
			output.send(midiMessage);
		});
	}
}


