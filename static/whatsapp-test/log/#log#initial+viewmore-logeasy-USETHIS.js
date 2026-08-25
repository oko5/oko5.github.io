(async () => {
    console.clear();

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    const result = {
        initial: [],
        viewMore: []
    };

    /*
     * ============================================================
     * 1. INITIAL SCAN
     * ============================================================
     */

    const members = document.querySelectorAll(
        '[aria-label^="Members list"] [role="listitem"]'
    );

    members.forEach(member => {
        const element = member.querySelector(
            '[data-testid="cell-frame-title"] span[dir="auto"]'
        );

        if (!element) return;

        const name = element.textContent.trim();

        if (!name || name === 'You') return;

        result.initial.push(name);
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
        console.log(result);
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
        console.log(result);
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
        document.querySelector('[data-testid="contacts-modal"]');

    if (!modal) {
        console.log(result);
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
        console.log(result);
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
        console.log(result);
        return;
    }


    /*
     * ============================================================
     * 7. SCAN VIEW MORE NAMES
     * ============================================================
     */

    const seen = new Set();

    const scan = () => {
        const items =
            modal.querySelectorAll('[role="listitem"]');

        items.forEach(item => {

            const nameElement =
                item.querySelector('span[title]');

            if (!nameElement) return;

            const name =
                nameElement.getAttribute('title') ||
                nameElement.textContent?.trim();

            if (!name || name === 'You') return;

            if (seen.has(name)) return;

            seen.add(name);

            result.viewMore.push(name);
        });
    };


    /*
     * ============================================================
     * 8. INITIAL VIEW MORE SCAN
     * ============================================================
     */

    scan();


    /*
     * ============================================================
     * 9. SCROLL THROUGH VIEW MORE
     * ============================================================
     */

    let unchangedRounds = 0;
    let lastScrollTop = -1;

    for (let i = 0; i < 1000; i++) {

        scan();

        const before = seen.size;

        const oldPosition =
            scrollContainer.scrollTop;

        scrollContainer.scrollBy({
            top: 500,
            left: 0,
            behavior: 'instant'
        });

        await sleep(100);

        scan();

        const after = seen.size;

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
     * 11. ACTUAL JAVASCRIPT OBJECT
     * ============================================================
     */

    console.log(result);

})();
