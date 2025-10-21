import * as midi from "./midi.ts";


interface AudioNodes {
	oscillator: OscillatorNode;
	gain: GainNode;
}

const ATTACK = 0.05;
const RELEASE = 0.05;

export default class Synth extends EventTarget implements MIDIOutput {
	readonly id = "synth";
	readonly manufacturer = "ondras";
	readonly name = "web audio synth";
	readonly type = "output";
	readonly version = "0.0.1";
	readonly state = "connected";
	readonly connection = "open";
	onstatechange = null;

	protected ctx = new AudioContext();
	protected playing = new Map<number, AudioNodes>();
	protected output: AudioNode;

	async open() { return this; }
	async close() { return this; }

	constructor() {
		super();

		const { ctx } = this;

		let compressor = ctx.createDynamicsCompressor();
		compressor.connect(ctx.destination);
//		this.output = ctx.destination;
		this.output = compressor;
	}

	send(data: number[], timestamp?: DOMHighResTimeStamp) {
		let [status, note, velocity] = data;
		switch (status & 0xF0) {
			case midi.NOTE_ON: velocity ? this.noteOn(note) : this.noteOff(note); break;
			case midi.NOTE_OFF: this.noteOff(note); break;
		}
	}

	protected noteOn(note: number) {
		const { playing, ctx, output } = this;
		if (playing.has(note)) { return; }

		let audioNodes = createOscillator(ctx, midi.noteNumberToFrequency(note));
		audioNodes.gain.connect(output);

		playing.set(note, audioNodes);
	}

	protected noteOff(note: number) {
		const { playing } = this;

		let audioNodes = playing.get(note);
		if (!audioNodes) { return; }

		destroyOscillator(audioNodes);
		playing.delete(note);
	}
}

function createOscillator(ctx: AudioContext, frequency: number): AudioNodes {
	let oscillator = ctx.createOscillator();
	let gain = ctx.createGain();


	gain.gain.setValueAtTime(0, ctx.currentTime);
	gain.gain.linearRampToValueAtTime(1, ctx.currentTime + ATTACK);

	oscillator.frequency.value = frequency;
	oscillator.connect(gain);
	oscillator.start();

	return { oscillator, gain };
}

function destroyOscillator(audioNodes: AudioNodes) {
	const { oscillator, gain } = audioNodes;

	const { currentTime } = gain.context;
	gain.gain.setValueAtTime(1, currentTime);
	gain.gain.linearRampToValueAtTime(0, currentTime + RELEASE);

	oscillator.stop(currentTime + RELEASE);
}
