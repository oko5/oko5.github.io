const header = document.querySelector('[data-testid="conversation-header"]');

if (header) {
    const element = header.firstElementChild?.children[1];

    if (element) {

        // Open group information
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

            // Member count
            const membersButton = [...document.querySelectorAll('button')]
                .find(btn =>
                    /^\d+\s+members$/.test(btn.textContent.trim())
                );

            // Group name
            const groupNameElement = document.querySelector(
                '[data-testid^="group-info-drawer-subject-input-read-only"]'
            );

            // Members list
            const memberList = document.querySelector(
                '#pane-side [aria-label^="Members list:"]'
            );

            // Admins
            const admin = [];

            if (memberList) {
                const adminMarkers = memberList.querySelectorAll(
                    '[data-testid="group-admin-marker"]'
                );

                adminMarkers.forEach(marker => {
                    const row = marker.closest(
                        '[data-testid^="list-item-"]'
                    );

                    if (row) {
                        const nameElement = row.querySelector(
                            '[data-testid="cell-frame-title"] span[dir="auto"]'
                        );

                        if (nameElement) {
                            const name = nameElement.textContent.trim();

                            if (name && !admin.includes(name)) {
                                admin.push(name);
                            }
                        }
                    }
                });
            }

            // Group owner
            const ownerElement = [...document.querySelectorAll('span')]
                .find(span =>
                    span.textContent.trim().startsWith('Group created by ')
                );

            let owner = null;

            if (ownerElement) {
                const ownerText = ownerElement.textContent.trim();

                const match = ownerText.match(
                    /^Group created by (.*?),\s*on\s/
                );

                if (match) {
                    owner = match[1].trim();
                }
            }

            // JSON
            const data = {
                groupName: groupNameElement?.textContent.trim() || null,
                members: membersButton?.textContent.trim() || null,
                admin: admin,
                owner: owner
            };

            console.log(JSON.stringify(data, null, 2));

            // Check whether you are an admin
            if (!admin.includes("You")) {
                console.error("You are not an admin");
            }

            // Find the EXACT "View all (X more)" inner div
            const viewAll = [...document.querySelectorAll('div')]
                .find(div => {
                    return /^View all \(\d+ more\)$/.test(
                        div.textContent.trim()
                    );
                });

            if (viewAll) {

                // Simulate mouse interaction directly on
                // the "View all (16 more)" DIV
                viewAll.dispatchEvent(new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));

                viewAll.dispatchEvent(new MouseEvent('mouseup', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));

                viewAll.dispatchEvent(new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                }));

                console.log(
                    'Clicked:',
                    viewAll.textContent.trim()
                );

            } else {
                console.log('View all element not found');
            }

        }, 100);
    }
}
