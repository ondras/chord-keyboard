export default class Menu extends HTMLElement {
	constructor() {
		super();
		this.popover = "auto";
	}
	connectedCallback() {
		this.innerHTML = ":-)";
	}
}
