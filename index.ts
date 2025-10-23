import App from "./components/app.ts";
import Chord from "./components/chord.ts";
import Layout from "./components/layout.ts";
import Chords from "./components/chords.ts";
import Song from "./components/fav.ts";
import Fav from "./components/song.ts";

customElements.define("ck-app", App);
customElements.define("ck-chord", Chord);
customElements.define("ck-layout", Layout);
customElements.define("ck-chords", Chords);
customElements.define("ck-fav", Fav);
customElements.define("ck-song", Song);
