import mermaid from 'mermaid';
import type { Range } from '@codemirror/state';
import type { Decoration, DecorationSet, EditorView, ViewUpdate, WidgetType } from '@codemirror/view';
import { requireCodeMirrorLanguage, requireCodeMirrorView } from '../../../utils/cm-dynamic-require';
import { normalizeMermaidLineBreaks } from '../../../utils/normalizeMermaidLineBreaks';
import { rangeInSelection } from '../../../utils/range-in-selection';

let renderSequence = 0;

function mermaidCodeFromFence(source: string): string | null {
    const match = source.match(/^\s*```mermaid(?:\s+[^\n]*)?\s*\n([\s\S]*?)\n?\s*```\s*$/i);
    return match ? match[1] : null;
}

const mermaidRenderV6 = () => {
    const { ViewPlugin, WidgetType, Decoration } = requireCodeMirrorView();
    const { syntaxTree } = requireCodeMirrorLanguage();

    class MermaidWidget extends WidgetType {
        public constructor(private readonly content: string) {
            super();
        }

        public override eq(other: WidgetType) {
            return other instanceof MermaidWidget && this.content === other.content;
        }

        public override toDOM() {
            const container = document.createElement('div');
            container.classList.add('cm-enhancement-mermaid-chart');
            container.textContent = 'Rendering Mermaid diagram…';

            const id = `enhancement-mermaid-${Date.now()}-${renderSequence++}`;
            void mermaid.render(id, normalizeMermaidLineBreaks(this.content))
                .then((result) => {
                    container.innerHTML = typeof result === 'string' ? result : result.svg;
                    if (typeof result !== 'string') result.bindFunctions?.(container);
                })
                .catch((error: Error) => {
                    container.classList.add('error');
                    container.textContent = `Could not render Graph:\n\n${error.message}`;
                });

            return container;
        }

        public override ignoreEvent(_event: Event) {
            // A click moves the cursor into the replaced range and exposes the source.
            return false;
        }
    }

    const buildDecorations = (view: EditorView): DecorationSet => {
        const decorations: Range<Decoration>[] = [];

        for (const { from, to } of view.visibleRanges) {
            syntaxTree(view.state).iterate({
                from,
                to,
                enter: (node) => {
                    if (node.name !== 'FencedCode') return;

                    const source = view.state.sliceDoc(node.from, node.to);
                    const content = mermaidCodeFromFence(source);
                    if (content === null || rangeInSelection(view.state, node.from, node.to, true)) return false;

                    decorations.push(Decoration.replace({
                        block: true,
                        widget: new MermaidWidget(content),
                    }).range(node.from, node.to));
                    return false;
                },
            });
        }

        return Decoration.set(decorations, true);
    };

    return ViewPlugin.fromClass(class {
        public decorations: DecorationSet;

        public constructor(view: EditorView) {
            this.decorations = buildDecorations(view);
        }

        public update(update: ViewUpdate) {
            if (update.docChanged || update.viewportChanged || update.selectionSet) {
                this.decorations = buildDecorations(update.view);
            }
        }
    }, {
        decorations: (plugin) => plugin.decorations,
    });
};

export { mermaidCodeFromFence };
export default mermaidRenderV6;
