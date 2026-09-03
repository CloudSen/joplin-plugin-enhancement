import {CMBlockMarkerHelper} from "../../../utils/CMBlockMarkerHelper";
import {normalizeMermaidLineBreaks} from "../../../utils/normalizeMermaidLineBreaks";
import mermaid from 'mermaid'
import {LineHandle} from "codemirror";

const ENHANCEMENT_MERMAID_SPAN_MARKER_CLASS = 'enhancement-mermaid-block-marker';
const ENHANCEMENT_MERMAID_SPAN_MARKER_LINE_CLASS = 'enhancement-mermaid-block-marker-line';

// Initialise the mermaid API.
mermaid.initialize({ startOnLoad: false })

async function renderMermaid(svg: HTMLSpanElement, id: string, content: string, onRendered: () => void): Promise<void> {
    try {
        const result = await mermaid.render(id, normalizeMermaidLineBreaks(content));
        svg.innerHTML = typeof result === 'string' ? result : result.svg;
        if (typeof result !== 'string') result.bindFunctions?.(svg);
    } catch (err) {
        svg.classList.add('error');
        // TODO: Localise!
        svg.innerText = `Could not render Graph:\n\n${(err as Error).message}`;
    } finally {
        onRendered();
    }
}

export default function mermaidRender(cm) {
    // Joplin's CodeMirror 6 control exposes its CodeMirror 5 marker and
    // line-widget compatibility API. Keeping the renderer on that API means
    // the content script does not need to load a second copy of CodeMirror.
    // Block Katex Math Render
    new CMBlockMarkerHelper(cm, null, /^\s*```mermaid\s*$/, /^\s*```\s*$/, (beginMatch, endMatch, content, fromLine, toLine, onRendered) => {
        // code from zettlr
        let svg = document.createElement('span')
        svg.innerText = "..."
        svg.classList.add('mermaid-chart')
        void renderMermaid(svg, `graphDivL${fromLine}-L${toLine}${Date.now()}`, content, onRendered);
        return svg;
    }, ENHANCEMENT_MERMAID_SPAN_MARKER_CLASS, true);

    cm.on('renderLine', (editor, line: LineHandle, element: Element) => {
        if (element.getElementsByClassName(ENHANCEMENT_MERMAID_SPAN_MARKER_CLASS).length > 0) {
            element.classList.add(ENHANCEMENT_MERMAID_SPAN_MARKER_LINE_CLASS);
        }
    })
}
