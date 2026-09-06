document.querySelectorAll('section[data-turn-id]').forEach(section => {
    const assistant = section.querySelector(
        '[data-message-author-role="assistant"]'
    );

    if (!assistant) return;

    // Only extract the actual rendered assistant message
    const markdown = assistant.querySelector('.markdown');

    if (!markdown) return;

    function formatNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tag = node.tagName.toLowerCase();

        // Code block — handle the entire <pre> at once
        if (tag === 'pre') {
            const code = node.querySelector('code');
            const text = code
                ? code.textContent
                : node.textContent;

            return `\n\`\`\`\n${text.trim()}\n\`\`\`\n`;
        }

        const content = [...node.childNodes]
            .map(formatNode)
            .join('');

        switch (tag) {
            case 'strong':
            case 'b':
                return `**${content.trim()}**`;

            case 'em':
            case 'i':
                return `*${content.trim()}*`;

            case 'code':
                return `\`${content.trim()}\``;

            case 'h1':
                return `\n# ${content.trim()}\n`;

            case 'h2':
                return `\n## ${content.trim()}\n`;

            case 'h3':
                return `\n### ${content.trim()}\n`;

            case 'h4':
                return `\n#### ${content.trim()}\n`;

            case 'ul':
                return '\n' +
                    [...node.children]
                        .map(li => `- ${formatNode(li).trim()}`)
                        .join('\n') +
                    '\n';

            case 'ol':
                return '\n' +
                    [...node.children]
                        .map((li, i) =>
                            `${i + 1}. ${formatNode(li).trim()}`
                        )
                        .join('\n') +
                    '\n';

            case 'li':
                return content;

            case 'blockquote':
                return '\n' +
                    content
                        .trim()
                        .split('\n')
                        .map(line => `> ${line}`)
                        .join('\n') +
                    '\n';

            case 'a':
                return `[${content.trim()}](${node.href})`;

            case 'br':
                return '\n';

            case 'p':
                return `\n${content.trim()}\n`;

            case 'hr':
                return '\n---\n';

            default:
                return content;
        }
    }

    let output = formatNode(markdown)
        // Remove trailing spaces
        .replace(/[ \t]+$/gm, '')
        // Normalize excessive blank lines
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    console.log(output);
});
