function rightClick(action, memberName) {

    // ============================================================
    // SUPPORT:
    // rightClick("username")
    // rightClick("unadmin", "username")
    // rightClick("readmin", "username")
    // rightClick("remuser", "username")
    // ============================================================

    if (memberName === undefined) {
        memberName = action;
        action = null;
    }

    const list = [...document.querySelectorAll('[role="list"]')]
        .find(list =>
            list.querySelector('[aria-label^="Members list:"]')
        );

    if (!list) {
        console.error('Members list not found');
        return;
    }

    const member = [...list.querySelectorAll('[role="listitem"]')]
        .find(item =>
            [...item.querySelectorAll('*')].some(el =>
                el.getAttribute('title') === memberName
            )
        );

    if (!member) {
        console.error(`Member "${memberName}" not found`);
        return;
    }

    const nameElement = [...member.querySelectorAll('*')]
        .find(el =>
            el.getAttribute('title') === memberName
        );

    if (!nameElement) {
        console.error(`Name element "${memberName}" not found`);
        return;
    }

    // ============================================================
    // LEFT CLICK HELPER
    // ============================================================

    function leftClick(element) {
        const rect = element.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            console.error('Element is not visible:', element);
            return false;
        }

        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const dispatch = (
            type,
            button = 0,
            buttons = 0,
            detail = 1
        ) => {
            element.dispatchEvent(new MouseEvent(type, {
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
            }));
        };

        dispatch('mouseenter');
        dispatch('mouseover');
        dispatch('mousemove');
        dispatch('mousedown', 0, 1, 1);
        dispatch('mouseup', 0, 0, 1);
        dispatch('click', 0, 0, 1);

        return true;
    }

    // ============================================================
    // RIGHT CLICK MEMBER
    // ============================================================

    const rect = nameElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const dispatchRight = (
        type,
        button = 0,
        buttons = 0
    ) => {
        nameElement.dispatchEvent(new MouseEvent(type, {
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
        }));
    };

    dispatchRight('mouseenter');
    dispatchRight('mouseover');
    dispatchRight('mousemove');
    dispatchRight('mousedown', 2, 2);
    dispatchRight('mouseup', 2, 0);
    dispatchRight('contextmenu', 2, 0);

    console.log(
        'Right-clicked:',
        memberName,
        action ? `(action: ${action})` : ''
    );

    // No action = only right-click
    if (!action) {
        return;
    }

    // ============================================================
    // ACTION → FIRST MENU TEXT
    // ============================================================

    const menuText = {
        unadmin: 'Dismiss as admin',
        readmin: 'Make group admin',
        remuser: 'Remove'
    }[action];

    if (!menuText) {
        console.error(
            `Unknown action "${action}". ` +
            `Supported: unadmin, readmin, remuser`
        );
        return;
    }

    // ============================================================
    // FIND VISIBLE EXACT TEXT
    // ============================================================

    const findVisibleText = (text) => {
        return [...document.querySelectorAll('*')]
            .filter(el =>
                el.textContent.trim() === text
            )
            .filter(el => {
                const r = el.getBoundingClientRect();

                return (
                    r.width > 0 &&
                    r.height > 0 &&
                    r.top >= 0 &&
                    r.left >= 0
                );
            })
            .sort((a, b) => {
                const ar = a.getBoundingClientRect();
                const br = b.getBoundingClientRect();

                return (
                    ar.width * ar.height
                ) - (
                    br.width * br.height
                );
            })[0];
    };

    // ============================================================
    // CLICK FIRST MENU ACTION
    // ============================================================

    let attempts = 0;
    const maxAttempts = 10;

    const clickFirstMenuAction = () => {
        attempts++;

        const textElement = findVisibleText(menuText);

        if (!textElement) {
            if (attempts < maxAttempts) {
                setTimeout(
                    clickFirstMenuAction,
                    1
                );
            } else {
                console.error(
                    `"${menuText}" not found`
                );
            }

            return;
        }

        console.log(
            `Found first "${menuText}":`,
            textElement
        );

        const clickable =
            textElement.closest(
                '[role="button"], [role="menuitem"], [role="option"]'
            ) ||
            textElement.parentElement ||
            textElement;

        leftClick(clickable);

        console.log(
            `Clicked first "${menuText}" for "${memberName}"`
        );

        // ========================================================
        // READMIN → CONFIRM "MAKE GROUP ADMIN"
        // ========================================================

        if (action === 'readmin') {
            clickReadminConfirmation();
        }

        // ========================================================
        // REMUSER → CONFIRM "REMOVE"
        // ========================================================

        if (action === 'remuser') {
            clickRemoveConfirmation();
        }
    };

    // ============================================================
    // READMIN CONFIRMATION
    // ============================================================

    const clickReadminConfirmation = () => {
        let confirmAttempts = 0;
        const maxConfirmAttempts = 10;

        const findConfirmation = () => {
            confirmAttempts++;

            const candidates = [...document.querySelectorAll('span')]
                .filter(span =>
                    span.textContent.trim() === 'Make group admin'
                )
                .filter(span => {
                    const r = span.getBoundingClientRect();

                    return (
                        r.width > 0 &&
                        r.height > 0 &&
                        r.top >= 0 &&
                        r.left >= 0
                    );
                });

            const confirmation =
                candidates.find(span =>
                    span.classList.contains('html-span')
                ) || candidates[0];

            if (!confirmation) {
                if (confirmAttempts < maxConfirmAttempts) {
                    setTimeout(
                        findConfirmation,
                        10
                    );
                } else {
                    console.error(
                        'Confirmation "Make group admin" not found'
                    );
                }

                return;
            }

            console.log(
                'Found confirmation "Make group admin":',
                confirmation
            );

            const clickable =
                confirmation.closest(
                    '[role="button"], [role="menuitem"], [role="option"]'
                ) ||
                confirmation.parentElement ||
                confirmation;

            leftClick(clickable);

            console.log(
                `Confirmed "Make group admin" for "${memberName}"`
            );
        };

        setTimeout(
            findConfirmation,
            1
        );
    };

    // ============================================================
    // REMUSER CONFIRMATION
    // ============================================================

    const clickRemoveConfirmation = () => {
        let confirmAttempts = 0;
        const maxConfirmAttempts = 10;

        const findRemoveConfirmation = () => {
            confirmAttempts++;

            const candidates = [...document.querySelectorAll('span')]
                .filter(span =>
                    span.textContent.trim() === 'Remove'
                )
                .filter(span => {
                    const r = span.getBoundingClientRect();

                    return (
                        r.width > 0 &&
                        r.height > 0 &&
                        r.top >= 0 &&
                        r.left >= 0
                    );
                });

            /*
             * Prefer the confirmation span with "html-span".
             * The confirmation element you provided is:
             *
             * <span class="html-span ...">
             *     Remove
             * </span>
             */

            const confirmation =
                candidates.find(span =>
                    span.classList.contains('html-span')
                ) || candidates[0];

            if (!confirmation) {
                if (confirmAttempts < maxConfirmAttempts) {
                    setTimeout(
                        findRemoveConfirmation,
                        50
                    );
                } else {
                    console.error(
                        'Confirmation "Remove" not found'
                    );
                }

                return;
            }

            console.log(
                'Found confirmation "Remove":',
                confirmation
            );

            const clickable =
                confirmation.closest(
                    '[role="button"], [role="menuitem"], [role="option"]'
                ) ||
                confirmation.parentElement ||
                confirmation;

            leftClick(clickable);

            console.log(
                `Confirmed "Remove" for "${memberName}"`
            );
        };

        setTimeout(
            findRemoveConfirmation,
            1
        );
    };

    // ============================================================
    // START
    // ============================================================

    clickFirstMenuAction();
}
rightClick("readmin","oekoff");
