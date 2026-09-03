import mermaid from 'mermaid';
import type { Range } from '@codemirror/state';
import type { EditorState } from '@codemirror/state';
import type { Decoration, DecorationSet, EditorView, WidgetType } from '@codemirror/view';
import { requireCodeMirrorLanguage, requireCodeMirrorState, requireCodeMirrorView } from '../../../utils/cm-dynamic-require';
import { normalizeMermaidLineBreaks } from '../../../utils/normalizeMermaidLineBreaks';
import { rangeInSelection } from '../../../utils/range-in-selection';

let renderSequence = 0;

function mermaidCodeFromFence(source: string): string | null {
    const match = source.match(/^\s*```mermaid(?:\s+[^\n]*)?\s*\n([\s\S]*?)\n?\s*```\s*$/i);
    return match ? match[1] : null;
}

const mermaidRenderV6 = () => {
    const { EditorView, WidgetType, Decoration } = requireCodeMirrorView();
    const { StateField } = requireCodeMirrorState();
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

    const buildDecorations = (state: EditorState): DecorationSet => {
        const decorations: Range<Decoration>[] = [];

        syntaxTree(state).iterate({
            enter: (node) => {
                if (node.name !== 'FencedCode') return;

                const source = state.sliceDoc(node.from, node.to);
                const content = mermaidCodeFromFence(source);
                if (content === null || rangeInSelection(state, node.from, node.to, true)) return false;

                decorations.push(Decoration.replace({
                    block: true,
                    widget: new MermaidWidget(content),
                }).range(node.from, node.to));
                return false;
            },
        });

        return Decoration.set(decorations, true);
    };

    return StateField.define({
        create: buildDecorations,
        update: (decorations: DecorationSet, transaction) => {
            if (transaction.docChanged || transaction.selection) {
                return buildDecorations(transaction.state);
            }
            return decorations;
        },
        provide: (field) => EditorView.decorations.from(field),
    });
};

export { mermaidCodeFromFence };
export default mermaidRenderV6;
