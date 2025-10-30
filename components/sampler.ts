import * as midi from "./midi.ts";


const ATTACK = 0.05;
const RELEASE = 0.05;

const samples = new Map<number, Promise<AudioBuffer>>();

export default class Synth extends EventTarget implements MIDIOutput {
	readonly id = "sampler";
	readonly manufacturer = "ondras";
	readonly name = "sample player";
	readonly type = "output";
	readonly version = "0.0.1";
	readonly state = "connected";
	readonly connection = "open";
	onstatechange = null;

	protected ctx = new AudioContext();
	protected playing = new Map<number, AudioBufferSourceNode>();
	protected output: AudioNode;

	async open() { return this; }
	async close() { return this; }

	constructor() {
		super();

		const { ctx } = this;

		let compressor = ctx.createDynamicsCompressor();
		compressor.connect(ctx.destination);
		this.output = compressor;
	}

	send(data: number[], timestamp?: DOMHighResTimeStamp) {
		let [status, midiNote, velocity] = data;
		switch (status & 0xF0) {
			case midi.NOTE_ON: velocity ? this.noteOn(midiNote) : this.noteOff(midiNote); break;
			case midi.NOTE_OFF: this.noteOff(midiNote); break;
		}
	}

	protected async noteOn(midiNote: number) {
		const { playing, ctx, output } = this;
		if (playing.has(midiNote)) { return; }

		let buffer = await getSampleBuffer(midiNote, ctx);

		const src = ctx.createBufferSource()!;
  		src.buffer = buffer;
		src.connect(output);
		src.start();

		playing.set(midiNote, src);
	}

	protected noteOff(midiNote: number) {
		const { playing } = this;

		let audioNode = playing.get(midiNote);
		if (!audioNode) { return; }

		audioNode.stop();
		playing.delete(midiNote);
	}
}

function getSampleBuffer(midiNote: number, ctx: AudioContext) {
	if (samples.has(midiNote)) { return samples.get(midiNote)!; }

	let { promise, resolve } = Promise.withResolvers<AudioBuffer>();
	samples.set(midiNote, promise);

	let sampleName = getSampleName(midiNote);
	let url = `https://raw.githubusercontent.com/fuhton/piano-mp3/refs/heads/master/piano-mp3/${sampleName}.mp3`;
	fetch(url).then(async response => {
		let buffer = await response.arrayBuffer();
		let audioBuffer = await ctx.decodeAudioData(buffer);
		resolve(audioBuffer);
  	});

	return promise;
}

const NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function getSampleName(midiNote: number) {
	// C1 == 24
	let octave = Math.floor(midiNote/12)-1;
	let note = midiNote % 12;
	return `${NAMES[note]}${octave}`;
}


