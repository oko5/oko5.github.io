(async () => {
    console.clear();

    // ============================================================
    // CONFIG
    // ============================================================

    const ACTION = 'remuser';

    const MENU_WAIT = 25;
    const UPDATE_WAIT = 75;
    const SCROLL_WAIT = 75;

    const MAX_ATTEMPTS_PER_USER = 2;
    const MAX_OPERATIONS = 5000;
    const MAX_SCROLL_ATTEMPTS = 2000;

    // ============================================================
    // SLEEP
    // ============================================================

    const sleep = ms =>
        new Promise(resolve =>
            setTimeout(resolve, ms)
        );

    // ============================================================
    // FAST LEFT CLICK
    // ============================================================

    function clickElement(element) {

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

        fire(
            'mousedown',
            0,
            1
        );

        fire(
            'mouseup',
            0,
            0
        );

        fire(
            'click',
            0,
            0
        );

        return true;
    }

    // ============================================================
    // FIND VISIBLE EXACT TEXT
    // ============================================================

    function findVisibleText(text) {

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
                        r.bottom >= 0 &&
                        r.right >= 0 &&
                        r.top <=
                            window.innerHeight &&
                        r.left <=
                            window.innerWidth
                    );
                });

        if (!elements.length) {
            return null;
        }

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
    }

    // ============================================================
    // FIND MEMBER
    // ============================================================

    function findMemberElement(memberName) {

        const titleMatches = [
            ...document.querySelectorAll(
                '[title]'
            )
        ].filter(el =>
            el.getAttribute('title') ===
            memberName
        );

        // --------------------------------------------------------
        // Prefer member-list elements
        // --------------------------------------------------------

        for (
            const element of titleMatches
        ) {

            const memberContainer =
                element.closest(
                    '[role="listitem"],' +
                    '[role="gridcell"]'
                );

            if (
                memberContainer &&
                (
                    memberContainer.closest(
                        '[aria-label^="Members list"]'
                    ) ||
                    memberContainer.closest(
                        '[data-testid="contacts-modal"]'
                    ) ||
                    memberContainer.closest(
                        '[role="dialog"]'
                    )
                )
            ) {

                return {
                    container:
                        memberContainer,

                    nameElement:
                        element
                };
            }
        }

        // --------------------------------------------------------
        // Fallback
        // --------------------------------------------------------

        for (
            const element of titleMatches
        ) {

            const rect =
                element.getBoundingClientRect();

            if (
                rect.width &&
                rect.height &&
                rect.bottom >= 0 &&
                rect.top <=
                    window.innerHeight
            ) {

                return {
                    container:
                        element.closest(
                            '[role="listitem"],' +
                            '[role="gridcell"]'
                        ) ||
                        element,

                    nameElement:
                        element
                };
            }
        }

        return null;
    }

    // ============================================================
    // LEFT CLICK
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
        // SUPPORT leftClick("username")
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

        const found =
            findMemberElement(
                memberName
            );

        if (!found) {

            console.warn(
                `Member "${memberName}" does not exist or is not visible.`
            );

            return false;
        }

        const nameElement =
            found.nameElement;

        // --------------------------------------------------------
        // CLICK MEMBER
        // --------------------------------------------------------

        if (
            !clickElement(
                nameElement
            )
        ) {

            return false;
        }

        console.log(
            'Clicked member:',
            memberName
        );

        // --------------------------------------------------------
        // NO ACTION
        // --------------------------------------------------------

        if (!action) {
            return true;
        }

        // ========================================================
        // ACTION MENU
        // ========================================================

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
                `Unknown action "${action}".`
            );

            return false;
        }

        // ========================================================
        // WAIT FOR MENU
        // ========================================================

        let menuElement = null;

        for (
            let attempt = 0;
            attempt < 20;
            attempt++
        ) {

            menuElement =
                findVisibleText(
                    menuText
                );

            if (menuElement) {
                break;
            }

            await sleep(
                MENU_WAIT
            );
        }

        if (!menuElement) {

            console.warn(
                `"${menuText}" menu item not found for "${memberName}".`
            );

            return false;
        }

        // ========================================================
        // CLICK MENU ITEM
        // ========================================================

        const menuButton =
            menuElement.closest(
                '[role="menuitem"],' +
                '[role="option"],' +
                '[role="button"]'
            ) ||
            menuElement.parentElement ||
            menuElement;

        if (
            !clickElement(
                menuButton
            )
        ) {

            return false;
        }

        console.log(
            `Clicked "${menuText}" for "${memberName}".`
        );

        // ========================================================
        // REMOVE CONFIRMATION
        // ========================================================

        if (
            action === 'remuser'
        ) {

            let confirmation =
                null;

            for (
                let attempt = 0;
                attempt < 30;
                attempt++
            ) {

                const candidates =
                    [
                        ...document.querySelectorAll(
                            '*'
                        )
                    ]
                    .filter(el =>
                        el.textContent
                            .trim() ===
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

                // Prefer dialog confirmation.
                confirmation =
                    candidates.find(
                        el =>
                            el.closest(
                                '[role="dialog"]'
                            )
                    );

                if (!confirmation) {

                    confirmation =
                        candidates.find(
                            el =>
                                el.closest(
                                    '[role="button"]'
                                )
                        );
                }

                if (!confirmation) {
                    confirmation =
                        candidates[0];
                }

                if (confirmation) {
                    break;
                }

                await sleep(
                    MENU_WAIT
                );
            }

            if (!confirmation) {

                console.warn(
                    `Remove confirmation not found for "${memberName}".`
                );

                return false;
            }

            const confirmButton =
                confirmation.closest(
                    '[role="button"],' +
                    '[role="menuitem"],' +
                    '[role="option"]'
                ) ||
                confirmation.parentElement ||
                confirmation;

            if (
                !clickElement(
                    confirmButton
                )
            ) {

                return false;
            }

            console.log(
                `Confirmed REMOVE for "${memberName}".`
            );

            await sleep(
                UPDATE_WAIT
            );

            // ----------------------------------------------------
            // Verify member disappeared.
            // ----------------------------------------------------

            const stillThere =
                findMemberElement(
                    memberName
                );

            if (!stillThere) {

                console.log(
                    `Verified removed: "${memberName}".`
                );

                return true;
            }

            // WhatsApp may need another React update.
            await sleep(
                UPDATE_WAIT
            );

            const stillThereAgain =
                findMemberElement(
                    memberName
                );

            if (!stillThereAgain) {

                console.log(
                    `Verified removed after update: "${memberName}".`
                );

                return true;
            }

            console.warn(
                `"${memberName}" still appears in the DOM.`
            );

            return false;
        }

        // ========================================================
        // READMIN
        // ========================================================

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

            const button =
                confirmation.closest(
                    '[role="button"],' +
                    '[role="menuitem"],' +
                    '[role="option"]'
                ) ||
                confirmation.parentElement ||
                confirmation;

            clickElement(
                button
            );

            return true;
        }

        // ========================================================
        // UNADMIN
        // ========================================================

        return true;
    }

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

    const headerButton =
        header.firstElementChild
            ?.children[1];

    if (!headerButton) {

        console.error(
            'Group header button not found.'
        );

        return;
    }

    clickElement(
        headerButton
    );

    await sleep(500);

    // ============================================================
    // FIND VIEW ALL
    // ============================================================

    function findViewAll() {

        return [
            ...document.querySelectorAll('*')
        ].find(el => {

            const text =
                el.textContent
                    .replace(/\s+/g, ' ')
                    .trim();

            return /^View all \(\d+ more\)$/i
                .test(text);
        });
    }

    const viewAll =
        findViewAll();

    // ============================================================
    // OPEN VIEW ALL IF PRESENT
    // ============================================================

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
            '============================================'
        );

        const button =
            viewAll.closest(
                '[role="button"]'
            ) ||
            viewAll;

        clickElement(
            button
        );

        await sleep(500);

        console.log(
            'View all opened.'
        );

    } else {

        console.log(
            'View all not found. Using current member list.'
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
                const element of
                root.querySelectorAll('*')
            ) {

                const style =
                    getComputedStyle(
                        element
                    );

                const overflow =
                    style.overflowY;

                if (
                    (
                        overflow === 'auto' ||
                        overflow === 'scroll' ||
                        overflow === 'overlay'
                    ) &&
                    element.scrollHeight >
                        element.clientHeight
                ) {

                    candidates.push(
                        element
                    );
                }
            }
        }

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
    // CONFIRMATIONS
    // ============================================================

    if (!window.confirm(
        'MASS MEMBER REMOVAL\n\n' +
        'The script will remove members from this group.\n\n' +
        'Each individual member gets a maximum of 2 attempts.\n\n' +
        'Already removed/non-existent members will be skipped.\n\n' +
        'Continue?'
    )) {

        console.log(
            'STOPPED: Confirmation 1.'
        );

        return;
    }

    if (!window.confirm(
        'CONFIRMATION 2 OF 3\n\n' +
        'The script will automatically process the member list.\n\n' +
        'Maximum attempts per member: 2\n' +
        'Failed members will be skipped.'
    )) {

        console.log(
            'STOPPED: Confirmation 2.'
        );

        return;
    }

    if (!window.confirm(
        'FINAL CONFIRMATION 3 OF 3\n\n' +
        'START MASS REMOVAL NOW?\n\n' +
        '2 attempts maximum per member.'
    )) {

        console.log(
            'STOPPED: Confirmation 3.'
        );

        return;
    }

    // ============================================================
    // TRACKING
    // ============================================================

    const attempts =
        new Map();

    const completed =
        new Set();

    const permanentlySkipped =
        new Set();

    let removed = 0;
    let failed = 0;
    let skipped = 0;

    let operations = 0;
    let scrollAttempts = 0;
    let noMemberCount = 0;

    // ============================================================
    // GET ATTEMPTS
    // ============================================================

    function getAttempts(name) {

        return attempts.get(
            name.toLocaleLowerCase()
        ) || 0;
    }

    // ============================================================
    // RECORD ATTEMPT
    // ============================================================

    function recordAttempt(name) {

        const key =
            name.toLocaleLowerCase();

        const value =
            getAttempts(name) + 1;

        attempts.set(
            key,
            value
        );

        return value;
    }

    // ============================================================
    // MAIN REMOVAL LOOP
    // ============================================================

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
        operations <
            MAX_OPERATIONS
    ) {

        // --------------------------------------------------------
        // FIND NEXT MEMBER
        // --------------------------------------------------------

        const member =
            (() => {

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

                const seenElements =
                    new Set();

                for (
                    const container of containers
                ) {

                    const items =
                        container.querySelectorAll(
                            '[role="listitem"],' +
                            '[role="gridcell"]'
                        );

                    for (
                        const item of items
                    ) {

                        if (
                            seenElements.has(item)
                        ) {
                            continue;
                        }

                        seenElements.add(item);

                        const nameElement =
                            [
                                ...item.querySelectorAll(
                                    '[title]'
                                )
                            ].find(el =>
                                el.getAttribute(
                                    'title'
                                )
                            );

                        if (!nameElement) {
                            continue;
                        }

                        const name =
                            nameElement
                                .getAttribute(
                                    'title'
                                )
                                ?.replace(
                                    /\s+/g,
                                    ' '
                                )
                                .trim();

                        if (!name) {
                            continue;
                        }

                        const key =
                            name.toLocaleLowerCase();

                        // Never process yourself.
                        if (
                            key === 'you'
                        ) {
                            continue;
                        }

                        // Already completed.
                        if (
                            completed.has(key)
                        ) {
                            continue;
                        }

                        // Already permanently skipped.
                        if (
                            permanentlySkipped.has(
                                key
                            )
                        ) {
                            continue;
                        }

                        // Two attempts already used.
                        if (
                            getAttempts(name) >=
                            MAX_ATTEMPTS_PER_USER
                        ) {

                            permanentlySkipped.add(
                                key
                            );

                            skipped++;

                            console.warn(
                                `SKIP "${name}" — maximum attempts reached.`
                            );

                            continue;
                        }

                        const rect =
                            nameElement
                                .getBoundingClientRect();

                        if (
                            !rect.width ||
                            !rect.height ||
                            rect.bottom < 0 ||
                            rect.top >
                                window.innerHeight ||
                            rect.right < 0 ||
                            rect.left >
                                window.innerWidth
                        ) {
                            continue;
                        }

                        return {
                            name,
                            key
                        };
                    }
                }

                return null;
            })();

        // ========================================================
        // MEMBER FOUND
        // ========================================================

        if (member) {

            noMemberCount = 0;
            scrollAttempts = 0;

            const name =
                member.name;

            const key =
                member.key;

            const attempt =
                recordAttempt(name);

            operations++;

            console.log(
                '--------------------------------------------'
            );

            console.log(
                `USER: ${name}`
            );

            console.log(
                `ATTEMPT: ${attempt}/${MAX_ATTEMPTS_PER_USER}`
            );

            // ----------------------------------------------------
            // REMOVE
            // ----------------------------------------------------

            const success =
                await leftClick(
                    ACTION,
                    name
                );

            // ----------------------------------------------------
            // SUCCESS
            // ----------------------------------------------------

            if (success) {

                completed.add(
                    key
                );

                removed++;

                console.log(
                    `SUCCESS → ${name}`
                );

                await sleep(
                    UPDATE_WAIT
                );

                continue;
            }

            // ----------------------------------------------------
            // FAILED
            // ----------------------------------------------------

            console.warn(
                `FAILED ATTEMPT ${attempt}/${MAX_ATTEMPTS_PER_USER}:`,
                name
            );

            // ----------------------------------------------------
            // MAX 2 ATTEMPTS
            // ----------------------------------------------------

            if (
                attempt >=
                MAX_ATTEMPTS_PER_USER
            ) {

                permanentlySkipped.add(
                    key
                );

                failed++;

                console.warn(
                    `SKIPPING "${name}" after 2 attempts.`
                );

                await sleep(
                    UPDATE_WAIT
                );

                continue;
            }

            // ----------------------------------------------------
            // ALLOW UI TO UPDATE BEFORE SECOND ATTEMPT
            // ----------------------------------------------------

            await sleep(
                UPDATE_WAIT
            );

            continue;
        }

        // ========================================================
        // NO VISIBLE MEMBER
        // ========================================================

        noMemberCount++;

        const scroller =
            findMemberScroller();

        if (!scroller) {

            if (
                noMemberCount >= 8
            ) {

                console.log(
                    'No member list/scroller found.'
                );

                break;
            }

            await sleep(
                UPDATE_WAIT
            );

            continue;
        }

        // ========================================================
        // SCROLL
        // ========================================================

        const maxTop =
            Math.max(
                0,
                scroller.scrollHeight -
                scroller.clientHeight
            );

        const currentTop =
            scroller.scrollTop;

        // --------------------------------------------------------
        // AT BOTTOM
        // --------------------------------------------------------

        if (
            currentTop >=
            maxTop - 3
        ) {

            // Let the virtualized list update.
            await sleep(
                SCROLL_WAIT
            );

            // Small upward movement.
            scroller.scrollTop =
                Math.max(
                    0,
                    currentTop - 250
                );

            await sleep(
                SCROLL_WAIT
            );

            // Return to bottom.
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
                    'Reached the end of the member list.'
                );

                break;
            }

            continue;
        }

        // --------------------------------------------------------
        // NORMAL SCROLL
        // --------------------------------------------------------

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
                currentTop + jump
            );

        await sleep(
            SCROLL_WAIT
        );

        scrollAttempts++;
    }

    // ============================================================
    // FINAL REPORT
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
        'Skipped:',
        skipped
    );

    console.log(
        'Operations:',
        operations
    );

    console.log(
        '============================================'
    );

    console.log(
        'PER-USER ATTEMPTS'
    );

    console.table(
        [...attempts.entries()]
            .map(
                ([name, count]) => ({
                    name,
                    attempts: count,
                    status:
                        completed.has(name)
                            ? 'REMOVED'
                            : 'SKIPPED/FAILED'
                })
            )
    );

})();
