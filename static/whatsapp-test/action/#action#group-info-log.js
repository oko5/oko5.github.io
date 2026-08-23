const header = document.querySelector('[data-testid="conversation-header"]');

if (header) {
    const element = header.firstElementChild?.children[1];

    if (element) {
        element.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        element.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        element.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        setTimeout(() => {
            const button = [...document.querySelectorAll('button')]
                .find(btn => /^\d+ members$/.test(btn.textContent.trim()));

            if (button) {
                console.log(button.textContent.trim());
            }
        }, 0);
    }
}
