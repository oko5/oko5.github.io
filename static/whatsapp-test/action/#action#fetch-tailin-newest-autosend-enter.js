// ============================================================
// WhatsApp — ONLY process the newest incoming tail-in message
// ============================================================

const processedContainers = new WeakSet();

let newestMessageKey = null;
let processing = false;
let newestMessageTimer = null;


// ============================================================
// Get compose editor
// ============================================================

function getEditor() {
    return document.querySelector(
        '[data-testid="conversation-compose-box-input"][contenteditable="true"]'
    );
}


// ============================================================
// Instant type
// ============================================================

function instantType(text) {
    const editor = getEditor();

    if (!editor) {
        console.error("Compose editor not found");
        return false;
    }

    editor.focus();

    const selection = window.getSelection();
    const range = document.createRange();

    // Select everything currently inside the editor
    range.selectNodeContents(editor);

    selection.removeAllRanges();
    selection.addRange(range);

    // Clear existing text
    document.execCommand("delete", false, null);

    // Insert exactly once
    document.execCommand("insertText", false, text);

    selection.removeAllRanges();

    return true;
}


// ============================================================
// Send
// ============================================================

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


// ============================================================
// Extract information from ONE message container
// ============================================================

function getMessageInfo(container) {

    if (!container) {
        return null;
    }

    // This container must contain an incoming tail
    const tail = container.querySelector(
        'span[data-icon="tail-in"]'
    );

    if (!tail) {
        return null;
    }


    // --------------------------------------------------------
    // Author
    // --------------------------------------------------------

    const author =
        container.querySelector('[data-testid="author"]');

    const name =
        author?.textContent?.trim() || "";


    // --------------------------------------------------------
    // Message text
    // --------------------------------------------------------

    const text =
        container.querySelector(
            '[data-testid="selectable-text"]'
        );

    const message =
        text?.innerText?.trim() ||
        text?.textContent?.trim() ||
        "";


    // --------------------------------------------------------
    // Timestamp
    // --------------------------------------------------------

    const copyable =
        container.querySelector('.copyable-text');

    const prePlain =
        copyable?.getAttribute(
            'data-pre-plain-text'
        ) || "";


    /*
        Example:

        [10:37, 6/9/2026] John:
    */

    const match = prePlain.match(
        /^\[([^,\]]+),\s*([^\]]+)\]/
    );

    const time =
        match?.[1] || "";

    const date =
        match?.[2] || "";


    // --------------------------------------------------------
    // Require actual data
    // --------------------------------------------------------

    if (!name || !message) {
        return null;
    }


    return {
        container,
        name,
        message,
        time,
        date,
        tail
    };
}


// ============================================================
// Find the LAST / newest actual incoming tail-in
// ============================================================

function findNewestIncoming() {

    const tails = [
        ...document.querySelectorAll(
            'span[data-icon="tail-in"]'
        )
    ];


    /*
        WhatsApp's DOM order is used here.

        The LAST tail-in is treated as the newest
        incoming message currently rendered.
    */

    for (let i = tails.length - 1; i >= 0; i--) {

        const tail = tails[i];

        const container =
            tail.closest(
                '[data-testid="msg-container"]'
            );

        if (!container) {
            continue;
        }


        const info =
            getMessageInfo(container);

        if (!info) {
            continue;
        }


        return info;
    }


    return null;
}


// ============================================================
// Process ONLY the newest incoming message
// ============================================================

async function processNewestIncoming() {

    // Prevent overlapping processing
    if (processing) {
        return;
    }


    const info =
        findNewestIncoming();


    if (!info) {
        return;
    }


    // --------------------------------------------------------
    // Prevent processing the same DOM container twice
    // --------------------------------------------------------

    if (
        processedContainers.has(
            info.container
        )
    ) {
        return;
    }


    // --------------------------------------------------------
    // Extra duplicate protection
    // --------------------------------------------------------

    const messageKey =
        `${info.date}|${info.time}|${info.name}|${info.message}`;


    if (
        messageKey === newestMessageKey
    ) {

        processedContainers.add(
            info.container
        );

        return;
    }


    // --------------------------------------------------------
    // Lock processing
    // --------------------------------------------------------

    processing = true;

    processedContainers.add(
        info.container
    );

    newestMessageKey =
        messageKey;


    // --------------------------------------------------------
    // Create reply
    // --------------------------------------------------------

    const reply =
        `${info.name} said ${info.message}`;


    console.log(
        "NEWEST INCOMING:"
    );

    console.log({
        name: info.name,
        message: info.message,
        time: info.time,
        date: info.date
    });


    console.log(
        "REPLY:",
        reply
    );


    // --------------------------------------------------------
    // Type
    // --------------------------------------------------------

    const typed =
        instantType(reply);


    if (!typed) {

        processing = false;

        return;
    }


    /*
        Give WhatsApp a couple of rendering frames
        before clicking Send.

        This prevents the send button from being clicked
        before React/WhatsApp has registered the inserted text.
    */

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            sendMessage();

            processing = false;
        });

    });

}


// ============================================================
// MutationObserver
// ============================================================

const observer =
    new MutationObserver(
        (mutations) => {

            let foundIncoming =
                false;


            // ------------------------------------------------
            // Only care about mutations that introduce
            // an actual tail-in
            // ------------------------------------------------

            for (
                const mutation of mutations
            ) {

                for (
                    const node of mutation.addedNodes
                ) {

                    if (
                        node.nodeType !==
                        Node.ELEMENT_NODE
                    ) {
                        continue;
                    }


                    // Node itself is tail-in
                    if (
                        node.matches?.(
                            'span[data-icon="tail-in"]'
                        )
                    ) {

                        foundIncoming = true;

                        break;
                    }


                    // Or tail-in exists somewhere inside
                    if (
                        node.querySelector?.(
                            'span[data-icon="tail-in"]'
                        )
                    ) {

                        foundIncoming = true;

                        break;
                    }

                }


                if (foundIncoming) {
                    break;
                }
            }


            // Ignore unrelated WhatsApp DOM changes
            if (!foundIncoming) {
                return;
            }


            // ------------------------------------------------
            // Debounce multiple pieces of the same message
            // ------------------------------------------------

            clearTimeout(
                newestMessageTimer
            );


            newestMessageTimer =
                setTimeout(() => {

                    processNewestIncoming();

                }, 20);

        }
    );


// ============================================================
// Start observing
// ============================================================

observer.observe(
    document.body,
    {
        childList: true,
        subtree: true
    }
);


// ============================================================
// Ready
// ============================================================

console.log(
    "Monitoring ONLY the newest incoming tail-in message."
);
