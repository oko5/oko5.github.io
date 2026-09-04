(() => {
    const MESSAGE_SELECTOR = '[data-testid^="conv-msg-"]';
    const EDITOR_SELECTOR =
        'p.selectable-text.copyable-text[dir="ltr"]';

    let timer = null;
    let lastProcessedId = null;
    let running = true;

    // ==========================================
    // FIND EDITOR
    // ==========================================

    function getEditor() {
        return document.querySelector(EDITOR_SELECTOR);
    }

    // ==========================================
    // EXTRACT INCOMING MESSAGE
    // ==========================================

    function extractIncoming(row) {
        const msg = row.querySelector(
            '[data-testid="msg-container"]'
        );

        if (!msg) return null;

        // Ignore YOUR messages
        if (msg.querySelector('[data-icon="tail-out"]')) {
            return null;
        }

        const id = row.getAttribute("data-id");

        if (!id) return null;

        // Find message container containing
        // data-pre-plain-text
        const containers = [
            ...msg.querySelectorAll(
                '.copyable-text[data-pre-plain-text]'
            )
        ];

        if (!containers.length) return null;

        const container = containers[containers.length - 1];

        // Example:
        // [23:25, 04/09/2026] +61 407 738 103:
        const pre =
            container.getAttribute(
                "data-pre-plain-text"
            ) || "";

        const match = pre.match(
            /^\[[^\]]+\]\s*(.*?):\s*$/
        );

        const phone = match
            ? match[1].trim()
            : "Unknown";

        // Actual message text
        const message = [
            ...container.querySelectorAll(
                '[data-testid="selectable-text"]'
            )
        ]
        .filter(
            el =>
                !el.closest(
                    '[data-testid="quoted-message"]'
                )
        )
        .map(el => el.textContent)
        .join("")
        .trim();

        if (!message) return null;

        return {
            id,
            phone,
            message
        };
    }

    // ==========================================
    // GET NEWEST INCOMING
    // ==========================================

    function getNewestIncoming() {
        const rows = [
            ...document.querySelectorAll(
                MESSAGE_SELECTOR
            )
        ];

        for (let i = rows.length - 1; i >= 0; i--) {
            const data = extractIncoming(rows[i]);

            if (data) {
                return data;
            }
        }

        return null;
    }

    // ==========================================
    // INSTANT TYPE
    // ==========================================

    function typeInstant(text) {
        const editor = getEditor();

        if (!editor) {
            console.error(
                "❌ Typing area not found"
            );

            console.log(
                "Editors currently found:",
                document.querySelectorAll(
                    'p.selectable-text.copyable-text'
                )
            );

            return false;
        }

        editor.focus();

        // Select everything currently in the editor
        document.execCommand(
            "selectAll",
            false,
            null
        );

        document.execCommand(
            "delete",
            false,
            null
        );

        // Insert the complete text instantly
        document.execCommand(
            "insertText",
            false,
            text
        );

        // Notify WhatsApp/Lexical
        editor.dispatchEvent(
            new InputEvent("input", {
                bubbles: true,
                inputType: "insertText",
                data: text
            })
        );

        return true;
    }

    // ==========================================
    // SEND BUTTON
    // ==========================================

    function getSendButton() {
        return (
            document.querySelector(
                'button[aria-label="Send"]'
            ) ||
            document.querySelector(
                '[data-testid="compose-btn-send"]'
            )
        );
    }

    function sendMessage() {
        const button = getSendButton();

        if (!button) {
            console.error(
                "❌ Send button not found"
            );
            return false;
        }

        button.click();

        return true;
    }

    // ==========================================
    // TYPE + SEND
    // ==========================================

    function typeAndSend(text) {
        if (!typeInstant(text)) {
            return;
        }

        // Allow WhatsApp/Lexical to update
        setTimeout(() => {

            if (!running) return;

            if (sendMessage()) {
                console.log(
                    "✅ SENT:",
                    text
                );
            }

        }, 20);
    }

    // ==========================================
    // PROCESS NEWEST
    // ==========================================

    function processNewest() {
        if (!running) return;

        const data =
            getNewestIncoming();

        if (!data) return;

        // Don't process the same message twice
        if (data.id === lastProcessedId) {
            return;
        }

        lastProcessedId = data.id;

        const output =
            `${data.phone} said ${data.message}`;

        console.log(
            "📨 NEWEST INCOMING:",
            data
        );

        console.log(
            "➡️ OUTPUT:",
            output
        );

        typeAndSend(output);
    }

    // ==========================================
    // WATCH FOR NEW MESSAGES
    // ==========================================

    const observer =
        new MutationObserver(() => {

            clearTimeout(timer);

            // WhatsApp makes many mutations for
            // a single message, so wait for them
            // to settle and then inspect only
            // the newest message.
            timer = setTimeout(() => {
                processNewest();
            }, 100);

        });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // ==========================================
    // STOP
    // ==========================================

    window.stopMessageTyper = () => {
        running = false;

        observer.disconnect();

        clearTimeout(timer);

        console.log(
            "🛑 Message typer stopped."
        );
    };

    console.log(
        "🟢 Watching newest incoming message..."
    );
})();
