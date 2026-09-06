const processedContainers = new WeakSet();
let newestMessageKey = null;
let processing = false;

// ==============================
// Get compose editor
// ==============================
function getEditor() {
    return document.querySelector(
        '[data-testid="conversation-compose-box-input"][contenteditable="true"]'
    );
}

// ==============================
// Instant type
// ==============================
function instantType(text) {
    const editor = getEditor();

    if (!editor) {
        console.error("Compose editor not found");
        return false;
    }

    editor.focus();

    const selection = window.getSelection();
    const range = document.createRange();

    // Clear existing editor contents
    range.selectNodeContents(editor);
    selection.removeAllRanges();
    selection.addRange(range);

    document.execCommand("delete", false, null);

    // Insert exactly once
    document.execCommand("insertText", false, text);

    selection.removeAllRanges();

    return true;
}

// ==============================
// Send
// ==============================
function sendMessage() {
    const button =
        document.querySelector('[data-testid="send"]') ||
        document.querySelector('[aria-label="Send"]');

    if (!button) {
        console.error("Send button not found");
        return false;
    }

    button.click();
    return true;
}

// ==============================
// Extract message information
// ==============================
function getMessageInfo(container) {
    const tail = container.querySelector(
        'span[data-icon="tail-in"]'
    );

    if (!tail) return null;

    const author =
        container.querySelector('[data-testid="author"]');

    const name =
        author?.textContent?.trim() || "";

    const text =
        container.querySelector('[data-testid="selectable-text"]');

    const message =
        text?.innerText?.trim() ||
        text?.textContent?.trim() ||
        "";

    const copyable =
        container.querySelector('.copyable-text');

    const prePlain =
        copyable?.getAttribute('data-pre-plain-text') || "";

    /*
      Example:
      [10:37, 6/9/2026] John:
    */
    const match = prePlain.match(
        /^\[([^,\]]+),\s*([^\]]+)\]/
    );

    const time = match?.[1] || "";
    const date = match?.[2] || "";

    if (!name || !message) return null;

    return {
        container,
        name,
        message,
        time,
        date
    };
}

// ==============================
// Convert WhatsApp timestamp
// ==============================
function timestampValue(info) {
    if (!info.date || !info.time) {
        return 0;
    }

    const parsed = new Date(
        `${info.date} ${info.time}`
    ).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
}

// ==============================
// Find the ACTUAL newest incoming
// ==============================
function findNewestIncoming() {
    const containers = [
        ...document.querySelectorAll(
            '[data-testid="msg-container"]'
        )
    ];

    let newest = null;
    let newestTimestamp = -Infinity;

    for (const container of containers) {
        const info = getMessageInfo(container);

        if (!info) continue;

        const ts = timestampValue(info);

        /*
          If timestamp parsing works, use it.
          If not, DOM order is used as fallback.
        */
        if (
            ts > newestTimestamp ||
            (ts === 0 && newest === null)
        ) {
            newest = info;
            newestTimestamp = ts;
        }
    }

    return newest;
}

// ==============================
// Process ONLY newest message
// ==============================
async function processNewestIncoming() {
    if (processing) return;

    const info = findNewestIncoming();

    if (!info) return;

    // Already processed this exact DOM message
    if (processedContainers.has(info.container)) {
        return;
    }

    /*
      Build a key as an additional protection
      against WhatsApp recreating the same message
      as another DOM node.
    */
    const messageKey =
        `${info.date}|${info.time}|${info.name}|${info.message}`;

    if (messageKey === newestMessageKey) {
        processedContainers.add(info.container);
        return;
    }

    processing = true;

    processedContainers.add(info.container);
    newestMessageKey = messageKey;

    const reply =
        `${info.name} said ${info.message}`;

    console.log("NEWEST INCOMING:");
    console.log(reply);

    if (instantType(reply)) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                sendMessage();
                processing = false;
            });
        });
    } else {
        processing = false;
    }
}

// ==============================
// Watch DOM changes
// ==============================
const observer = new MutationObserver(() => {
    /*
      Don't immediately process every added node.
      WhatsApp often adds several pieces of the same
      message separately.

      Wait until the DOM settles, then find the
      newest actual incoming message.
    */
    clearTimeout(window.__newestMessageTimer);

    window.__newestMessageTimer = setTimeout(() => {
        processNewestIncoming();
    }, 50);
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

console.log(
    "Monitoring ONLY the newest incoming message."
);
