(async () => {
    console.clear();

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    /*
     * ============================================================
     * 1. INITIAL SCAN
     * ============================================================
     */

    const members = document.querySelectorAll(
        '[aria-label^="Members list"] [role="listitem"]'
    );

    const result = {
        adminRightClickElement: [],
        memberRightClickElement: [],
        contacts: []
    };

    members.forEach(member => {
        const element = member.querySelector(
            '[data-testid="cell-frame-title"] span[dir="auto"]'
        );

        if (!element) return;

        const name = element.textContent.trim();

        const data = {
            name,
            element: element.outerHTML
        };

        if (member.querySelector('[data-testid="group-admin-marker"]')) {
            result.adminRightClickElement.push(data);
        } else if (name !== 'You') {
            result.memberRightClickElement.push(data);
        }
    });


    /*
     * ============================================================
     * 2. FIND "VIEW ALL (NUMBER MORE)"
     * ============================================================
     */

    const viewAllText = Array.from(
        document.querySelectorAll('div')
    ).find(el => {
        const text = el.textContent.trim();

        return /^View all \(\d+ more\)$/.test(text);
    });

    if (!viewAllText) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }


    /*
     * ============================================================
     * 3. FIND PARENT BUTTON
     * ============================================================
     */

    const viewAllButton =
        viewAllText.closest('[role="button"]');

    if (!viewAllButton) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }


    /*
     * ============================================================
     * 4. CLICK VIEW ALL
     * ============================================================
     */

    viewAllButton.click();

    await sleep(500);


    /*
     * ============================================================
     * 5. FIND CONTACTS MODAL
     * ============================================================
     */

    const modal =
        document.querySelector(
            '[data-testid="contacts-modal"]'
        );

    if (!modal) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }


    /*
     * ============================================================
     * 6. FIND ACTUAL SCROLLABLE CONTAINER
     * ============================================================
     */

    const firstItem =
        modal.querySelector('[role="listitem"]');

    if (!firstItem) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }

    let scrollContainer =
        firstItem.parentElement;

    while (
        scrollContainer &&
        scrollContainer !== modal
    ) {
        if (
            scrollContainer.scrollHeight >
            scrollContainer.clientHeight
        ) {
            break;
        }

        scrollContainer =
            scrollContainer.parentElement;
    }

    if (
        !scrollContainer ||
        scrollContainer.scrollHeight <=
        scrollContainer.clientHeight
    ) {
        console.log(JSON.stringify(result, null, 2));
        return;
    }


    /*
     * ============================================================
     * 7. SCAN CONTACTS
     * ============================================================
     */

    const seen = new Set();

    const scan = () => {

        const items =
            modal.querySelectorAll(
                '[role="listitem"]'
            );

        items.forEach(item => {

            const nameElement =
                item.querySelector('span[title]');

            if (!nameElement) return;

            const name =
                nameElement.getAttribute('title') ||
                nameElement.textContent?.trim() ||
                '(name not found)';

            if (name === 'You') return;


            /*
             * Find gridcell.
             */

            const targetElement =
                nameElement.closest(
                    '[role="gridcell"]'
                );

            if (!targetElement) return;


            /*
             * EXACTLY 3 LEVELS UP.
             */

            const parentAncestor =
                targetElement.parentElement
                    ?.parentElement
                    ?.parentElement;


            /*
             * Use HTML strings for JSON compatibility.
             */

            const key =
                name +
                '|' +
                targetElement.outerHTML;

            if (seen.has(key)) return;

            seen.add(key);


            /*
             * Store EVERYTHING as JSON-safe strings.
             */

            result.contacts.push({
                name: name,
                targetGridcell: targetElement.outerHTML,
                parentAncestor3Levels: parentAncestor
                    ? parentAncestor.outerHTML
                    : null
            });
        });
    };


    /*
     * ============================================================
     * 8. INITIAL CONTACT SCAN
     * ============================================================
     */

    scan();


    /*
     * ============================================================
     * 9. SCROLL THROUGH CONTACTS
     * ============================================================
     */

    let unchangedRounds = 0;
    let lastScrollTop = -1;

    for (let i = 0; i < 1000; i++) {

        scan();

        const before =
            seen.size;

        const oldPosition =
            scrollContainer.scrollTop;

        scrollContainer.scrollBy({
            top: 500,
            left: 0,
            behavior: 'instant'
        });

        await sleep(100);

        scan();

        const after =
            seen.size;

        if (after === before) {
            unchangedRounds++;
        } else {
            unchangedRounds = 0;
        }

        const newPosition =
            scrollContainer.scrollTop;

        if (newPosition === oldPosition) {
            unchangedRounds++;
        }

        const atBottom =
            scrollContainer.scrollTop +
                scrollContainer.clientHeight >=
            scrollContainer.scrollHeight - 5;

        if (
            atBottom &&
            unchangedRounds >= 3
        ) {
            break;
        }

        if (
            scrollContainer.scrollTop ===
            lastScrollTop
        ) {
            unchangedRounds++;
        } else {
            lastScrollTop =
                scrollContainer.scrollTop;
        }

        if (unchangedRounds >= 10) {
            break;
        }
    }


    /*
     * ============================================================
     * 10. FINAL SCAN
     * ============================================================
     */

    scan();


    /*
     * ============================================================
     * 11. LOG ONE COMPLETE JSON OBJECT
     * ============================================================
     */

    console.log(
        result
    );

})();
