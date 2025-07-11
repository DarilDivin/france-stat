// Configuration optimisée de GSAP pour réduire la taille du bundle
// On importe seulement les parties nécessaires de GSAP
import { gsap } from "gsap/dist/gsap";
import { ScrambleTextPlugin } from "gsap/dist/ScrambleTextPlugin";
import { TextPlugin } from "gsap/dist/TextPlugin";

// Enregistrer seulement les plugins utilisés
gsap.registerPlugin(ScrambleTextPlugin, TextPlugin);

// Export seulement ce qui est utilisé dans l'application
export { gsap, ScrambleTextPlugin, TextPlugin };
export default gsap;
