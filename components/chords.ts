import Layout from "./layout.ts";

export default class Chords extends HTMLElement {
	protected layout = new Layout();
	protected buttons = {
		fifths: document.createElement("button"),
		triadsMajor: document.createElement("button"),
		triadsMinor: document.createElement("button")
	}

	constructor() {
		super();

		const { buttons } = this;

		buttons.fifths.textContent = "5ths";
		buttons.triadsMajor.textContent = "major scale triads";
		buttons.triadsMinor.textContent = "minor scale triads";

		buttons.fifths.addEventListener("click", _ => this.layout.type = "fifths");
		buttons.triadsMajor.addEventListener("click", _ => this.layout.type = "triads-major");
		buttons.triadsMinor.addEventListener("click", _ => this.layout.type = "triads-minor");
	}

	connectedCallback() {
		const { buttons, layout } = this;

		let header = document.createElement("header");
		header.append(buttons.fifths, buttons.triadsMajor, buttons.triadsMinor);

		this.replaceChildren(header, layout)
	}
}
