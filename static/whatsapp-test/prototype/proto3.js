(async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const dispatchClick = element => {
        if (!element) return;

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
    };

    // =========================================================
    // OPEN GROUP INFORMATION
    // =========================================================

    const header = document.querySelector(
        '[data-testid="conversation-header"]'
    );

    if (!header) {
        console.error('Conversation header not found');
        return;
    }

    const headerElement = header.firstElementChild?.children[1];

    if (!headerElement) {
        console.error('Group header button not found');
        return;
    }

    dispatchClick(headerElement);

    await sleep(350);


    // =========================================================
    // BASIC GROUP INFORMATION
    // =========================================================

    const membersButton = [...document.querySelectorAll('button')]
        .find(btn =>
            /^\d+\s+members$/.test(btn.textContent.trim())
        );

    const groupNameElement = document.querySelector(
        '[data-testid^="group-info-drawer-subject-input-read-only"]'
    );

    const groupName =
        groupNameElement?.textContent.trim() || null;

    const memberCount =
        membersButton?.textContent.trim() || null;


    // =========================================================
    // MEMBER STORAGE
    // =========================================================

    const memberNames = new Map();
    const admins = new Map();

    const collectMembers = () => {

        const contactsModal = document.querySelector(
            '[data-testid="contacts-modal"]'
        );

        if (!contactsModal) return;

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

            if (!nameElement) return;

            const name =
                nameElement.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

            if (!name) return;

            const key = name.toLocaleLowerCase();

            memberNames.set(key, name);

            if (
                row.querySelector(
                    '[data-testid="group-admin-marker"]'
                )
            ) {
                admins.set(key, name);
            }
        });
    };


    // =========================================================
    // COLLECT CURRENTLY VISIBLE MEMBERS
    // =========================================================

    collectMembers();


    // =========================================================
    // CLICK VIEW ALL
    // =========================================================

    const viewAll = [...document.querySelectorAll('div')]
        .find(div =>
            /^View all \(\d+ more\)$/.test(
                div.textContent.trim()
            )
        );

    if (viewAll) {

        console.log(
            'Clicking:',
            viewAll.textContent.trim()
        );

        dispatchClick(viewAll);

        await sleep(450);

    } else {

        console.log(
            'View all button not found.'
        );
    }


    // =========================================================
    // CONTACTS MODAL
    // =========================================================

    const contactsModal = document.querySelector(
        '[data-testid="contacts-modal"]'
    );

    if (!contactsModal) {

        console.error(
            'Contacts modal not found.'
        );

        return;
    }


    // =========================================================
    // FIND VIRTUALIZED SCROLL CONTAINER
    // =========================================================

    const findScrollContainer = () => {

        const candidates = [
            ...contactsModal.querySelectorAll('*')
        ];

        let best = null;
        let bestScore = -1;

        for (const element of candidates) {

            const style = getComputedStyle(element);

            const scrollable =
                style.overflowY === 'auto' ||
                style.overflowY === 'scroll' ||
                style.overflowY === 'overlay';

            if (!scrollable) continue;

            if (
                element.scrollHeight <=
                element.clientHeight
            ) {
                continue;
            }

            const score =
                element.scrollHeight -
                element.clientHeight;

            if (score > bestScore) {
                best = element;
                bestScore = score;
            }
        }

        return best;
    };


    let scrollContainer = findScrollContainer();


    // =========================================================
    // FALLBACK SCROLL CONTAINER
    // =========================================================

    if (!scrollContainer) {

        const listItem = contactsModal.querySelector(
            '[data-testid^="list-item-"]'
        );

        if (listItem) {

            let parent = listItem.parentElement;

            while (
                parent &&
                parent !== contactsModal
            ) {

                if (
                    parent.scrollHeight >
                    parent.clientHeight
                ) {
                    scrollContainer = parent;
                    break;
                }

                parent = parent.parentElement;
            }
        }
    }


    // =========================================================
    // FAST VIRTUALIZED SCROLL
    // =========================================================

    if (scrollContainer) {

        console.log(
            'Fast-scrolling member list...'
        );

        let lastTop = -1;
        let stuckCount = 0;

        const MAX_SCROLLS = 500;

        for (
            let i = 0;
            i < MAX_SCROLLS;
            i++
        ) {

            // Collect currently rendered members
            collectMembers();

            const currentTop =
                scrollContainer.scrollTop;

            const maxTop =
                scrollContainer.scrollHeight -
                scrollContainer.clientHeight;

            // Bottom reached
            if (
                currentTop >= maxTop - 5
            ) {

                await sleep(150);

                collectMembers();

                break;
            }


            // Detect a stuck virtual list
            if (
                Math.abs(currentTop - lastTop) < 1
            ) {
                stuckCount++;
            } else {
                stuckCount = 0;
            }

            lastTop = currentTop;


            // Large jump = much faster
            const jump = Math.max(
                700,
                Math.floor(
                    scrollContainer.clientHeight * 1.5
                )
            );

            scrollContainer.scrollTop =
                Math.min(
                    maxTop,
                    currentTop + jump
                );


            /*
             * Very short delay.
             *
             * 50ms is enough for most WhatsApp
             * virtualized rows to update while
             * keeping the scrolling fast.
             */
            await sleep(50);

            collectMembers();


            // If stuck, force a larger jump
            if (stuckCount >= 3) {

                scrollContainer.scrollTop =
                    Math.min(
                        maxTop,
                        currentTop + 1500
                    );

                await sleep(100);

                collectMembers();

                stuckCount = 0;
            }
        }

    } else {

        console.warn(
            'Could not find member-list scroll container.'
        );
    }


    // =========================================================
    // FINAL COLLECTION
    // =========================================================

    collectMembers();


    // =========================================================
    // GROUP OWNER
    // =========================================================

    let owner = null;

    const ownerElement = [
        ...document.querySelectorAll('span')
    ].find(span =>
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
        }
    }


    // =========================================================
    // FINAL ARRAYS
    // =========================================================

    const memberList = [...memberNames.values()];
    const adminList = [...admins.values()];


    // =========================================================
    // ACTUAL JAVASCRIPT OBJECT
    // =========================================================
    //
    // This is NOT JSON.stringify().
    //
    // Chrome displays it as an expandable object,
    // so the console is not flooded with one giant
    // JSON string.
    // =========================================================

    const data = {
        groupName: groupName,
        members: memberCount,
        memberCountExtracted: memberList.length,
        memberList: memberList,
        admin: adminList,
        owner: owner
    };


    // =========================================================
    // OUTPUT
    // =========================================================

    console.log(
        '========== GROUP MEMBER EXTRACTION =========='
    );

    console.log(
        'Group:',
        groupName
    );

    console.log(
        'WhatsApp member count:',
        memberCount
    );

    console.log(
        'Members extracted:',
        memberList.length
    );

    console.log(
        'Admins:',
        adminList
    );

    console.log(
        'Owner:',
        owner
    );

    console.log(
        '========== ACTUAL DATA OBJECT =========='
    );

    console.log(data);

})();
