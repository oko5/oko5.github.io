(() => {
    const logged = new WeakSet();
    const timers = new WeakMap();
    const observers = new WeakMap();

    function formatNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return '';
        }

        const tag = node.tagName.toLowerCase();

        if (tag === 'pre') {
            const code = node.querySelector('code');
            const text = code ? code.textContent : node.textContent;

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

    function extract(markdown) {
        return formatNode(markdown)
            .replace(/[ \t]+$/gm, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function logAssistant(markdown, section) {
        if (logged.has(markdown)) return;

        const output = extract(markdown);

        if (!output) return;

        logged.add(markdown);

        console.log(output);
    }

    function watchSection(section) {
        const assistant = section.querySelector(
            '[data-message-author-role="assistant"]'
        );

        if (!assistant) return;

        const markdown = assistant.querySelector('.markdown');

        if (!markdown) return;

        if (observers.has(markdown)) return;

        const observer = new MutationObserver(() => {
            // Reset the quiet-period timer whenever the DOM changes.
            clearTimeout(timers.get(markdown));

            const timer = setTimeout(() => {
                // Nothing changed during the quiet period,
                // so consider the message finished.
                logAssistant(markdown, section);
            }, 500);

            timers.set(markdown, timer);
        });

        observer.observe(markdown, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true
        });

        observers.set(markdown, observer);

        // Handle messages that were already finished when the script started.
        const initialTimer = setTimeout(() => {
            logAssistant(markdown, section);
        }, 500);

        timers.set(markdown, initialTimer);
    }

    function scan() {
        document
            .querySelectorAll('section[data-turn-id]')
            .forEach(watchSection);
    }

    // Watch for newly-created assistant messages.
    const pageObserver = new MutationObserver(() => {
        scan();
    });

    pageObserver.observe(document.body, {
        subtree: true,
        childList: true
    });

    // Initial scan.
    scan();

    console.log('Assistant message logger started.');
})();
