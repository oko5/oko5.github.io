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
            const membersButton = [...document.querySelectorAll('button')]
                .find(btn => /^\d+\s+members$/.test(btn.textContent.trim()));

            const groupNameElement = document.querySelector(
                '[data-testid^="group-info-drawer-subject-input-read-only"]'
            );

            if (membersButton && groupNameElement) {
                const members = membersButton.textContent.trim();
                const groupName = groupNameElement.textContent.trim();

                console.log(`Member count: ${members}`);
                console.log(`Group name: ${groupName}`);
            } else {
                console.log('Members button:', membersButton);
                console.log('Group name element:', groupNameElement);
            }
        }, 100);
    }
}
