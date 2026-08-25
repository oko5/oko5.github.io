function leftClick(action, memberName) {

    // ============================================================
    // SUPPORT:
    // leftClick("username")
    // leftClick("unadmin", "username")
    // leftClick("readmin", "username")
    // leftClick("remuser", "username")
    // ============================================================

    if (memberName === undefined) {
        memberName = action;
        action = null;
    }

    const target = [...document.querySelectorAll('[role="gridcell"]')]
        .find(el =>
            [...el.querySelectorAll('*')].some(child =>
                child.getAttribute('title') === memberName
            )
        );

    if (!target) {
        console.error(`Target "${memberName}" not found`);
        return;
    }

    const nameElement = [...target.querySelectorAll('*')]
        .find(child =>
            child.getAttribute('title') === memberName
        );

    if (!nameElement) {
        console.error(
            `Name element "${memberName}" not found`
        );
        return;
    }

    // ============================================================
    // CLICK HELPER
    // ============================================================

    function clickElement(element) {
        const rect = element.getBoundingClientRect();

        if (!rect.width || !rect.height) {
            console.error(
                'Element is not visible:',
                element
            );
            return false;
        }

        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const event = (
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

        event('mouseenter');
        event('mouseover');
        event('mousemove');
        event('mousedown', 0, 1, 1);
        event('mouseup', 0, 0, 1);
        event('click', 0, 0, 1);

        return true;
    }

    // ============================================================
    // FIRST CLICK — MEMBER
    // ============================================================

    clickElement(nameElement);

    console.log(
        'Left-clicked:',
        memberName,
        nameElement
    );

    // No action specified
    if (!action) {
        return;
    }

    // ============================================================
    // ACTION → MENU TEXT
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
    // FIND MENU ITEM
    // ============================================================

    let attempts = 0;
    const maxAttempts = 1;

    const findAndClickMenuItem = () => {
        attempts++;

        const candidates = [
            ...document.querySelectorAll('span')
        ]
            .filter(span =>
                span.textContent.trim() === menuText
            )
            .filter(span => {
                const rect = span.getBoundingClientRect();

                return (
                    rect.width > 0 &&
                    rect.height > 0 &&
                    rect.top >= 0 &&
                    rect.left >= 0
                );
            });

        if (!candidates.length) {
            if (attempts < maxAttempts) {
                setTimeout(
                    findAndClickMenuItem,
                    1
                );
            } else {
                console.error(
                    `"${menuText}" not found`
                );
            }

            return;
        }

        // Smallest visible exact-text span
        const menuElement = candidates
            .sort((a, b) => {
                const ar = a.getBoundingClientRect();
                const br = b.getBoundingClientRect();

                return (
                    ar.width * ar.height
                ) - (
                    br.width * br.height
                );
            })[0];

        console.log(
            `Found "${menuText}":`,
            menuElement
        );

        // Click the menu span itself
        clickElement(menuElement);

        console.log(
            `Clicked "${menuText}" for "${memberName}"`
        );
    };

    // Start looking shortly after member click
    setTimeout(
        findAndClickMenuItem,
        1
    );
}
leftClick("unadmin","oekoff")
