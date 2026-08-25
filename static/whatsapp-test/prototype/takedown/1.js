(async () => {
    console.clear();

    // ============================================================
    // CONFIG
    // ============================================================

    const ACTION = 'remuser';

    // Delay between operations.
    // Keep this low, but allow WhatsApp's React UI to update.
    const MENU_WAIT = 20;
    const UPDATE_WAIT = 50;
    const SCROLL_WAIT = 50;

    // ============================================================
    // SLEEP
    // ============================================================

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    // ============================================================
    // FAST CLICK
    // ============================================================

    function dispatchClick(element) {

        if (!element) {
            return false;
        }

        const r =
            element.getBoundingClientRect();

        if (
            !r.width ||
            !r.height
        ) {
            return false;
        }

        const x =
            r.left +
            r.width / 2;

        const y =
            r.top +
            r.height / 2;

        const fire = (
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

                    screenX: x,
                    screenY: y,

                    clientX: x,
                    clientY: y,

                    button,
                    buttons
                })
            );
        };

        fire('mouseenter');
        fire('mouseover');
        fire('mousemove');
        fire('mousedown', 0, 1);
        fire('mouseup', 0, 0);
        fire('click', 0, 0);

        return true;
    }

    // ============================================================
    // FIND VISIBLE EXACT TEXT
    // ============================================================

    function findVisibleText(text) {

        const elements =
            [...document.querySelectorAll('*')]
                .filter(el =>
                    el.textContent.trim() === text
                )
                .filter(el => {

                    const r =
                        el.getBoundingClientRect();

                    return (
                        r.width > 0 &&
                        r.height > 0 &&
                        r.bottom >= 0 &&
                        r.right >= 0 &&
                        r.top <= window.innerHeight &&
                        r.left <= window.innerWidth
                    );
                });

        if (!elements.length) {
            return null;
        }

        return elements.sort((a, b) => {

            const ar =
                a.getBoundingClientRect();

            const br =
                b.getBoundingClientRect();

            return (
                ar.width * ar.height
            ) - (
                br.width * br.height
            );

        })[0];
    }

    // ============================================================
    // FIND MEMBER ELEMENT
    // ============================================================

    function findMemberElement(memberName) {

        const exactTitle =
            el =>
                el.getAttribute('title') ===
                memberName;

        // --------------------------------------------------------
        // 1. Grid cells
        // --------------------------------------------------------

        const gridCells =
            [
                ...document.querySelectorAll(
                    '[role="gridcell"]'
                )
            ];

        let target =
            gridCells.find(cell =>
                [...cell.querySelectorAll('*')]
                    .some(exactTitle)
            );

        if (target) {
            return target;
        }

        // --------------------------------------------------------
        // 2. List items
        // --------------------------------------------------------

        const listItems =
            [
                ...document.querySelectorAll(
                    '[role="listitem"]'
                )
            ];

        target =
            listItems.find(item =>
                [...item.querySelectorAll('*')]
                    .some(exactTitle)
            );

        if (target) {
            return target;
        }

        // --------------------------------------------------------
        // 3. Members list
        // --------------------------------------------------------

        const memberLists =
            [
                ...document.querySelectorAll(
                    '[aria-label^="Members list"]'
                )
            ];

        for (
            const list of memberLists
        ) {

            const elements =
                [
                    ...list.querySelectorAll('*')
                ];

            const nameElement =
                elements.find(exactTitle);

            if (nameElement) {

                return (
                    nameElement.closest(
                        '[role="listitem"],' +
                        '[role="gridcell"]'
                    ) ||
                    nameElement
                );
            }
        }

        return null;
    }

    // ============================================================
    // LEFT CLICK
    //
    // SUPPORT:
    //
    // leftClick("username")
    // leftClick("remuser", "username")
    // leftClick("unadmin", "username")
    // leftClick("readmin", "username")
    // ============================================================

    async function leftClick(
        action,
        memberName
    ) {

        // --------------------------------------------------------
        // leftClick("username")
        // --------------------------------------------------------

        if (
            memberName === undefined
        ) {

            memberName = action;
            action = null;
        }

        // --------------------------------------------------------
        // FIND MEMBER
        // --------------------------------------------------------

        const target =
            findMemberElement(
                memberName
            );

        if (!target) {

            console.warn(
                `Member "${memberName}" not found`
            );

            return false;
        }

        // --------------------------------------------------------
        // FIND NAME ELEMENT
        // --------------------------------------------------------

        const nameElement =
            [
                ...target.querySelectorAll('*')
            ]
            .find(el =>
                el.getAttribute('title') ===
                memberName
            ) ||
            (
                target.getAttribute('title') ===
                memberName
                    ? target
                    : null
            );

        if (!nameElement) {

            console.warn(
                `Name element "${memberName}" not found`
            );

            return false;
        }

        // --------------------------------------------------------
        // MEMBER CLICK
        // --------------------------------------------------------

        if (
            !dispatchClick(
                nameElement
            )
        ) {

            return false;
        }

        console.log(
            'Clicked:',
            memberName
        );

        // No action requested.
        if (!action) {
            return true;
        }

        // --------------------------------------------------------
        // ACTION TEXT
        // --------------------------------------------------------

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

            return false;
        }

        // --------------------------------------------------------
        // WAIT FOR MENU
        // --------------------------------------------------------

        let menuElement = null;

        for (
            let i = 0;
            i < 20;
            i++
        ) {

            menuElement =
                findVisibleText(
                    menuText
                );

            if (menuElement) {
                break;
            }

            await sleep(MENU_WAIT);
        }

        if (!menuElement) {

            console.warn(
                `"${menuText}" not found for "${memberName}"`
            );

            return false;
        }

        // --------------------------------------------------------
        // CLICK MENU CONTAINER
        // --------------------------------------------------------

        const menuClickable =
            menuElement.closest(
                '[role="menuitem"],' +
                '[role="option"],' +
                '[role="button"]'
            ) ||
            menuElement.parentElement ||
            menuElement;

        dispatchClick(
            menuClickable
        );

        console.log(
            `Clicked "${menuText}" for "${memberName}"`
        );

        // --------------------------------------------------------
        // REMOVE CONFIRMATION
        // --------------------------------------------------------

        if (
            action === 'remuser'
        ) {

            let removeButton = null;

            for (
                let i = 0;
                i < 30;
                i++
            ) {

                const candidates =
                    [
                        ...document.querySelectorAll('*')
                    ]
                    .filter(el =>
                        el.textContent.trim() ===
                        'Remove'
                    )
                    .filter(el => {

                        const r =
                            el.getBoundingClientRect();

                        return (
                            r.width > 0 &&
                            r.height > 0 &&
                            r.bottom >= 0 &&
                            r.right >= 0 &&
                            r.top <=
                                window.innerHeight &&
                            r.left <=
                                window.innerWidth
                        );
                    });

                // Prefer elements inside a dialog.
                removeButton =
                    candidates.find(el =>
                        el.closest(
                            '[role="dialog"]'
                        )
                    ) ||
                    candidates.find(el =>
                        el.closest(
                            '[role="button"]'
                        )
                    ) ||
                    candidates[0];

                if (removeButton) {
                    break;
                }

                await sleep(MENU_WAIT);
            }

            if (!removeButton) {

                console.warn(
                    `Remove confirmation not found for "${memberName}"`
                );

                return false;
            }

            const clickable =
                removeButton.closest(
                    '[role="button"],' +
                    '[role="menuitem"],' +
                    '[role="option"]'
                ) ||
                removeButton.parentElement ||
                removeButton;

            dispatchClick(
                clickable
            );

            console.log(
                `REMOVED: ${memberName}`
            );

            await sleep(
                UPDATE_WAIT
            );

            return true;
        }

        // --------------------------------------------------------
        // READMIN CONFIRMATION
        // --------------------------------------------------------

        if (
            action === 'readmin'
        ) {

            const confirmation =
                findVisibleText(
                    'Make group admin'
                );

            if (!confirmation) {
                return false;
            }

            const clickable =
                confirmation.closest(
                    '[role="button"],' +
                    '[role="menuitem"],' +
                    '[role="option"]'
                ) ||
                confirmation.parentElement ||
                confirmation;

            dispatchClick(
                clickable
            );

            return true;
        }

        // --------------------------------------------------------
        // UNADMIN
        // --------------------------------------------------------

        return true;
    }

    // ============================================================
    // OPEN GROUP INFO
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

    const headerButton =
        header.firstElementChild?.children[1];

    if (!headerButton) {

        console.error(
            'Group header button not found.'
        );

        return;
    }

    dispatchClick(
        headerButton
    );

    await sleep(500);

    // ============================================================
    // FIND VIEW ALL
    // ============================================================

    function findViewAll() {

        const elements =
            [
                ...document.querySelectorAll('*')
            ];

        return elements.find(el => {

            const text =
                el.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

            return /^View all \(\d+ more\)$/i.test(
                text
            );
        });
    }

    const viewAll =
        findViewAll();

    // ============================================================
    // IF VIEW ALL EXISTS → OPEN IT
    // ============================================================

    if (viewAll) {

        console.log(
            'View all detected:',
            viewAll.textContent.trim()
        );

        const button =
            viewAll.closest(
                '[role="button"]'
            ) ||
            viewAll;

        dispatchClick(
            button
        );

        await sleep(400);

        console.log(
            'View all opened.'
        );
    } else {

        console.log(
            'No View all button.'
        );
    }

    // ============================================================
    // FIND MEMBER SCROLLER
    // ============================================================

    function findMemberScroller() {

        const roots = [
            ...document.querySelectorAll(
                '[aria-label^="Members list"]'
            ),
            ...document.querySelectorAll(
                '[data-testid="contacts-modal"]'
            ),
            ...document.querySelectorAll(
                '[role="dialog"]'
            )
        ];

        const candidates = [];

        for (
            const root of roots
        ) {

            let current = root;

            while (
                current &&
                current !== document.body
            ) {

                const style =
                    getComputedStyle(
                        current
                    );

                const overflow =
                    style.overflowY;

                if (
                    (
                        overflow === 'auto' ||
                        overflow === 'scroll' ||
                        overflow === 'overlay'
                    ) &&
                    current.scrollHeight >
                        current.clientHeight
                ) {

                    candidates.push(
                        current
                    );
                }

                current =
                    current.parentElement;
            }

            for (
                const child of
                root.querySelectorAll('*')
            ) {

                const style =
                    getComputedStyle(
                        child
                    );

                const overflow =
                    style.overflowY;

                if (
                    (
                        overflow === 'auto' ||
                        overflow === 'scroll' ||
                        overflow === 'overlay'
                    ) &&
                    child.scrollHeight >
                        child.clientHeight
                ) {

                    candidates.push(
                        child
                    );
                }
            }
        }

        // Remove duplicates.
        const unique =
            [...new Set(candidates)];

        return unique.sort(
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
    }

    // ============================================================
    // FIND CURRENT REMOVABLE MEMBER
    // ============================================================

    function findCurrentMember() {

        const containers = [
            ...document.querySelectorAll(
                '[aria-label^="Members list"]'
            ),
            ...document.querySelectorAll(
                '[data-testid="contacts-modal"]'
            ),
            ...document.querySelectorAll(
                '[role="dialog"]'
            )
        ];

        const items = [];

        for (
            const container of containers
        ) {

            items.push(
                ...container.querySelectorAll(
                    '[role="listitem"],' +
                    '[role="gridcell"]'
                )
            );
        }

        const uniqueItems =
            [...new Set(items)];

        for (
            const item of uniqueItems
        ) {

            const nameElement =
                [
                    ...item.querySelectorAll('*')
                ].find(el =>
                    el.getAttribute('title')
                );

            if (!nameElement) {
                continue;
            }

            let name =
                nameElement
                    .getAttribute('title')
                    ?.trim();

            if (!name) {
                continue;
            }

            // ----------------------------------------------------
            // Ignore obvious non-members
            // ----------------------------------------------------

            if (
                name === 'You' ||
                name === 'Add participants'
            ) {
                continue;
            }

            const r =
                nameElement.getBoundingClientRect();

            if (
                !r.width ||
                !r.height ||
                r.bottom < 0 ||
                r.top > window.innerHeight
            ) {
                continue;
            }

            return {
                name,
                element: nameElement
            };
        }

        return null;
    }

    // ============================================================
    // MASS REMOVAL
    // ============================================================

    let removed = 0;
    let failed = 0;
    let scrollAttempts = 0;
    let emptyAttempts = 0;

    const MAX_OPERATIONS = 5000;
    const MAX_SCROLL_ATTEMPTS = 2000;

    console.log(
        '============================================'
    );

    console.log(
        'STARTING MASS REMOVAL'
    );

    console.log(
        '============================================'
    );

    while (
        removed + failed <
            MAX_OPERATIONS &&
        scrollAttempts <
            MAX_SCROLL_ATTEMPTS
    ) {

        // --------------------------------------------------------
        // FIND A CURRENTLY VISIBLE MEMBER
        // --------------------------------------------------------

        const member =
            findCurrentMember();

        if (member) {

            scrollAttempts = 0;
            emptyAttempts = 0;

            console.log(
                `Removing #${removed + 1}:`,
                member.name
            );

            const success =
                await leftClick(
                    ACTION,
                    member.name
                );

            if (success) {

                removed++;

            } else {

                failed++;

                console.warn(
                    'Could not remove:',
                    member.name
                );

                // Give the UI a chance to recover.
                await sleep(
                    UPDATE_WAIT
                );
            }

            continue;
        }

        // --------------------------------------------------------
        // NO VISIBLE MEMBER
        // --------------------------------------------------------

        emptyAttempts++;

        const scroller =
            findMemberScroller();

        if (!scroller) {

            // There may simply be no members left.
            if (
                emptyAttempts >= 5
            ) {

                console.log(
                    'No member scroller/member found.'
                );

                break;
            }

            await sleep(
                UPDATE_WAIT
            );

            continue;
        }

        // --------------------------------------------------------
        // SCROLL DOWN
        // --------------------------------------------------------

        const maxTop =
            Math.max(
                0,
                scroller.scrollHeight -
                scroller.clientHeight
            );

        const oldTop =
            scroller.scrollTop;

        if (
            oldTop >=
            maxTop - 3
        ) {

            // ----------------------------------------------------
            // At bottom.
            //
            // Try a small upward movement and then back down.
            // This forces virtualized WhatsApp lists to refresh.
            // ----------------------------------------------------

            scroller.scrollTop =
                Math.max(
                    0,
                    oldTop - 200
                );

            await sleep(
                SCROLL_WAIT
            );

            scroller.scrollTop =
                maxTop;

            await sleep(
                SCROLL_WAIT
            );

            scrollAttempts++;

            if (
                scrollAttempts >= 10
            ) {

                console.log(
                    'Reached end of member list.'
                );

                break;
            }

        } else {

            const jump =
                Math.max(
                    250,
                    Math.floor(
                        scroller.clientHeight *
                        0.85
                    )
                );

            scroller.scrollTop =
                Math.min(
                    maxTop,
                    oldTop + jump
                );

            await sleep(
                SCROLL_WAIT
            );

            scrollAttempts++;
        }
    }

    // ============================================================
    // COMPLETE
    // ============================================================

    console.log(
        '============================================'
    );

    console.log(
        'MASS REMOVAL COMPLETE'
    );

    console.log(
        '============================================'
    );

    console.log(
        'Removed:',
        removed
    );

    console.log(
        'Failed:',
        failed
    );

    console.log(
        '============================================'
    );

})();
