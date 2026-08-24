(async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const modal = document.querySelector('[data-testid="contacts-modal"]');

    if (!modal) {
        console.error('Contacts modal ([data-testid="contacts-modal"]) not found.');
        return;
    }

    const firstItem = modal.querySelector('[role="listitem"]');

    if (!firstItem) {
        console.error('No [role="listitem"] found inside contacts modal.');
        return;
    }

    let scrollContainer = firstItem.parentElement;

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

        scrollContainer = scrollContainer.parentElement;
    }

    if (
        !scrollContainer ||
        scrollContainer.scrollHeight <= scrollContainer.clientHeight
    ) {
        console.error('Actual scrollable contacts container not found.');
        return;
    }

    console.log('Scroll container:', scrollContainer);
    console.log(
        'Scroll height:',
        scrollContainer.scrollHeight,
        'Client height:',
        scrollContainer.clientHeight
    );

    const seen = new Set();
    let unchangedRounds = 0;

    const scan = () => {
        const items = modal.querySelectorAll('[role="listitem"]');

        items.forEach(item => {

            /*
             * Find the username element.
             */
            const nameElement = item.querySelector('span[title]');

            if (!nameElement) return;

            const name =
                nameElement.getAttribute('title') ||
                nameElement.textContent?.trim() ||
                '(name not found)';

            /*
             * Automatically find the target gridcell
             * associated with this contact.
             */
            const targetElement = nameElement.closest('[role="gridcell"]');

            if (!targetElement) {
                console.warn(
                    `[Contact] ${name} - gridcell target not found.`
                );
                return;
            }

            /*
             * Go EXACTLY 3 levels upward from the
             * target gridcell.
             *
             * gridcell
             *    ↑ 1 parent
             *    ↑ 2 grandparent
             *    ↑ 3 ancestor
             */
            const parentAncestor =
                targetElement.parentElement
                    ?.parentElement
                    ?.parentElement;

            /*
             * Prevent duplicate logging.
             */
            const key =
                name + '|' + targetElement.outerHTML;

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
     * Initial scan.
     */
    scan();

    let lastScrollTop = -1;

    for (let i = 0; i < 1000; i++) {

        /*
         * Realtime scan before scrolling.
         */
        scan();

        const before = seen.size;
        const oldPosition = scrollContainer.scrollTop;

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

        const after = seen.size;

        if (after === before) {
            unchangedRounds++;
        } else {
            unchangedRounds = 0;
        }

        const newPosition = scrollContainer.scrollTop;

        if (newPosition === oldPosition) {
            unchangedRounds++;
        }

        const atBottom =
            scrollContainer.scrollTop +
                scrollContainer.clientHeight >=
            scrollContainer.scrollHeight - 5;

        if (atBottom && unchangedRounds >= 3) {
            break;
        }

        if (scrollContainer.scrollTop === lastScrollTop) {
            unchangedRounds++;
        } else {
            lastScrollTop = scrollContainer.scrollTop;
        }

        if (unchangedRounds >= 10) {
            break;
        }
    }

    /*
     * Final scan.
     */
    scan();

    console.log(
        `Finished. Found ${seen.size} unique contact name element(s).`
    );
})();
