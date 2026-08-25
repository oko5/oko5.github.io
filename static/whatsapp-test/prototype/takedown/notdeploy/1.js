(async () => {
    console.clear();

    // ============================================================
    // CONFIG
    // ============================================================

    const ACTION = 'remuser';

    const VIEW_ALL_WAIT = 500;
    const MENU_WAIT = 25;
    const CONFIRM_WAIT = 25;
    const UPDATE_WAIT = 100;
    const SCROLL_WAIT = 100;

    // HARD LIMIT:
    // Each user can receive AT MOST 2 removal attempts.
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
    // CLICK ELEMENT
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
    }

    // ============================================================
    // RIGHT CLICK ELEMENT
    // ============================================================

    function rightClickElement(element) {

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

        dispatch('mouseenter');
        dispatch('mouseover');
        dispatch('mousemove');

        dispatch(
            'mousedown',
            2,
            2
        );

        dispatch(
            'mouseup',
            2,
            0
        );

        dispatch(
            'contextmenu',
            2,
            0
        );

        return true;
    }

    // ============================================================
    // VISIBLE EXACT TEXT
    // ============================================================

    function findVisibleText(text) {

        return [
            ...document.querySelectorAll('*')
        ]
            .filter(el =>
                el.textContent
                    .replace(/\s+/g, ' ')
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
                    r.top <= window.innerHeight &&
                    r.left <= window.innerWidth
                );
            })
            .sort((a, b) => {

                const ar =
                    a.getBoundingClientRect();

                const br =
                    b.getBoundingClientRect();

                return (
                    ar.width * ar.height
                ) - (
                    br.width * br.height
                );
            })[0] || null;
    }

    // ============================================================
    // FIND VIEW ALL / N MORE
    // ============================================================

    function findViewAll() {

        const elements =
            [
                ...document.querySelectorAll('*')
            ];

        return elements
            .filter(el => {

                const text =
                    el.textContent
                        .replace(/\s+/g, ' ')
                        .trim();

                return /^View all\s*\(\d+\s*more\)$/i
                    .test(text);
            })
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
            })
            .sort((a, b) => {

                const ar =
                    a.getBoundingClientRect();

                const br =
                    b.getBoundingClientRect();

                return (
                    ar.width * ar.height
                ) - (
                    br.width * br.height
                );
            })[0] || null;
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

    await sleep(
        VIEW_ALL_WAIT
    );

    // ============================================================
    // CLICK VIEW ALL IF IT EXISTS
    // ============================================================

    const viewAll =
        findViewAll();

    if (viewAll) {

        console.log(
            '============================================'
        );

        console.log(
            'VIEW ALL / N MORE FOUND'
        );

        console.log(
            viewAll.textContent
                .replace(/\s+/g, ' ')
                .trim()
        );

        console.log(
            'Opening complete member list...'
        );

        console.log(
            '============================================'
        );

        const viewAllButton =
            viewAll.closest(
                '[role="button"],' +
                '[role="link"],' +
                '[role="option"]'
            ) ||
            viewAll;

        if (
            !clickElement(
                viewAllButton
            )
        ) {

            console.error(
                'Could not click View all.'
            );

            return;
        }

        await sleep(
            VIEW_ALL_WAIT
        );

        console.log(
            'Complete member list opened.'
        );

    } else {

        console.log(
            'No View all (N more) found.'
        );

        console.log(
            'Using currently visible member list.'
        );
    }

    // ============================================================
    // FIND MEMBERS LIST
    // ============================================================

    function findMembersList() {

        return [
            ...document.querySelectorAll(
                '[role="list"]'
            )
        ].find(list =>
            list.querySelector(
                '[aria-label^="Members list:"]'
            )
        ) || null;
    }

    // ============================================================
    // FIND MEMBER
    // ============================================================

    function findMember(memberName) {

        const list =
            findMembersList();

        if (!list) {
            return null;
        }

        const items =
            [
                ...list.querySelectorAll(
                    '[role="listitem"]'
                )
            ];

        for (
            const item of items
        ) {

            const nameElement =
                [
                    ...item.querySelectorAll('*')
                ].find(el =>
                    el.getAttribute('title') ===
                    memberName
                );

            if (nameElement) {

                const rect =
                    nameElement.getBoundingClientRect();

                if (
                    rect.width > 0 &&
                    rect.height > 0
                ) {

                    return {
                        item,
                        nameElement
                    };
                }
            }
        }

        return null;
    }

    // ============================================================
    // RIGHT CLICK
    // ============================================================

    async function rightClick(
        action,
        memberName
    ) {

        // --------------------------------------------------------
        // SUPPORT:
        // rightClick("username")
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
            findMember(
                memberName
            );

        if (!found) {

            console.warn(
                `Member "${memberName}" not found or already removed.`
            );

            return false;
        }

        // --------------------------------------------------------
        // RIGHT CLICK
        // --------------------------------------------------------

        if (
            !rightClickElement(
                found.nameElement
            )
        ) {

            console.warn(
                `Could not right-click "${memberName}".`
            );

            return false;
        }

        console.log(
            `Right-clicked "${memberName}".`
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
        // WAIT FOR MENU ITEM
        // ========================================================

        let menuElement =
            null;

        for (
            let attempt = 0;
            attempt < 5;
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
        // CLICK REMOVE
        // ========================================================

        const menuButton =
            menuElement.closest(
                '[role="button"],' +
                '[role="menuitem"],' +
                '[role="option"]'
            ) ||
            menuElement.parentElement ||
            menuElement;

        if (
            !clickElement(
                menuButton
            )
        ) {

            console.warn(
                `Could not click "${menuText}" for "${memberName}".`
            );

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
                attempt < 40;
                attempt++
            ) {

                // ------------------------------------------------
                // FIRST: SEARCH DIALOG
                // ------------------------------------------------

                const dialogs =
                    [
                        ...document.querySelectorAll(
                            '[role="dialog"]'
                        )
                    ];

                for (
                    const dialog of dialogs
                ) {

                    const dialogRemove =
                        [
                            ...dialog.querySelectorAll(
                                'span, div, button'
                            )
                        ].find(el =>
                            el.textContent
                                .replace(/\s+/g, ' ')
                                .trim() === 'Remove'
                        );

                    if (dialogRemove) {

                        const r =
                            dialogRemove
                                .getBoundingClientRect();

                        if (
                            r.width > 0 &&
                            r.height > 0
                        ) {

                            confirmation =
                                dialogRemove;

                            break;
                        }
                    }
                }

                if (confirmation) {
                    break;
                }

                // ------------------------------------------------
                // FALLBACK SEARCH
                // ------------------------------------------------

                const candidates =
                    [
                        ...document.querySelectorAll(
                            'span, div, button'
                        )
                    ]
                    .filter(el =>
                        el.textContent
                            .replace(/\s+/g, ' ')
                            .trim() === 'Remove'
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

                confirmation =
                    candidates.find(el =>
                        el.closest(
                            '[role="dialog"]'
                        )
                    ) ||
                    candidates.find(el =>
                        el.classList.contains(
                            'html-span'
                        )
                    );

                if (confirmation) {
                    break;
                }

                await sleep(
                    CONFIRM_WAIT
                );
            }

            // ----------------------------------------------------
            // CONFIRMATION NOT FOUND
            // ----------------------------------------------------

            if (!confirmation) {

                console.warn(
                    `REMOVE CONFIRMATION NOT FOUND for "${memberName}".`
                );

                return false;
            }

            // ====================================================
            // CLICK CONFIRM REMOVE
            // ====================================================

            const confirmButton =
                confirmation.closest(
                    '[role="button"],' +
                    'button,' +
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

                console.warn(
                    `Could not click REMOVE confirmation for "${memberName}".`
                );

                return false;
            }

            console.log(
                `CONFIRMED REMOVE → "${memberName}"`
            );

            // ====================================================
            // VERIFY REMOVAL
            // ====================================================

            await sleep(
                UPDATE_WAIT
            );

            if (
                !findMember(
                    memberName
                )
            ) {

                console.log(
                    `VERIFIED REMOVED → "${memberName}"`
                );

                return true;
            }

            await sleep(
                UPDATE_WAIT
            );

            if (
                !findMember(
                    memberName
                )
            ) {

                console.log(
                    `VERIFIED REMOVED AFTER UPDATE → "${memberName}"`
                );

                return true;
            }

            console.warn(
                `"${memberName}" still appears in the member list.`
            );

            return false;
        }

        // ========================================================
        // READMIN
        // ========================================================

        if (
            action === 'readmin'
        ) {

            let confirmation =
                null;

            for (
                let i = 0;
                i < 30;
                i++
            ) {

                confirmation =
                    findVisibleText(
                        'Make group admin'
                    );

                if (confirmation) {
                    break;
                }

                await sleep(
                    CONFIRM_WAIT
                );
            }

            if (!confirmation) {
                return false;
            }

            const button =
                confirmation.closest(
                    '[role="button"],' +
                    'button,' +
                    '[role="menuitem"],' +
                    '[role="option"]'
                ) ||
                confirmation.parentElement ||
                confirmation;

            return clickElement(
                button
            );
        }

        // ========================================================
        // UNADMIN
        // ========================================================

        return true;
    }

    // ============================================================
    // FIND MEMBER SCROLLER
    // ============================================================

    function findMemberScroller() {

        const list =
            findMembersList();

        if (!list) {
            return null;
        }

        const candidates = [];

        let current =
            list;

        while (
            current &&
            current !== document.body
        ) {

            const style =
                getComputedStyle(
                    current
                );

            if (
                (
                    style.overflowY === 'auto' ||
                    style.overflowY === 'scroll' ||
                    style.overflowY === 'overlay'
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
            list.querySelectorAll('*')
        ) {

            const style =
                getComputedStyle(
                    element
                );

            if (
                (
                    style.overflowY === 'auto' ||
                    style.overflowY === 'scroll' ||
                    style.overflowY === 'overlay'
                ) &&
                element.scrollHeight >
                    element.clientHeight
            ) {

                candidates.push(
                    element
                );
            }
        }

        return [
            ...new Set(candidates)
        ].sort(
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
    // CONFIRMATION BEFORE MASS REMOVAL
    // ============================================================

    if (
        !window.confirm(
            'MASS MEMBER REMOVAL\n\n' +
            'The complete member list will be processed.\n\n' +
            'If "View all (N more)" exists, it will be opened first.\n\n' +
            'Each member gets a maximum of 2 removal attempts.\n\n' +
            'If a member no longer exists, that member is skipped immediately.\n\n' +
            'Continue?'
        )
    ) {

        console.log(
            'MASS REMOVAL CANCELLED.'
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

    const skipped =
        new Set();

    let removed = 0;
    let failed = 0;
    let operations = 0;
    let scrollAttempts = 0;
    let noMemberAttempts = 0;

    // ============================================================
    // NORMALIZE NAME
    // ============================================================

    function keyOf(name) {

        return name
            .replace(/\s+/g, ' ')
            .trim()
            .toLocaleLowerCase();
    }

    // ============================================================
    // GET ATTEMPTS
    // ============================================================

    function getAttempts(name) {

        return attempts.get(
            keyOf(name)
        ) || 0;
    }

    // ============================================================
    // RECORD ATTEMPT
    // ============================================================

    function recordAttempt(name) {

        const key =
            keyOf(name);

        const current =
            getAttempts(name);

        // --------------------------------------------------------
        // HARD STOP:
        // NEVER CREATE ATTEMPT #3
        // --------------------------------------------------------

        if (
            current >=
            MAX_ATTEMPTS_PER_USER
        ) {

            skipped.add(key);

            return current;
        }

        const next =
            current + 1;

        attempts.set(
            key,
            next
        );

        return next;
    }

    // ============================================================
    // GET NEXT VISIBLE MEMBER
    // ============================================================

    function getNextMember() {

        const list =
            findMembersList();

        if (!list) {
            return null;
        }

        const items =
            [
                ...list.querySelectorAll(
                    '[role="listitem"]'
                )
            ];

        for (
            const item of items
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

            const name =
                nameElement
                    .getAttribute('title')
                    ?.replace(
                        /\s+/g,
                        ' '
                    )
                    .trim();

            if (!name) {
                continue;
            }

            const key =
                keyOf(name);

            // ----------------------------------------------------
            // NEVER REMOVE YOURSELF
            // ----------------------------------------------------

            if (
                key === 'you'
            ) {
                continue;
            }

            // ----------------------------------------------------
            // ALREADY REMOVED
            // ----------------------------------------------------

            if (
                completed.has(key)
            ) {
                continue;
            }

            // ----------------------------------------------------
            // ALREADY SKIPPED
            // ----------------------------------------------------

            if (
                skipped.has(key)
            ) {
                continue;
            }

            // ----------------------------------------------------
            // HARD 2-ATTEMPT LIMIT
            // ----------------------------------------------------

            const used =
                getAttempts(name);

            if (
                used >=
                MAX_ATTEMPTS_PER_USER
            ) {

                skipped.add(key);

                console.warn(
                    `SKIP "${name}" → ${used}/2 attempts already used.`
                );

                continue;
            }

            // ----------------------------------------------------
            // MUST BE VISIBLE
            // ----------------------------------------------------

            const rect =
                nameElement
                    .getBoundingClientRect();

            if (
                !rect.width ||
                !rect.height ||
                rect.bottom < 0 ||
                rect.top >
                    window.innerHeight
            ) {

                continue;
            }

            return {
                name,
                key
            };
        }

        return null;
    }

    // ============================================================
    // MASS REMOVAL
    // ============================================================

    console.log(
        '============================================'
    );

    console.log(
        'STARTING MASS REMOVAL'
    );

    console.log(
        'VIEW ALL CHECK COMPLETE'
    );

    console.log(
        'MAX ATTEMPTS PER USER:',
        MAX_ATTEMPTS_PER_USER
    );

    console.log(
        '============================================'
    );

    while (
        operations <
        MAX_OPERATIONS
    ) {

        const member =
            getNextMember();

        // ========================================================
        // MEMBER FOUND
        // ========================================================

        if (member) {

            noMemberAttempts = 0;
            scrollAttempts = 0;

            const name =
                member.name;

            const key =
                member.key;

            // ----------------------------------------------------
            // ABSOLUTE PRE-CHECK
            // ----------------------------------------------------

            const beforeAttempts =
                getAttempts(name);

            if (
                beforeAttempts >=
                MAX_ATTEMPTS_PER_USER
            ) {

                skipped.add(key);

                console.warn(
                    `SKIP "${name}" → already reached 2 attempts.`
                );

                continue;
            }

            // ----------------------------------------------------
            // VERIFY USER STILL EXISTS
            // ----------------------------------------------------

            const exists =
                findMember(name);

            if (!exists) {

                skipped.add(key);

                console.log(
                    `SKIP "${name}" → user no longer exists.`
                );

                continue;
            }

            // ----------------------------------------------------
            // RECORD ONE ATTEMPT
            // ----------------------------------------------------

            const attempt =
                recordAttempt(name);

            // ----------------------------------------------------
            // SAFETY CHECK
            // ----------------------------------------------------

            if (
                attempt >
                MAX_ATTEMPTS_PER_USER
            ) {

                skipped.add(key);

                console.error(
                    `SAFETY STOP → "${name}" somehow exceeded 2 attempts.`
                );

                continue;
            }

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

            // ====================================================
            // EXECUTE REMOVE
            // ====================================================

            const success =
                await rightClick(
                    ACTION,
                    name
                );

            // ====================================================
            // SUCCESS
            // ====================================================

            if (success) {

                completed.add(key);

                removed++;

                console.log(
                    `SUCCESS → "${name}"`
                );

                await sleep(
                    UPDATE_WAIT
                );

                continue;
            }

            // ====================================================
            // FAILED
            // ====================================================

            console.warn(
                `FAILED → "${name}" attempt ${attempt}/2`
            );

            // ----------------------------------------------------
            // USER DISAPPEARED
            //
            // If it no longer exists, NEVER try again.
            // ----------------------------------------------------

            if (
                !findMember(name)
            ) {

                skipped.add(key);

                console.log(
                    `SKIP → "${name}" no longer exists.`
                );

                continue;
            }

            // ----------------------------------------------------
            // EXACTLY 2 ATTEMPTS USED
            // ----------------------------------------------------

            if (
                getAttempts(name) >=
                MAX_ATTEMPTS_PER_USER
            ) {

                skipped.add(key);

                failed++;

                console.warn(
                    `SKIP → "${name}" reached 2 attempts.`
                );

                continue;
            }

            // ----------------------------------------------------
            // ONLY POSSIBLE RETRY:
            // ATTEMPT 1 FAILED → ATTEMPT 2
            // ----------------------------------------------------

            await sleep(
                UPDATE_WAIT
            );

            continue;
        }

        // ========================================================
        // NO VISIBLE MEMBER
        // ========================================================

        noMemberAttempts++;

        const scroller =
            findMemberScroller();

        if (!scroller) {

            if (
                noMemberAttempts >= 10
            ) {

                console.log(
                    'Member list/scroller no longer found.'
                );

                break;
            }

            await sleep(
                UPDATE_WAIT
            );

            continue;
        }

        // ========================================================
        // SCROLLER POSITION
        // ========================================================

        const maxTop =
            Math.max(
                0,
                scroller.scrollHeight -
                scroller.clientHeight
            );

        const currentTop =
            scroller.scrollTop;

        // ========================================================
        // BOTTOM
        // ========================================================

        if (
            currentTop >=
            maxTop - 3
        ) {

            await sleep(
                SCROLL_WAIT
            );

            // Small reverse movement allows virtualized
            // members to refresh.

            scroller.scrollTop =
                Math.max(
                    0,
                    currentTop - 200
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
                    '============================================'
                );

                console.log(
                    'END OF MEMBER LIST REACHED'
                );

                console.log(
                    '============================================'
                );

                break;
            }

            continue;
        }

        // ========================================================
        // NORMAL SCROLL
        // ========================================================

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
        'Failed after 2 attempts:',
        failed
    );

    console.log(
        'Skipped:',
        skipped.size
    );

    console.log(
        'Operations:',
        operations
    );

    console.log(
        '============================================'
    );

    console.table(
        [
            ...attempts.entries()
        ].map(
            ([name, count]) => ({
                name,
                attempts: count,
                status:
                    completed.has(name)
                        ? 'REMOVED'
                        : count >= 2
                            ? 'SKIPPED AFTER 2 ATTEMPTS'
                            : 'SKIPPED / FAILED'
            })
        )
    );

})();
