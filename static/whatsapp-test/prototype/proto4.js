(async () => {
    console.clear();

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    // =========================================================
    // RESULT
    // =========================================================

    const result = {
        initial: [],
        viewMore: []
    };

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
    // ADMIN STORAGE
    // =========================================================

    const admins = new Map();

    let amIAdmin = false;

    // =========================================================
    // INITIAL MEMBER SCAN
    // ONLY NAMES
    // =========================================================

    const initialSeen = new Set();

    const scanInitial = () => {

        const members = document.querySelectorAll(
            '[aria-label^="Members list"] [role="listitem"]'
        );

        members.forEach(member => {

            const element = member.querySelector(
                '[data-testid="cell-frame-title"] span[dir="auto"]'
            );

            if (!element) return;

            const name =
                element.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

            if (!name || name === 'You') return;

            const key =
                name.toLocaleLowerCase();

            if (initialSeen.has(key)) return;

            initialSeen.add(key);

            result.initial.push(name);

            // ---------------------------------------------
            // ADMIN
            // ---------------------------------------------

            const isAdmin =
                !!member.querySelector(
                    '[data-testid="group-admin-marker"]'
                );

            if (isAdmin) {
                admins.set(key, name);
            }

            // ---------------------------------------------
            // CURRENT USER
            // ---------------------------------------------

            const youElement =
                member.querySelector(
                    'span[title="You"]'
                );

            if (youElement) {
                amIAdmin = isAdmin;
            }
        });
    };

    scanInitial();

    // =========================================================
    // FIND VIEW ALL
    // =========================================================

    const viewAllText = Array.from(
        document.querySelectorAll('div')
    ).find(el => {

        const text =
            el.textContent.trim();

        return /^View all \(\d+ more\)$/i.test(text);
    });

    // =========================================================
    // VIEW MORE SCAN
    // =========================================================

    const viewMoreSeen = new Set();

    const scanViewMore = modal => {

        if (!modal) return;

        const items =
            modal.querySelectorAll(
                '[role="listitem"]'
            );

        items.forEach(item => {

            const nameElement =
                item.querySelector(
                    'span[title]'
                );

            if (!nameElement) return;

            let name =
                nameElement.getAttribute('title') ||
                nameElement.textContent?.trim();

            if (!name) return;

            name =
                name
                    .replace(/\s+/g, ' ')
                    .trim();

            if (!name || name === 'You') return;

            const key =
                name.toLocaleLowerCase();

            if (viewMoreSeen.has(key)) return;

            viewMoreSeen.add(key);

            result.viewMore.push(name);

            // ---------------------------------------------
            // ADMIN
            // ---------------------------------------------

            const isAdmin =
                !!item.querySelector(
                    '[data-testid="group-admin-marker"]'
                );

            if (isAdmin) {
                admins.set(key, name);
            }

            // ---------------------------------------------
            // CURRENT USER
            // ---------------------------------------------

            const youElement =
                item.querySelector(
                    'span[title="You"]'
                );

            if (youElement) {
                amIAdmin = isAdmin;
            }
        });
    };

    // =========================================================
    // CLICK VIEW ALL
    // =========================================================

    if (viewAllText) {

        const viewAllButton =
            viewAllText.closest('[role="button"]') ||
            viewAllText;

        dispatchClick(viewAllButton);

        await sleep(700);

        // =====================================================
        // FIND CONTACTS MODAL
        // =====================================================

        const modal =
            document.querySelector(
                '[data-testid="contacts-modal"]'
            );

        if (!modal) {

            console.warn(
                'Contacts modal not found after View all.'
            );

        } else {

            console.log(
                'Contacts modal found.'
            );

            // =================================================
            // FIND FIRST LIST ITEM
            // =================================================

            const firstItem =
                modal.querySelector(
                    '[role="listitem"]'
                );

            // =================================================
            // FIND ACTUAL SCROLLABLE CONTAINER
            // =================================================

            const getScrollableAncestors = element => {

                const ancestors = [];

                let current = element;

                while (
                    current &&
                    current !== modal &&
                    current !== document.body
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
                        ancestors.push(current);
                    }

                    current =
                        current.parentElement;
                }

                return ancestors;
            };

            let scrollContainer = null;

            // ---------------------------------------------
            // PRIMARY SEARCH
            // ---------------------------------------------

            if (firstItem) {

                const ancestors =
                    getScrollableAncestors(firstItem);

                if (ancestors.length) {
                    scrollContainer = ancestors[0];
                }
            }

            // ---------------------------------------------
            // SECONDARY SEARCH
            // ---------------------------------------------

            if (!scrollContainer) {

                const allElements =
                    modal.querySelectorAll('*');

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
                        best = element;
                        bestDifference = difference;
                    }
                }

                scrollContainer = best;
            }

            // =================================================
            // INITIAL VIEW MORE SCAN
            // =================================================

            scanViewMore(modal);

            // =================================================
            // SCROLL
            // =================================================

            if (scrollContainer) {

                console.log(
                    '========== SCROLL CONTAINER =========='
                );

                console.log(
                    scrollContainer
                );

                let previousTop = -1;
                let unchangedCount = 0;

                const MAX_SCROLLS = 1000;

                for (
                    let i = 0;
                    i < MAX_SCROLLS;
                    i++
                ) {

                    scanViewMore(modal);

                    const currentTop =
                        scrollContainer.scrollTop;

                    const maxTop =
                        Math.max(
                            0,
                            scrollContainer.scrollHeight -
                            scrollContainer.clientHeight
                        );

                    // -----------------------------------------
                    // BOTTOM
                    // -----------------------------------------

                    if (
                        currentTop >=
                        maxTop - 3
                    ) {

                        await sleep(300);

                        scanViewMore(modal);

                        break;
                    }

                    // -----------------------------------------
                    // STUCK DETECTION
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

                    previousTop = currentTop;

                    // -----------------------------------------
                    // SCROLL
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

                    scanViewMore(modal);

                    // -----------------------------------------
                    // FORCE IF STUCK
                    // -----------------------------------------

                    if (
                        unchangedCount >= 2
                    ) {

                        scrollContainer.scrollTop =
                            Math.min(
                                maxTop,
                                currentTop + 1200
                            );

                        await sleep(200);

                        scanViewMore(modal);

                        unchangedCount = 0;
                    }
                }

                scanViewMore(modal);

            } else {

                console.warn(
                    'Could not find scroll container.'
                );
            }
        }

    } else {

        console.log(
            'View all not found.'
        );
    }

    // =========================================================
    // FINAL INITIAL SCAN
    // =========================================================

    scanInitial();

    // =========================================================
    // OWNER
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
            owner = match[1].trim();
        }
    }

    // =========================================================
    // FINAL DATA
    // =========================================================

    const adminList =
        [...admins.values()];

    const memberList = [
        ...result.initial,
        ...result.viewMore
    ];

    const uniqueMemberList =
        [...new Map(
            memberList.map(name => [
                name.toLocaleLowerCase(),
                name
            ])
        ).values()];

    const data = {

        groupName,

        members:
            memberCount,

        memberCountExtracted:
            uniqueMemberList.length,

        memberList:
            uniqueMemberList,

        initial:
            result.initial,

        viewMore:
            result.viewMore,

        admin:
            adminList,

        owner,

        amIAdmin
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
        '========== ACTUAL JAVASCRIPT OBJECT =========='
    );

    console.log(data);

})();
