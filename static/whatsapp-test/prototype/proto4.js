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
    //
    // Map automatically removes duplicate members.
    // =========================================================

    const memberNames = new Map();
    const admins = new Map();

    let amIAdmin = false;
    let myMemberRow = null;


    // =========================================================
    // ADD MEMBER TO UNIQUE STORAGE
    // =========================================================

    const addMember = (name, row) => {

        if (!name) return;

        const cleanName =
            name
                .replace(/\s+/g, ' ')
                .trim();

        if (!cleanName) return;

        const key =
            cleanName.toLocaleLowerCase();

        // -----------------------------------------------------
        // UNIQUE MEMBER
        // -----------------------------------------------------

        if (!memberNames.has(key)) {
            memberNames.set(
                key,
                cleanName
            );
        }


        // -----------------------------------------------------
        // ADMIN
        // -----------------------------------------------------

        const isAdmin =
            !!row.querySelector(
                '[data-testid="group-admin-marker"]'
            );

        if (isAdmin) {

            admins.set(
                key,
                cleanName
            );
        }


        // -----------------------------------------------------
        // CURRENT USER
        //
        // Your supplied HTML shows:
        //
        // <span title="You">You</span>
        //
        // Therefore we use the title attribute instead of
        // guessing from text.
        // -----------------------------------------------------

        const youElement =
            row.querySelector(
                'span[title="You"]'
            );

        if (youElement) {

            myMemberRow = row;

            amIAdmin = isAdmin;

            console.log(
                '========== CURRENT USER FOUND =========='
            );

            console.log(
                'You:',
                cleanName
            );

            console.log(
                'Admin:',
                isAdmin
            );
        }
    };


    // =========================================================
    // COLLECT MEMBERS FROM A CONTAINER
    // =========================================================

    const collectMembersFromContainer = container => {

        if (!container) return 0;

        const rows =
            container.querySelectorAll(
                '[data-testid^="list-item-"]'
            );

        let collected = 0;

        rows.forEach(row => {

            // Ignore section headers
            if (
                row.querySelector(
                    '[data-testid="section-header"]'
                )
            ) {
                return;
            }

            const nameElement =
                row.querySelector(
                    '[data-testid="cell-frame-title"] span[dir="auto"]'
                );

            if (!nameElement) return;

            const name =
                nameElement.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

            if (!name) return;

            addMember(
                name,
                row
            );

            collected++;
        });

        return collected;
    };


    // =========================================================
    // FIND VIEW ALL
    // =========================================================

    const findViewAll = () => {

        return [...document.querySelectorAll('div')]
            .find(div =>
                /^View all \(\d+ more\)$/i.test(
                    div.textContent.trim()
                )
            );
    };


    // =========================================================
    // FIND PARTICIPANTS SECTION
    // =========================================================

    const findParticipantsSection = () => {

        return document.querySelector(
            '[data-testid="group-info-participants-section"]'
        );
    };


    // =========================================================
    // INITIAL PARTICIPANTS SECTION
    // =========================================================

    const participantsSection =
        findParticipantsSection();

    if (!participantsSection) {

        console.error(
            'Group participants section not found.'
        );

        return;
    }


    // =========================================================
    // FIRST COLLECTION
    //
    // This handles the members already visible in the
    // group information panel.
    // =========================================================

    collectMembersFromContainer(
        participantsSection
    );


    // =========================================================
    // VIEW ALL
    // =========================================================

    const viewAll =
        findViewAll();


    // =========================================================
    // IF VIEW ALL EXISTS
    // =========================================================

    if (viewAll) {

        console.log(
            '============================================'
        );

        console.log(
            'VIEW ALL FOUND'
        );

        console.log(
            viewAll.textContent.trim()
        );

        console.log(
            'Clicking View all...'
        );

        console.log(
            '============================================'
        );


        dispatchClick(viewAll);

        await sleep(700);


        // -----------------------------------------------------
        // FIND CONTACTS MODAL
        // -----------------------------------------------------

        const contactsModal =
            document.querySelector(
                '[data-testid="contacts-modal"]'
            );

        if (!contactsModal) {

            console.warn(
                'Contacts modal not found after View all.'
            );

        } else {

            console.log(
                'Contacts modal found.'
            );


            // -------------------------------------------------
            // COLLECT CURRENTLY VISIBLE MEMBERS
            // -------------------------------------------------

            collectMembersFromContainer(
                contactsModal
            );


            // -------------------------------------------------
            // FIND SCROLLABLE CONTAINER
            // -------------------------------------------------

            const getScrollableAncestors =
                element => {

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


            const firstListItem =
                contactsModal.querySelector(
                    '[data-testid="list-item-0"]'
                );


            let scrollContainer = null;


            if (firstListItem) {

                const ancestors =
                    getScrollableAncestors(
                        firstListItem
                    );

                if (ancestors.length) {

                    scrollContainer =
                        ancestors[0];
                }
            }


            // -------------------------------------------------
            // SECONDARY SCROLL SEARCH
            // -------------------------------------------------

            if (!scrollContainer) {

                const allElements =
                    contactsModal.querySelectorAll('*');

                let best = null;
                let bestDifference = Infinity;

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

                    if (
                        difference <
                        bestDifference
                    ) {

                        best =
                            element;

                        bestDifference =
                            difference;
                    }
                }

                scrollContainer =
                    best;
            }


            // -------------------------------------------------
            // SCROLL
            // -------------------------------------------------

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


                let previousTop = -1;
                let unchangedCount = 0;

                const MAX_SCROLLS = 1000;


                for (
                    let i = 0;
                    i < MAX_SCROLLS;
                    i++
                ) {

                    // -----------------------------------------
                    // Collect visible members
                    // -----------------------------------------

                    collectMembersFromContainer(
                        contactsModal
                    );


                    const currentTop =
                        scrollContainer.scrollTop;

                    const maxTop =
                        Math.max(
                            0,
                            scrollContainer.scrollHeight -
                            scrollContainer.clientHeight
                        );


                    // -----------------------------------------
                    // Progress
                    // -----------------------------------------

                    if (
                        i % 10 === 0
                    ) {

                        console.log(
                            `Scroll ${i} | ${Math.round(currentTop)} / ${Math.round(maxTop)} | Unique members: ${memberNames.size}`
                        );
                    }


                    // -----------------------------------------
                    // Bottom reached
                    // -----------------------------------------

                    if (
                        currentTop >=
                        maxTop - 3
                    ) {

                        await sleep(300);

                        collectMembersFromContainer(
                            contactsModal
                        );

                        console.log(
                            'Bottom reached.'
                        );

                        break;
                    }


                    // -----------------------------------------
                    // Detect movement
                    // -----------------------------------------

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


                    // -----------------------------------------
                    // Normal jump
                    // -----------------------------------------

                    const viewport =
                        scrollContainer.clientHeight;

                    const jump =
                        Math.max(
                            300,
                            Math.floor(
                                viewport * 0.8
                            )
                        );


                    scrollContainer.scrollTop =
                        Math.min(
                            maxTop,
                            currentTop + jump
                        );


                    await sleep(120);


                    // -----------------------------------------
                    // Collect again after rendering
                    // -----------------------------------------

                    collectMembersFromContainer(
                        contactsModal
                    );


                    // -----------------------------------------
                    // Force if stuck
                    // -----------------------------------------

                    if (
                        unchangedCount >= 2
                    ) {

                        console.log(
                            'Normal scroll did not move. Forcing...'
                        );


                        scrollContainer.scrollTop =
                            Math.min(
                                maxTop,
                                currentTop + 1200
                            );


                        await sleep(200);


                        collectMembersFromContainer(
                            contactsModal
                        );


                        unchangedCount = 0;
                    }
                }

            } else {

                console.warn(
                    'Could not find scroll container.'
                );
            }
        }


    // =========================================================
    // IF VIEW ALL DOES NOT EXIST
    // =========================================================

    } else {

        console.log(
            '============================================'
        );

        console.log(
            'VIEW ALL NOT FOUND'
        );

        console.log(
            'Using group-info-participants-section directly.'
        );

        console.log(
            '============================================'
        );


        // -----------------------------------------------------
        // USE THE EXACT SECTION YOU PROVIDED
        // -----------------------------------------------------

        const directSection =
            document.querySelector(
                '[data-testid="group-info-participants-section"]'
            );


        if (!directSection) {

            console.error(
                'Direct participants section not found.'
            );

        } else {

            // -------------------------------------------------
            // Collect all visible rows
            // -------------------------------------------------

            collectMembersFromContainer(
                directSection
            );


            // -------------------------------------------------
            // Extra direct row search
            //
            // This makes it work even if the list structure
            // changes slightly.
            // -------------------------------------------------

            const directRows =
                directSection.querySelectorAll(
                    '[data-testid^="list-item-"]'
                );


            directRows.forEach(row => {

                const nameElement =
                    row.querySelector(
                        '[data-testid="cell-frame-title"] span[dir="auto"]'
                    );

                if (!nameElement) return;

                const name =
                    nameElement.textContent
                        .replace(/\s+/g, ' ')
                        .trim();

                if (!name) return;

                addMember(
                    name,
                    row
                );
            });
        }
    }


    // =========================================================
    // FINAL COLLECTION
    // =========================================================

    collectMembersFromContainer(
        document.querySelector(
            '[data-testid="group-info-participants-section"]'
        )
    );


    const contactsModalFinal =
        document.querySelector(
            '[data-testid="contacts-modal"]'
        );

    if (contactsModalFinal) {

        collectMembersFromContainer(
            contactsModalFinal
        );
    }


    // =========================================================
    // FINAL ARRAYS
    // =========================================================

    const memberList =
        [...memberNames.values()];

    const adminList =
        [...admins.values()];


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
    // GIANT ADMIN STATUS LOG
    // =========================================================

    if (myMemberRow) {

        if (amIAdmin) {

            console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║                    █████╗ ██████╗ ███╗   ███╗██╗███╗   ██╗        ║
║                   ██╔══██╗██╔══██╗████╗ ████║██║████╗  ██║        ║
║                   ███████║██║  ██║██╔████╔██║██║██╔██╗ ██║        ║
║                   ██╔══██║██║  ██║██║╚██╔╝██║██║██║╚██╗██║        ║
║                   ██║  ██║██████╔╝██║ ╚═╝ ██║██║██║ ╚████║        ║
║                   ╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝        ║
║                                                                    ║
║                    ✅  YOU ARE ADMIN  ✅                            ║
║                                                                    ║
║                     Admin status: TRUE                             ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
            `);

            console.log(
                '%c✅ YOU ARE ADMIN',
                'font-size: 30px; font-weight: bold;'
            );

        } else {

            console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║                  ███╗   ██╗ ██████╗ ████████╗                     ║
║                  ████╗  ██║██╔═══██╗╚══██╔══╝                     ║
║                  ██╔██╗ ██║██║   ██║   ██║                        ║
║                  ██║╚██╗██║██║   ██║   ██║                        ║
║                  ██║ ╚████║╚██████╔╝   ██║                        ║
║                  ╚═╝  ╚═══╝ ╚═════╝    ╚═╝                        ║
║                                                                    ║
║                 ❌  YOU ARE NOT ADMIN  ❌                          ║
║                                                                    ║
║                     Admin status: FALSE                            ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
            `);

            console.log(
                '%c❌ YOU ARE NOT ADMIN',
                'font-size: 30px; font-weight: bold;'
            );
        }

    } else {

        console.error(
            '%c⚠️ COULD NOT DETERMINE YOUR ADMIN STATUS',
            'font-size: 25px; font-weight: bold;'
        );
    }


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
            owner,

        amIAdmin:
            amIAdmin
    };


    // =========================================================
    // FINAL OUTPUT
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
        'Unique members extracted:',
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
        'Am I admin:',
        amIAdmin
    );

    console.log(
        '========== UNIQUE MEMBER LIST =========='
    );

    console.log(
        memberList
    );

    console.log(
        '========== ACTUAL DATA OBJECT =========='
    );

    console.log(data);

})();
