const messages = [...document.querySelectorAll(
    'span[data-icon="tail-in"], span[data-icon="tail-out"]'
)].map(tail => {
    const container = tail.closest('[data-testid="msg-container"]');
    if (!container) return null;

    const type = tail.dataset.icon === 'tail-in' ? 'incoming' : 'outgoing';

    // Incoming: author name
    // Outgoing: You
    const author = container.querySelector('[data-testid="author"]');
    const name = type === 'incoming'
        ? (author?.textContent.trim() || '')
        : 'You';

    // Message
    const text = container.querySelector('[data-testid="selectable-text"]');
    const message = text?.innerText?.trim() || text?.textContent?.trim() || '';

    // Get date/time from data-pre-plain-text
    const copyable = container.querySelector('.copyable-text');
    const prePlain = copyable?.getAttribute('data-pre-plain-text') || '';

    // Example:
    // [10:26, 06/09/2026] Neo varick:
    const match = prePlain.match(
        /^\[([^,\]]+),\s*([^\]]+)\]\s*(.*?):\s*$/
    );

    let time = match?.[1] || '';
    let date = match?.[2] || '';

    // Fallback if data-pre-plain-text isn't available
    if (!time) {
        time =
            container
                .querySelector('[data-testid="msg-meta"] span')
                ?.textContent
                ?.trim() || '';
    }

    return {
        type,
        name,
        phone: '',
        date,
        time,
        message
    };
}).filter(Boolean);

console.log(JSON.stringify(messages, null, 2));
