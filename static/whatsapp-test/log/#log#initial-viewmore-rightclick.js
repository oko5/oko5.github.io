(async () => {
    console.clear();

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    /*
     * ============================================================
     * 1. INITIAL SCAN — PRESERVED
     * ============================================================
     */

    const members = document.querySelectorAll(
        '[aria-label^="Members list"] [role="listitem"]'
    );

    const result = {
        adminRightClickElement: [],
        memberRightClickElement: []
    };

    members.forEach(member => {
        const element = member.querySelector(
            '[data-testid="cell-frame-title"] span[dir="auto"]'
        );

        if (!element) return;

        const name = element.textContent.trim();

        const data = {
            name,
            element
        };

        if (member.querySelector('[data-testid="group-admin-marker"]')) {
            result.adminRightClickElement.push(data);
        } else if (name !== 'You') {
            result.memberRightClickElement.push(data);
        }
    });

    console.log('Actual JSON-style result:', result);

    console.log(
        'Admin right click elements:',
        result.adminRightClickElement
    );

    console.log(
        'Member right click elements:',
        result.memberRightClickElement
    );


    /*
     * ============================================================
     * 2. FIND "VIEW ALL (NUMBER MORE)" AUTOMATICALLY
     * ============================================================
     *
     * Does NOT depend on:
     * - changing number
     * - changing CSS classes
     *
     * Matches:
     * View all (127 more)
     * View all (150 more)
     * View all (1 more)
     * etc.
     */

    const viewAllText = Array.from(
        document.querySelectorAll('div')
    ).find(el => {
        const text = el.textContent.trim();

        return /^View all \(\d+ more\)$/.test(text);
    });

    if (!viewAllText) {
        console.log(
            'View all (NUMBER more) element not found.'
        );
        return;
    }

    console.log(
        'View all text element found:',
        viewAllText
    );


    /*
     * ============================================================
     * 3. AUTOMATICALLY FIND ITS PARENT BUTTON
     * ============================================================
     */

    const viewAllButton =
        viewAllText.closest('[role="button"]');

    if (!viewAllButton) {
        console.error(
            'Parent [role="button"] of View all element not found.'
        );
        return;
    }

    console.log(
        'Auto-found parent button:',
        viewAllButton
    );


    /*
     * ============================================================
     * 4. CLICK PARENT BUTTON
     * ============================================================
     */

    viewAllButton.click();

    console.log(
        'View all parent button clicked.'
    );


    /*
     * Wait for expanded contacts list.
     */

    await sleep(500);


    /*
     * ============================================================
     * 5. FIND ACTUAL SCROLLABLE CONTACTS CONTAINER
     * ============================================================
     */

    const modal =
        document.querySelector(
            '[data-testid="contacts-modal"]'
        );

    if (!modal) {
        console.error(
            'Contacts modal ([data-testid="contacts-modal"]) not found.'
        );
        return;
    }

    const firstItem =
        modal.querySelector('[role="listitem"]');

    if (!firstItem) {
        console.error(
            'No [role="listitem"] found inside contacts modal.'
        );
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
        console.error(
            'Actual scrollable contacts container not found.'
        );
        return;
    }

    console.log(
        'Scroll container:',
        scrollContainer
    );

    console.log(
        'Scroll height:',
        scrollContainer.scrollHeight,
        'Client height:',
        scrollContainer.clientHeight
    );


    /*
     * ============================================================
     * 6. SCAN CONTACTS
     * ============================================================
     */

    const seen = new Set();
    let unchangedRounds = 0;

    const scan = () => {

        const items =
            modal.querySelectorAll(
                '[role="listitem"]'
            );

        items.forEach(item => {

            /*
             * Find username.
             */

            const nameElement =
                item.querySelector('span[title]');

            if (!nameElement) return;

            const name =
                nameElement.getAttribute('title') ||
                nameElement.textContent?.trim() ||
                '(name not found)';


            /*
             * Exclude yourself.
             */

            if (name === 'You') return;


            /*
             * Find target gridcell.
             */

            const targetElement =
                nameElement.closest(
                    '[role="gridcell"]'
                );

            if (!targetElement) {
                console.warn(
                    `[Contact] ${name} - gridcell target not found.`
                );
                return;
            }


            /*
             * EXACTLY 3 levels upward.
             */

            const parentAncestor =
                targetElement.parentElement
                    ?.parentElement
                    ?.parentElement;


            /*
             * Prevent duplicate logging.
             */

            const key =
                name +
                '|' +
                targetElement.outerHTML;

            if (!seen.has(key)) {

                seen.add(key);

                console.log(
                    `[Contact ${seen.size}] Username:`,
                    name
                );

                console.log(
                    `[Contact ${seen.size}] Target gridcell:`,
                    targetElement
                );

                console.log(
                    `[Contact ${seen.size}] 3-level parent ancestor:`,
                    parentAncestor
                );
            }
        });
    };


    /*
     * ============================================================
     * 7. INITIAL SCAN
     * ============================================================
     */

    scan();

    let lastScrollTop = -1;


    /*
     * ============================================================
     * 8. SCROLL
     * ============================================================
     */

    for (let i = 0; i < 1000; i++) {

        /*
         * Realtime scan before scrolling.
         */

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


        /*
         * Realtime scan after rendering.
         */

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
     * 9. FINAL SCAN
     * ============================================================
     */

    scan();

    console.log(
        `Finished. Found ${seen.size} unique contact name element(s).`
    );

})();
