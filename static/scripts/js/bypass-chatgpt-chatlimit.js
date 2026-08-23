// Function to enable and click the button
function enableAndClickButton() {
    const button = document.getElementById('composer-submit-button');
    if (!button) return;

    // Force enable
    if (button.hasAttribute('disabled')) {
        button.removeAttribute('disabled');
        console.log('Button is now enabled!');
    }

    // Click the button
    button.click();
    console.log('Button clicked!');
}

// Attach listener to textarea
function attachListener() {
    const textarea = document.getElementById('prompt-textarea');
    if (!textarea || textarea.dataset.listenerAttached) return;

    // Enable button on input
    textarea.addEventListener('input', () => {
        const button = document.getElementById('composer-submit-button');
        if (button && button.hasAttribute('disabled')) {
            button.removeAttribute('disabled');
        }
    });

    // Trigger button on Enter key
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter allows new line
            e.preventDefault(); // prevent newline
            enableAndClickButton();
        }
    });

    textarea.dataset.listenerAttached = 'true';
    console.log('Listeners attached to textarea.');
}

// Observe DOM changes (for dynamically loaded elements)
const observer = new MutationObserver(() => attachListener());
observer.observe(document.body, { childList: true, subtree: true });

// Attach immediately if elements already exist
attachListener();
