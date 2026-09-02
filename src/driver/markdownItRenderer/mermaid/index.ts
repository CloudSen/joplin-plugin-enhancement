import {normalizeMermaidLineBreaks} from "../../../utils/normalizeMermaidLineBreaks";

function isMermaidFence(info: string): boolean {
    return info.trim().split(/\s+/, 1)[0].toLowerCase() === 'mermaid';
}

export default function (_context) {
    return {
        plugin: function (markdownIt, _options) {
            const defaultRender = markdownIt.renderer.rules.fence || function (tokens, idx, options, env, self) {
                return self.renderToken(tokens, idx, options, env, self);
            };

            markdownIt.renderer.rules.fence = function (tokens, idx, options, env, self) {
                const token = tokens[idx];
                if (!isMermaidFence(token.info) || !token.content.includes('\\n')) {
                    return defaultRender(tokens, idx, options, env, self);
                }

                const originalContent = token.content;
                token.content = normalizeMermaidLineBreaks(originalContent);
                try {
                    return defaultRender(tokens, idx, options, env, self);
                } finally {
                    token.content = originalContent;
                }
            };
        },
        assets: function() {
            return [];
        },
    };
}
