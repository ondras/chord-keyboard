import Layout from "./layout.ts";
import * as music from "./music.ts";



export default class Chords extends HTMLElement {
	protected layout = new Layout();
	protected header = document.createElement("header");
	protected get layoutSelect() { return this.querySelector<HTMLSelectElement>("header [name=layout]")!; }
	protected get rootSelect() { return this.querySelector<HTMLSelectElement>("header [name=root]")!; }

	connectedCallback() {
		const { header, layout,  } = this;
		this.replaceChildren(header, layout);

		header.innerHTML = HEADER_HTML;

		const { layoutSelect, rootSelect } = this;

		layoutSelect.addEventListener("change", _ => {
			layout.type = layoutSelect.value as (typeof layout.type);
			layoutSelect.value = "";
		});

		let options = music.NOTES.map(note => new Option(note));
		rootSelect.append(...options);
		rootSelect.value = layout.root;
		rootSelect.addEventListener("change", _ => layout.root = rootSelect.value as music.Note)

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
`;
