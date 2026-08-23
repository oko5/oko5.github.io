console.clear();
(async () => {
    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    // =========================================================
    // CLICK HELPER
    // =========================================================

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
        console.error('Conversation header not found.');
        return;
    }

    const headerElement =
        header.firstElementChild?.children[1];

    if (!headerElement) {
        console.error('Group header button not found.');
        return;
    }

    dispatchClick(headerElement);

    await sleep(500);


    // =========================================================
    // BASIC GROUP INFORMATION
    // =========================================================

    const membersButton = [...document.querySelectorAll('button')]
        .find(btn =>
            /^\d+\s+members$/i.test(
                btn.textContent.trim()
            )
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


    // =========================================================
    // COLLECT VISIBLE MEMBERS
    // =========================================================

    const collectMembers = () => {

        const contactsModal = document.querySelector(
            '[data-testid="contacts-modal"]'
        );

        if (!contactsModal) return;

        const rows = contactsModal.querySelectorAll(
            '[data-testid^="list-item-"]'
        );

        rows.forEach(row => {

            // Ignore alphabetical section headers
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

            const key =
                name.toLocaleLowerCase();

            memberNames.set(key, name);


            // Detect admin
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
    // INITIAL COLLECTION
    // =========================================================

    collectMembers();


    // =========================================================
    // CLICK "VIEW ALL"
    // =========================================================

    const viewAll = [...document.querySelectorAll('div')]
        .find(div =>
            /^View all \(\d+ more\)$/i.test(
                div.textContent.trim()
            )
        );

    if (viewAll) {

        console.log(
            'Clicking:',
            viewAll.textContent.trim()
        );

        dispatchClick(viewAll);

        await sleep(700);

    } else {

        console.log(
            'View all button not found.'
        );
    }


    // =========================================================
    // FIND CONTACTS MODAL
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
    // FIND REAL SCROLL CONTAINER
    //
    // Important:
    //
    // The element:
    //
    // style="height: 20539px"
    //
    // is the VIRTUAL CONTENT.
    //
    // We do NOT want to scroll that element.
    //
    // We want its ancestor that actually has:
    //
    // scrollHeight > clientHeight
    // =========================================================

    const getScrollableAncestors = element => {

        const result = [];

        let current = element;

        while (
            current &&
            current !== document.body &&
            current !== document.documentElement
        ) {

            const style =
                getComputedStyle(current);

            const overflowY =
                style.overflowY;

            if (
                (
                    overflowY === 'auto' ||
                    overflowY === 'scroll' ||
                    overflowY === 'overlay'
                ) &&
                current.scrollHeight >
                    current.clientHeight
            ) {
                result.push(current);
            }

            current =
                current.parentElement;
        }

        return result;
    };


    // =========================================================
    // LOCATE LIST ITEM
    // =========================================================

    const firstListItem =
        contactsModal.querySelector(
            '[data-testid="list-item-1"]'
        );


    // =========================================================
    // LOCATE SCROLLABLE ELEMENT
    // =========================================================

    let scrollContainer = null;


    if (firstListItem) {

        const ancestors =
            getScrollableAncestors(
                firstListItem
            );

        if (ancestors.length) {

            /*
             * Usually the closest scrollable ancestor
             * is the correct WhatsApp virtual-list viewport.
             */

            scrollContainer =
                ancestors[0];
        }
    }


    // =========================================================
    // SECONDARY SEARCH
    // =========================================================

    if (!scrollContainer) {

        const allElements =
            contactsModal.querySelectorAll('*');

        let best = null;
        let bestDifference = -1;

        for (const element of allElements) {

            const style =
                getComputedStyle(element);

            const overflowY =
                style.overflowY;

            if (
                overflowY !== 'auto' &&
                overflowY !== 'scroll' &&
                overflowY !== 'overlay'
            ) {
                continue;
            }

            const difference =
                element.scrollHeight -
                element.clientHeight;

            if (difference <= 0) {
                continue;
            }

            /*
             * Prefer the smallest usable scroll area.
             * The giant 20539px virtual content element
             * should therefore NOT be selected.
             */

            if (
                best === null ||
                difference < bestDifference
            ) {
                best = element;
                bestDifference = difference;
            }
        }

        scrollContainer = best;
    }


    // =========================================================
    // REPORT SCROLL CONTAINER
    // =========================================================

    if (scrollContainer) {

        console.log(
            '========== SCROLL CONTAINER =========='
        );

        console.log(
            scrollContainer
        );

        console.log(
            'clientHeight:',
            scrollContainer.clientHeight
        );

        console.log(
            'scrollHeight:',
            scrollContainer.scrollHeight
        );

        console.log(
            'scrollTop:',
            scrollContainer.scrollTop
        );
    }


    // =========================================================
    // FORCE SCROLL FUNCTION
    // =========================================================

    const forceScroll = amount => {

        if (!scrollContainer) return false;

        const before =
            scrollContainer.scrollTop;


        // -----------------------------------------------------
        // Method 1: direct scrollTop
        // -----------------------------------------------------

        scrollContainer.scrollTop =
            before + amount;


        // -----------------------------------------------------
        // Method 2: scrollBy
        // -----------------------------------------------------

        try {

            scrollContainer.scrollBy({
                top: amount,
                left: 0,
                behavior: 'instant'
            });

        } catch {

            scrollContainer.scrollTop =
                before + amount;
        }


        // -----------------------------------------------------
        // Method 3: Wheel event
        // -----------------------------------------------------

        try {

            scrollContainer.dispatchEvent(
                new WheelEvent('wheel', {
                    bubbles: true,
                    cancelable: true,
                    deltaY: amount,
                    deltaX: 0,
                    deltaMode: 0
                })
            );

        } catch {}


        // -----------------------------------------------------
        // Method 4: mouse wheel event
        // -----------------------------------------------------

        try {

            scrollContainer.dispatchEvent(
                new WheelEvent('mousewheel', {
                    bubbles: true,
                    cancelable: true,
                    deltaY: amount,
                    wheelDelta: -amount
                })
            );

        } catch {}


        return true;
    };


    // =========================================================
    // VIRTUALIZED LIST SCROLLING
    // =========================================================

    if (scrollContainer) {

        console.log(
            '========== STARTING MEMBER SCROLL =========='
        );

        let previousTop = -1;

        let unchangedCount = 0;

        let lastMemberCount = 0;

        const MAX_SCROLLS = 1000;


        for (
            let i = 0;
            i < MAX_SCROLLS;
            i++
        ) {

            // -----------------------------------------------
            // Collect currently rendered rows
            // -----------------------------------------------

            collectMembers();


            const currentTop =
                scrollContainer.scrollTop;

            const maxTop =
                Math.max(
                    0,
                    scrollContainer.scrollHeight -
                    scrollContainer.clientHeight
                );


            // -----------------------------------------------
            // Progress logging
            // -----------------------------------------------

            if (
                i % 10 === 0 ||
                memberNames.size !== lastMemberCount
            ) {

                console.log(
                    `Scroll ${i} | position ${Math.round(currentTop)} / ${Math.round(maxTop)} | members ${memberNames.size}`
                );

                lastMemberCount =
                    memberNames.size;
            }


            // -----------------------------------------------
            // Bottom reached
            // -----------------------------------------------

            if (
                currentTop >= maxTop - 3
            ) {

                await sleep(300);

                collectMembers();

                console.log(
                    'Bottom reached.'
                );

                break;
            }


            // -----------------------------------------------
            // Detect no movement
            // -----------------------------------------------

            if (
                Math.abs(
                    currentTop -
                    previousTop
                ) < 1
            ) {

                unchangedCount++;

            } else {

                unchangedCount = 0;
            }

            previousTop =
                currentTop;


            // -----------------------------------------------
            // Normal jump
            // -----------------------------------------------

            const viewport =
                scrollContainer.clientHeight;

            const jump =
                Math.max(
                    300,
                    Math.floor(
                        viewport * 0.8
                    )
                );


            forceScroll(jump);


            // -----------------------------------------------
            // Allow WhatsApp virtual list to render
            // -----------------------------------------------

            await sleep(100);


            collectMembers();


            // -----------------------------------------------
            // If WhatsApp didn't move,
            // use increasingly aggressive scrolling.
            // -----------------------------------------------

            if (unchangedCount >= 2) {

                console.log(
                    'Normal scroll did not move. Forcing scroll...'
                );

                const current =
                    scrollContainer.scrollTop;

                const max =
                    Math.max(
                        0,
                        scrollContainer.scrollHeight -
                        scrollContainer.clientHeight
                    );


                scrollContainer.scrollTop =
                    Math.min(
                        max,
                        current + 1200
                    );


                await sleep(150);

                collectMembers();

                unchangedCount = 0;
            }


            // -----------------------------------------------
            // Last-resort bottom attempt
            // -----------------------------------------------

            if (unchangedCount >= 5) {

                console.log(
                    'Scroll appears stuck. Trying end position.'
                );

                scrollContainer.scrollTop =
                    scrollContainer.scrollHeight;

                await sleep(250);

                collectMembers();

                if (
                    scrollContainer.scrollTop >=
                    scrollContainer.scrollHeight -
                    scrollContainer.clientHeight -
                    3
                ) {
                    break;
                }
            }
        }


    } else {

        console.warn(
            'Could not find the actual scroll container.'
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

    const ownerElement =
        [...document.querySelectorAll('span')]
            .find(span =>
                span.textContent
                    .trim()
                    .startsWith(
                        'Group created by '
                    )
            );


    if (ownerElement) {

        const ownerText =
            ownerElement.textContent.trim();

        const match =
            ownerText.match(
                /^Group created by (.*?),\s*on\s/
            );

        if (match) {
            owner =
                match[1].trim();
        }
    }


    // =========================================================
    // FINAL ARRAYS
    // =========================================================

    const memberList =
        [...memberNames.values()];

    const adminList =
        [...admins.values()];


    // =========================================================
    // FINAL DATA OBJECT
    // =========================================================

    const data = {

        groupName:
            groupName,

        members:
            memberCount,

        memberCountExtracted:
            memberList.length,

        memberList:
            memberList,

        admin:
            adminList,

        owner:
            owner
    };


    // =========================================================
    // OUTPUT
    // =========================================================

    console.log(
        '============================================'
    );

    console.log(
        'GROUP MEMBER EXTRACTION COMPLETE'
    );

    console.log(
        '============================================'
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
