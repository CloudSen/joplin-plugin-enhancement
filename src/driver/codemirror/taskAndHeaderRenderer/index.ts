
import { taskAndHeaderRender as v5TaskAndHeaderRenderer } from './v5';

const taskAndHeaderRenderer = (cm: any) => {
    if (cm.cm6) {
        // The content-script sandbox used by Joplin 3.6 does not expose the
        // CodeMirror 6 modules required by this legacy renderer. Do not let
        // an optional decoration renderer prevent all editor scripts from
        // loading (including Mermaid).
        return;
    }

    v5TaskAndHeaderRenderer(cm);
};

export default taskAndHeaderRenderer;
