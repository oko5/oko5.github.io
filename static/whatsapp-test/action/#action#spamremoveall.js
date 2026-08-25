(async () => {
    console.clear();

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    // ============================================================
    // CONFIGURATION
    // ============================================================

    const ACTION = 'remuser';

    // ============================================================
    // RESULT
    // ============================================================

    const result = {
        initial: [],
        viewMore: []
    };

    const memberNames = [];
    const seenNames = new Set();

    // ============================================================
    // GENERIC CLICK
    // ============================================================

    const dispatchLeftClick = element => {

        if (!element) {
            return false;
        }

        const rect =
            element.getBoundingClientRect();

        if (
            !rect.width ||
            !rect.height
        ) {
            return false;
        }

        const x =
            rect.left +
            rect.width / 2;

        const y =
            rect.top +
            rect.height / 2;

        const dispatch = (
            type,
            button = 0,
            buttons = 0,
            detail = 1
        ) => {

            element.dispatchEvent(
                new MouseEvent(type, {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    detail,
                    screenX: x,
                    screenY: y,
                    clientX: x,
                    clientY: y,
                    button,
                    buttons
                })
            );
        };

        dispatch('mouseenter');
        dispatch('mouseover');
        dispatch('mousemove');
        dispatch('mousedown', 0, 1, 1);
        dispatch('mouseup', 0, 0, 1);
        dispatch('click', 0, 0, 1);

        return true;
    };

    // ============================================================
    // ADD MEMBER
    // ============================================================

    const addMember = (
        name,
        source
    ) => {

        if (!name) {
            return false;
        }

        name =
            name
                .replace(/\s+/g, ' ')
                .trim();

        if (
            !name ||
            name === 'You'
        ) {
            return false;
        }

        const key =
            name.toLocaleLowerCase();

        if (seenNames.has(key)) {
            return false;
        }

        seenNames.add(key);
        memberNames.push(name);

        if (source === 'initial') {
            result.initial.push(name);
        }

        if (source === 'viewMore') {
            result.viewMore.push(name);
        }

        return true;
    };

    // ============================================================
    // OPEN GROUP INFORMATION
    // ============================================================

    const header =
        document.querySelector(
            '[data-testid="conversation-header"]'
        );

    if (!header) {
        console.error(
            'Conversation header not found.'
        );
        return;
    }

    const headerElement =
        header.firstElementChild?.children[1];

    if (!headerElement) {
        console.error(
            'Group header button not found.'
        );
        return;
    }

    dispatchLeftClick(headerElement);

    await sleep(700);

    // ============================================================
    // GROUP INFORMATION
    // ============================================================

    const membersButton =
        [...document.querySelectorAll('button')]
            .find(btn =>
                /^\d+\s+members$/i.test(
                    btn.textContent.trim()
                )
            );

    const groupNameElement =
        document.querySelector(
            '[data-testid^="group-info-drawer-subject-input-read-only"]'
        );

    const groupName =
        groupNameElement?.textContent.trim() ||
        null;

    const memberCount =
        membersButton?.textContent.trim() ||
        null;

    console.log(
        'Group:',
        groupName
    );

    console.log(
        'Member count:',
        memberCount
    );

    // ============================================================
    // INITIAL MEMBER SCAN
    // ============================================================

    const scanInitial = () => {

        const members =
            document.querySelectorAll(
                '[aria-label^="Members list"] [role="listitem"]'
            );

        members.forEach(member => {

            const element =
                member.querySelector(
                    '[data-testid="cell-frame-title"] span[dir="auto"]'
                );

            if (!element) {
                return;
            }

            const name =
                element.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

            addMember(
                name,
                'initial'
            );
        });
    };

    // ============================================================
    // SCAN VIEW-MORE MODAL
    // ============================================================

    const scanViewMore = modal => {

        if (!modal) {
            return;
        }

        const items =
            modal.querySelectorAll(
                '[role="listitem"]'
            );

        items.forEach(item => {

            // ----------------------------------------------------
            // First try title
            // ----------------------------------------------------

            const titleElement =
                [...item.querySelectorAll('*')]
                    .find(el =>
                        el.getAttribute('title')
                    );

            if (!titleElement) {
                return;
            }

            let name =
                titleElement.getAttribute('title');

            if (!name) {
                return;
            }

            name =
                name
                    .replace(/\s+/g, ' ')
                    .trim();

            addMember(
                name,
                'viewMore'
            );
        });
    };

    // ============================================================
    // INITIAL SCAN
    // ============================================================

    scanInitial();

    console.log(
        'Initial members:',
        [...result.initial]
    );

    // ============================================================
    // FIND VIEW ALL
    // ============================================================

    const findViewAll = () => {

        return [...document.querySelectorAll('*')]
            .find(el => {

                const text =
                    el.textContent
                        .replace(/\s+/g, ' ')
                        .trim();

                return /^View all \(\d+ more\)$/i.test(
                    text
                );
            });
    };

    const viewAllText =
        findViewAll();

    // ============================================================
    // FIND SCROLLABLE CONTAINER
    // ============================================================

    const findScrollableContainer = modal => {

        // --------------------------------------------------------
        // FIRST: find an actual list item
        // --------------------------------------------------------

        const firstItem =
            modal.querySelector(
                '[role="listitem"]'
            );

        if (firstItem) {

            let current =
                firstItem.parentElement;

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

                    return current;
                }

                current =
                    current.parentElement;
            }
        }

        // --------------------------------------------------------
        // SECOND: search every element
        // --------------------------------------------------------

        let best = null;
        let bestScore = 0;

        const elements =
            modal.querySelectorAll('*');

        for (
            const element of elements
        ) {

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

            const score =
                difference *
                Math.max(
                    1,
                    element.clientWidth
                );

            if (score > bestScore) {
                best = element;
                bestScore = score;
            }
        }

        return best;
    };

    // ============================================================
    // VIEW MORE
    // ============================================================

    if (viewAllText) {

        console.log(
            'View all found.'
        );

        const viewAllButton =
            viewAllText.closest(
                '[role="button"]'
            ) ||
            viewAllText;

        dispatchLeftClick(
            viewAllButton
        );

        await sleep(800);

        // --------------------------------------------------------
        // FIND MODAL
        // --------------------------------------------------------

        const modal =
            document.querySelector(
                '[data-testid="contacts-modal"]'
            );

        if (!modal) {

            console.warn(
                'Contacts modal not found.'
            );

        } else {

            console.log(
                'Contacts modal found.'
            );

            // ----------------------------------------------------
            // FIRST SCAN
            // ----------------------------------------------------

            scanViewMore(modal);

            // ----------------------------------------------------
            // FIND SCROLLER
            // ----------------------------------------------------

            const scrollContainer =
                findScrollableContainer(
                    modal
                );

            if (!scrollContainer) {

                console.warn(
                    'Scrollable container not found.'
                );

            } else {

                console.log(
                    'Scrollable container:',
                    scrollContainer
                );

                let previousTop = -1;
                let unchangedCount = 0;

                const MAX_SCROLLS = 1000;

                // ------------------------------------------------
                // SCROLL
                // ------------------------------------------------

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

                    // --------------------------------------------
                    // BOTTOM
                    // --------------------------------------------

                    if (
                        currentTop >=
                        maxTop - 3
                    ) {

                        await sleep(300);

                        scanViewMore(modal);

                        console.log(
                            'Reached bottom.'
                        );

                        break;
                    }

                    // --------------------------------------------
                    // STUCK
                    // --------------------------------------------

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

                    // --------------------------------------------
                    // NORMAL SCROLL
                    // --------------------------------------------

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

                    await sleep(150);

                    scanViewMore(modal);

                    // --------------------------------------------
                    // FORCE
                    // --------------------------------------------

                    if (
                        unchangedCount >= 2
                    ) {

                        scrollContainer.scrollTop =
                            Math.min(
                                maxTop,
                                currentTop + 1200
                            );

                        await sleep(250);

                        scanViewMore(modal);

                        unchangedCount = 0;
                    }
                }

                scanViewMore(modal);
            }
        }

    } else {

        // ========================================================
        // FALLBACK
        // ========================================================

        console.log(
            '============================================'
        );

        console.log(
            'VIEW ALL NOT FOUND'
        );

        console.log(
            'Using initial member list.'
        );

        console.log(
            '============================================'
        );
    }

    // ============================================================
    // FINAL UNIQUE LIST
    // ============================================================

    const uniqueMembers =
        [...new Map(
            memberNames.map(name => [
                name.toLocaleLowerCase(),
                name
            ])
        ).values()];

    console.log(
        '============================================'
    );

    console.log(
        'MEMBER COLLECTION COMPLETE'
    );

    console.log(
        'Total:',
        uniqueMembers.length
    );

    console.log(
        'Members:',
        uniqueMembers
    );

    // ============================================================
    // CONFIRMATION 1
    // ============================================================

    if (!window.confirm(
        `Found ${uniqueMembers.length} members.\n\n` +
        `The stored member list will be used for removal.\n\n` +
        `Continue?`
    )) {

        console.log(
            'STOPPED: Confirmation 1.'
        );

        return;
    }

    // ============================================================
    // CONFIRMATION 2
    // ============================================================

    if (!window.confirm(
        `CONFIRMATION 2 OF 3\n\n` +
        `${uniqueMembers.length} members are queued.\n\n` +
        `Continue?`
    )) {

        console.log(
            'STOPPED: Confirmation 2.'
        );

        return;
    }

    // ============================================================
    // CONFIRMATION 3
    // ============================================================

    if (!window.confirm(
        `FINAL CONFIRMATION 3 OF 3\n\n` +
        `The removal process will now begin.\n\n` +
        `Are you absolutely sure?`
    )) {

        console.log(
            'STOPPED: Confirmation 3.'
        );

        return;
    }

    // ============================================================
    // RIGHT CLICK
    // ============================================================

    function rightClick(
        action,
        memberName
    ) {

        return new Promise(resolve => {

            // ----------------------------------------------------
            // SUPPORT:
            //
            // rightClick("username")
            // rightClick("remuser", "username")
            // ----------------------------------------------------

            if (
                memberName === undefined
            ) {

                memberName = action;
                action = null;
            }

            // ----------------------------------------------------
            // FIND MEMBERS LIST
            // ----------------------------------------------------

            const list =
                [...document.querySelectorAll(
                    '[role="list"]'
                )]
                .find(list => {

                    return (
                        list.querySelector(
                            '[aria-label^="Members list:"]'
                        ) ||
                        list.matches(
                            '[aria-label^="Members list:"]'
                        )
                    );
                });

            if (!list) {

                console.error(
                    'Members list not found'
                );

                resolve(false);
                return;
            }

            // ----------------------------------------------------
            // FIND MEMBER
            // ----------------------------------------------------

            const items =
                [
                    ...list.querySelectorAll(
                        '[role="listitem"]'
                    )
                ];

            const member =
                items.find(item =>
                    [
                        ...item.querySelectorAll('*')
                    ].some(el =>
                        el.getAttribute('title') ===
                        memberName
                    )
                );

            if (!member) {

                console.warn(
                    `Member "${memberName}" not found`
                );

                resolve(false);
                return;
            }

            // ----------------------------------------------------
            // NAME ELEMENT
            // ----------------------------------------------------

            const nameElement =
                [
                    ...member.querySelectorAll('*')
                ].find(el =>
                    el.getAttribute('title') ===
                    memberName
                );

            if (!nameElement) {

                console.warn(
                    `Name element "${memberName}" not found`
                );

                resolve(false);
                return;
            }

            const rect =
                nameElement.getBoundingClientRect();

            if (
                !rect.width ||
                !rect.height
            ) {

                console.warn(
                    `"${memberName}" is not visible`
                );

                resolve(false);
                return;
            }

            const x =
                rect.left +
                rect.width / 2;

            const y =
                rect.top +
                rect.height / 2;

            // ----------------------------------------------------
            // RIGHT CLICK
            // ----------------------------------------------------

            const dispatchRight = (
                type,
                button = 0,
                buttons = 0
            ) => {

                nameElement.dispatchEvent(
                    new MouseEvent(type, {
                        bubbles: true,
                        cancelable: true,
                        view: window,
                        detail: 1,
                        screenX: x,
                        screenY: y,
                        clientX: x,
                        clientY: y,
                        button,
                        buttons
                    })
                );
            };

            dispatchRight(
                'mouseenter'
            );

            dispatchRight(
                'mouseover'
            );

            dispatchRight(
                'mousemove'
            );

            dispatchRight(
                'mousedown',
                2,
                2
            );

            dispatchRight(
                'mouseup',
                2,
                0
            );

            dispatchRight(
                'contextmenu',
                2,
                0
            );

            console.log(
                'Right-clicked:',
                memberName
            );

            // ----------------------------------------------------
            // NO ACTION
            // ----------------------------------------------------

            if (!action) {

                resolve(true);
                return;
            }

            // ----------------------------------------------------
            // ACTION TEXT
            // ----------------------------------------------------

            const menuText = {
                unadmin:
                    'Dismiss as admin',

                readmin:
                    'Make group admin',

                remuser:
                    'Remove'

            }[action];

            if (!menuText) {

                console.error(
                    `Unknown action "${action}"`
                );

                resolve(false);
                return;
            }

            // ----------------------------------------------------
            // FIND VISIBLE TEXT
            // ----------------------------------------------------

            const findVisibleText = text => {

                const elements =
                    [...document.querySelectorAll('*')]
                        .filter(el =>
                            el.textContent
                                .trim() === text
                        )
                        .filter(el => {

                            const r =
                                el.getBoundingClientRect();

                            return (
                                r.width > 0 &&
                                r.height > 0 &&
                                r.top >= 0 &&
                                r.left >= 0
                            );
                        });

                // Prefer the smallest exact-text element.
                return elements.sort(
                    (a, b) => {

                        const ar =
                            a.getBoundingClientRect();

                        const br =
                            b.getBoundingClientRect();

                        return (
                            ar.width *
                            ar.height
                        ) - (
                            br.width *
                            br.height
                        );
                    }
                )[0];
            };

            // ----------------------------------------------------
            // LEFT CLICK
            // ----------------------------------------------------

            const leftClick = element => {

                const r =
                    element.getBoundingClientRect();

                if (
                    !r.width ||
                    !r.height
                ) {
                    return false;
                }

                const cx =
                    r.left +
                    r.width / 2;

                const cy =
                    r.top +
                    r.height / 2;

                const dispatch = (
                    type,
                    button = 0,
                    buttons = 0
                ) => {

                    element.dispatchEvent(
                        new MouseEvent(type, {
                            bubbles: true,
                            cancelable: true,
                            view: window,
                            detail: 1,
                            screenX: cx,
                            screenY: cy,
                            clientX: cx,
                            clientY: cy,
                            button,
                            buttons
                        })
                    );
                };

                dispatch(
                    'mouseenter'
                );

                dispatch(
                    'mouseover'
                );

                dispatch(
                    'mousemove'
                );

                dispatch(
                    'mousedown',
                    0,
                    1
                );

                dispatch(
                    'mouseup',
                    0,
                    0
                );

                dispatch(
                    'click',
                    0,
                    0
                );

                return true;
            };

            // ----------------------------------------------------
            // WAIT FOR FIRST MENU
            // ----------------------------------------------------

            const waitForFirstMenu =
                async () => {

                    for (
                        let attempt = 0;
                        attempt < 40;
                        attempt++
                    ) {

                        const textElement =
                            findVisibleText(
                                menuText
                            );

                        if (textElement) {

                            const clickable =
                                textElement.closest(
                                    '[role="menuitem"],' +
                                    '[role="option"],' +
                                    '[role="button"]'
                                ) ||
                                textElement.parentElement ||
                                textElement;

                            if (
                                leftClick(
                                    clickable
                                )
                            ) {

                                console.log(
                                    `Clicked "${menuText}" for "${memberName}"`
                                );

                                return true;
                            }
                        }

                        await sleep(50);
                    }

                    return false;
                };

            // ----------------------------------------------------
            // REMOVE CONFIRMATION
            // ----------------------------------------------------

            const waitForRemoveConfirmation =
                async () => {

                    for (
                        let attempt = 0;
                        attempt < 40;
                        attempt++
                    ) {

                        const candidates =
                            [
                                ...document.querySelectorAll(
                                    'span'
                                )
                            ]
                            .filter(span =>
                                span.textContent
                                    .trim() ===
                                'Remove'
                            )
                            .filter(span => {

                                const r =
                                    span.getBoundingClientRect();

                                return (
                                    r.width > 0 &&
                                    r.height > 0 &&
                                    r.top >= 0 &&
                                    r.left >= 0
                                );
                            });

                        if (candidates.length) {

                            // Prefer the dialog/button version.
                            const confirmation =
                                candidates.find(
                                    span => {

                                        const parent =
                                            span.closest(
                                                '[role="button"],' +
                                                '[role="dialog"],' +
                                                '[role="menuitem"]'
                                            );

                                        return !!parent;
                                    }
                                ) ||
                                candidates.find(
                                    span =>
                                        span.classList
                                            .contains(
                                                'html-span'
                                            )
                                ) ||
                                candidates[0];

                            const clickable =
                                confirmation.closest(
                                    '[role="button"],' +
                                    '[role="menuitem"],' +
                                    '[role="option"]'
                                ) ||
                                confirmation.parentElement ||
                                confirmation;

                            if (
                                leftClick(
                                    clickable
                                )
                            ) {

                                console.log(
                                    `Confirmed Remove for "${memberName}"`
                                );

                                return true;
                            }
                        }

                        await sleep(75);
                    }

                    return false;
                };

            // ----------------------------------------------------
            // READMIN CONFIRMATION
            // ----------------------------------------------------

            const waitForReadminConfirmation =
                async () => {

                    for (
                        let attempt = 0;
                        attempt < 40;
                        attempt++
                    ) {

                        const confirmation =
                            findVisibleText(
                                'Make group admin'
                            );

                        if (confirmation) {

                            const clickable =
                                confirmation.closest(
                                    '[role="button"],' +
                                    '[role="menuitem"],' +
                                    '[role="option"]'
                                ) ||
                                confirmation.parentElement ||
                                confirmation;

                            if (
                                leftClick(
                                    clickable
                                )
                            ) {

                                console.log(
                                    `Confirmed Make group admin for "${memberName}"`
                                );

                                return true;
                            }
                        }

                        await sleep(75);
                    }

                    return false;
                };

            // ----------------------------------------------------
            // EXECUTE
            // ----------------------------------------------------

            (async () => {

                const firstMenu =
                    await waitForFirstMenu();

                if (!firstMenu) {

                    console.error(
                        `"${menuText}" not found for "${memberName}"`
                    );

                    resolve(false);
                    return;
                }

                // ----------------------------------------------
                // REMUSER
                // ----------------------------------------------

                if (
                    action === 'remuser'
                ) {

                    const confirmed =
                        await waitForRemoveConfirmation();

                    if (!confirmed) {

                        console.error(
                            `Remove confirmation not found for "${memberName}"`
                        );

                        resolve(false);
                        return;
                    }

                    // Give WhatsApp time to update the list.
                    await sleep(350);

                    resolve(true);
                    return;
                }

                // ----------------------------------------------
                // READMIN
                // ----------------------------------------------

                if (
                    action === 'readmin'
                ) {

                    const confirmed =
                        await waitForReadminConfirmation();

                    if (!confirmed) {

                        console.error(
                            `Make group admin confirmation not found for "${memberName}"`
                        );

                        resolve(false);
                        return;
                    }

                    await sleep(350);

                    resolve(true);
                    return;
                }

                // ----------------------------------------------
                // UNADMIN
                // ----------------------------------------------

                resolve(true);

            })();

        });
    }

    // ============================================================
    // FIND SCROLLABLE MEMBERS CONTAINER
    // ============================================================

    const findMembersScroller = () => {

        const list =
            [...document.querySelectorAll(
                '[role="list"]'
            )]
            .find(list =>
                list.querySelector(
                    '[aria-label^="Members list:"]'
                ) ||
                list.matches(
                    '[aria-label^="Members list:"]'
                )
            );

        if (!list) {
            return null;
        }

        const candidates = [];

        let current = list;

        while (
            current &&
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

                candidates.push(current);
            }

            current =
                current.parentElement;
        }

        // Search descendants too.
        for (
            const element of list.querySelectorAll('*')
        ) {

            const style =
                getComputedStyle(element);

            const overflowY =
                style.overflowY;

            if (
                (
                    overflowY === 'auto' ||
                    overflowY === 'scroll' ||
                    overflowY === 'overlay'
                ) &&
                element.scrollHeight >
                    element.clientHeight
            ) {

                candidates.push(element);
            }
        }

        return candidates.sort(
            (a, b) =>
                (
                    b.scrollHeight -
                    b.clientHeight
                ) -
                (
                    a.scrollHeight -
                    a.clientHeight
                )
        )[0] || null;
    };

    // ============================================================
    // REMOVE STORED MEMBERS
    // ============================================================

    console.log(
        '============================================'
    );

    console.log(
        'STARTING REMOVAL'
    );

    console.log(
        '============================================'
    );

    let removed = 0;
    let failed = 0;

    for (
        let index = 0;
        index < uniqueMembers.length;
        index++
    ) {

        const memberName =
            uniqueMembers[index];

        console.log(
            `Processing ${index + 1}/${uniqueMembers.length}:`,
            memberName
        );

        let success = false;

        // --------------------------------------------------------
        // TRY TO FIND MEMBER
        // --------------------------------------------------------

        for (
            let attempt = 0;
            attempt < 30;
            attempt++
        ) {

            // IMPORTANT:
            // The member may be visible now.
            success =
                await rightClick(
                    ACTION,
                    memberName
                );

            if (success) {
                break;
            }

            // ----------------------------------------------------
            // NOT VISIBLE → SCROLL
            // ----------------------------------------------------

            const scroller =
                findMembersScroller();

            if (!scroller) {

                await sleep(200);

                continue;
            }

            const maxTop =
                Math.max(
                    0,
                    scroller.scrollHeight -
                    scroller.clientHeight
                );

            const currentTop =
                scroller.scrollTop;

            if (
                currentTop >=
                maxTop - 3
            ) {

                // If we are already at bottom,
                // give the DOM another chance.
                await sleep(300);

            } else {

                const jump =
                    Math.max(
                        250,
                        Math.floor(
                            scroller.clientHeight *
                            0.75
                        )
                    );

                scroller.scrollTop =
                    Math.min(
                        maxTop,
                        currentTop + jump
                    );

                await sleep(250);
            }
        }

        // --------------------------------------------------------
        // RESULT
        // --------------------------------------------------------

        if (success) {

            removed++;

            console.log(
                `SUCCESS: ${memberName}`
            );

        } else {

            failed++;

            console.warn(
                `FAILED: ${memberName}`
            );
        }

        // --------------------------------------------------------
        // WAIT FOR DOM UPDATE
        // --------------------------------------------------------

        await sleep(500);
    }

    // ============================================================
    // FINAL DATA
    // ============================================================

    const data = {

        groupName,

        memberCount,

        memberCountExtracted:
            uniqueMembers.length,

        memberList:
            uniqueMembers,

        initial:
            result.initial,

        viewMore:
            result.viewMore,

        removal: {

            attempted:
                uniqueMembers.length,

            removed,

            failed
        }
    };

    // ============================================================
    // OUTPUT
    // ============================================================

    console.log(
        '============================================'
    );

    console.log(
        'COMPLETE'
    );

    console.log(
        '============================================'
    );

    console.log(
        data
    );

})();
