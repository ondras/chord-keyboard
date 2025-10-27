import Layout from "./layout.ts";
import * as music from "./music.ts";



export default class Chords extends HTMLElement {
	protected layout = new Layout();
	protected header = document.createElement("header");
	protected get layoutSelect() { return this.header.querySelector<HTMLSelectElement>("[name=layout]")!; }
	protected get rootSelect() { return this.header.querySelector<HTMLSelectElement>("[name=root]")!; }
	protected get octaveSelect() { return this.header.querySelector<HTMLSelectElement>("[name=octave]")!; }

	connectedCallback() {
		const { header, layout,  } = this;
		this.replaceChildren(header, layout);

		header.innerHTML = HEADER_HTML;

		const { layoutSelect, rootSelect, octaveSelect } = this;

		layoutSelect.addEventListener("change", _ => {
			layout.type = layoutSelect.value as (typeof layout.type);
			layoutSelect.value = "";
		});

		let options = music.NOTES.map(note => new Option(note));
		rootSelect.append(...options);
		rootSelect.value = layout.root;
		rootSelect.addEventListener("change", _ => layout.root = rootSelect.value as music.Note)

		for (let i=1;i<=7;i++) {
			let option = new Option(`Oct. ${i}`, String(i));
			octaveSelect.append(option);
		}
		octaveSelect.value = String(layout.octave);
		octaveSelect.addEventListener("change", _ => layout.octave = Number(octaveSelect.value));
	}
}

const HEADER_HTML = `
<select name="layout">
  <option value="" selected>Fill with&hellip;</option>
  <option value="fifths">Circle of fifths</option>
  <option value="triads-major">Maj scale triads</option>
  <option value="triads-minor-natural">Min scale triads natural</option>
  <option value="triads-minor-harmonic">Min scale triads harmonic</option>
</select>

<select name="root"></select>

<select name="octave"></select>
`;
