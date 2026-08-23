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

            const memberList = document.querySelector(
                '#pane-side [aria-label^="Members list:"]'
            );

            const admin = [];

            if (memberList) {
                const adminMarkers = memberList.querySelectorAll(
                    '[data-testid="group-admin-marker"]'
                );

                adminMarkers.forEach(marker => {
                    const row = marker.closest('[data-testid^="list-item-"]');

                    if (row) {
                        const nameElement = row.querySelector(
                            '[data-testid="cell-frame-title"] span[dir="auto"]'
                        );

                        if (nameElement) {
                            admin.push(nameElement.textContent.trim());
                        }
                    }
                });
            }

            const data = {
                groupName: groupNameElement?.textContent.trim() || null,
                members: membersButton?.textContent.trim() || null,
                admin: admin
            };

            console.log(JSON.stringify(data, null, 2));

        }, 100);
    }
}
