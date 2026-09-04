const WORD = "hello bro how are you";

// Delay between each character (milliseconds)
const CHAR_DELAY = 100;

// How many characters are typed before a "word paste" happens.
// 0 = type every character individually.
const CHARS_PER_WORD = 0;

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateTyping(text) {
    const editor = document.querySelector(
        'p.selectable-text.copyable-text[dir="ltr"]'
    );

    if (!editor) {
        console.error("Typing area not found");
        return;
    }

    editor.focus();

    if (CHARS_PER_WORD > 0) {
        // Type in chunks
        for (let i = 0; i < text.length; i += CHARS_PER_WORD) {
            const chunk = text.slice(i, i + CHARS_PER_WORD);

            document.execCommand("insertText", false, chunk);

            await sleep(CHAR_DELAY);
        }
    } else {
        // Type character-by-character
        for (const char of text) {
            document.execCommand("insertText", false, char);

            await sleep(CHAR_DELAY);
        }
    }

    editor.dispatchEvent(new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: text
    }));
}

simulateTyping(WORD);
