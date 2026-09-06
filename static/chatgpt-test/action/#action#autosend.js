const editor = document.querySelector('#prompt-textarea[contenteditable="true"]');

editor.focus();

const text = 'Hello, this is a test!';

document.execCommand('insertText', false, text);

editor.dispatchEvent(new InputEvent('input', {
    bubbles: true,
    inputType: 'insertText',
    data: text
}));

setTimeout(() => {
    editor.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
    }));
}, 50);
