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

            // ==============================
            // GROUP NAME
            // ==============================

            const groupNameElement = document.querySelector(
                '[data-testid^="group-info-drawer-subject-input-read-only"]'
            );

            const groupName =
                groupNameElement?.textContent.trim() || null;


            // ==============================
            // MEMBER COUNT
            // ==============================

            const membersButton = [...document.querySelectorAll('button')]
                .find(btn =>
                    /^\d+\s+members$/.test(
                        btn.textContent.trim()
                    )
                );

            const memberCount =
                membersButton?.textContent.trim() || null;


            // ==============================
            // MEMBER COLLECTION
            // ==============================

            const members = new Set();


            // ==============================
            // SOURCE 1:
            // GROUP INFO MEMBER LIST
            // ==============================

            const memberList = document.querySelector(
                '[aria-label^="Members list:"]'
            );

            if (memberList) {

                const rows = memberList.querySelectorAll(
                    '[data-testid^="list-item-"]'
                );

                rows.forEach(row => {

                    const nameElement = row.querySelector(
                        '[data-testid="cell-frame-title"] span[dir="auto"]'
                    );

                    if (nameElement) {

                        const name =
                            nameElement.textContent.trim();

                        if (name) {
                            members.add(name);
                        }
                    }
                });
            }


            // ==============================
            // SOURCE 2:
            // SEARCH MEMBERS MODAL
            // ==============================

            const contactsModal = document.querySelector(
                '[data-testid="contacts-modal"]'
            );

            if (contactsModal) {

                const rows = contactsModal.querySelectorAll(
                    '[data-testid^="list-item-"]'
                );

                rows.forEach(row => {

                    // Ignore alphabet section headers
                    if (
                        row.querySelector(
                            '[data-testid="section-header"]'
                        )
                    ) {
                        return;
                    }

                    const nameElement = row.querySelector(
                        '[data-testid="cell-frame-title"] span[dir="auto"]'
                    );

                    if (nameElement) {

                        const name =
                            nameElement.textContent.trim();

                        if (name) {
                            members.add(name);
                        }
                    }
                });
            }


            // ==============================
            // GROUP OWNER
            // ==============================

            let owner = null;

            const ownerElement = [...document.querySelectorAll('span')]
                .find(span =>
                    span.textContent
                        .trim()
                        .startsWith('Group created by ')
                );

            if (ownerElement) {

                const ownerText =
                    ownerElement.textContent.trim();

                const match = ownerText.match(
                    /^Group created by (.*?),\s*on\s/
                );

                if (match) {
                    owner = match[1].trim();

                    if (owner) {
                        members.add(owner);
                    }
                }
            }


            // ==============================
            // ADMINS
            // ==============================

            const admin = [];

            if (memberList) {

                const adminMarkers =
                    memberList.querySelectorAll(
                        '[data-testid="group-admin-marker"]'
                    );

                adminMarkers.forEach(marker => {

                    const row = marker.closest(
                        '[data-testid^="list-item-"]'
                    );

                    if (row) {

                        const nameElement =
                            row.querySelector(
                                '[data-testid="cell-frame-title"] span[dir="auto"]'
                            );

                        if (nameElement) {

                            const name =
                                nameElement.textContent.trim();

                            if (
                                name &&
                                !admin.includes(name)
                            ) {
                                admin.push(name);
                            }
                        }
                    }
                });
            }


            // ==============================
            // CHECK YOUR ADMIN STATUS
            // ==============================

            const youAreAdmin = admin.includes("You");

            if (!youAreAdmin) {
                console.error("You are not an admin");
            }


            // ==============================
            // FINAL MEMBER ARRAY
            // ==============================

            const memberArray = [...members];


            // ==============================
            // OUTPUT JSON
            // ==============================

            const data = {
                groupName: groupName,
                members: memberArray,
                memberCount: memberCount,
                admin: admin,
                owner: owner
            };


            console.log(
                JSON.stringify(data, null, 2)
            );


            // ==============================
            // FIND "VIEW ALL (X MORE)"
            // ==============================

            const viewAll = [...document.querySelectorAll('div')]
                .find(div =>
                    /^View all \(\d+ more\)$/.test(
                        div.textContent.trim()
                    )
                );

            if (viewAll) {

                viewAll.dispatchEvent(
                    new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    })
                );

                viewAll.dispatchEvent(
                    new MouseEvent('mouseup', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    })
                );

                viewAll.dispatchEvent(
                    new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    })
                );

                console.log(
                    'Clicked:',
                    viewAll.textContent.trim()
                );

            } else {

                console.log(
                    'View all element not found'
                );
            }

        }, 100);

    } else {

        console.error(
            'Group information element not found'
        );
    }

} else {

    console.error(
        'Conversation header not found'
    );
}
