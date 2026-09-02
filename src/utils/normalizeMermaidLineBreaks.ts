export function normalizeMermaidLineBreaks(content: string): string {
    return content.replace(/\\n/g, '<br/>');
}
