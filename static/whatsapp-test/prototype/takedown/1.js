// ============================================================
// MASS REMOVAL
// ============================================================

let removed = 0;
let failed = 0;
let scrollAttempts = 0;
let emptyAttempts = 0;

// Maximum removal attempts PER USER.
const MAX_REMOVAL_ATTEMPTS = 2;

// Track attempts separately for every member.
const removalAttempts = new Map();

const MAX_OPERATIONS = 5000;
const MAX_SCROLL_ATTEMPTS = 2000;

console.log(
    '============================================'
);

console.log(
    'STARTING MASS REMOVAL'
);

console.log(
    'MAX ATTEMPTS PER USER:',
    MAX_REMOVAL_ATTEMPTS
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

        const memberName =
            member.name;

        // ----------------------------------------------------
        // GET THIS USER'S CURRENT ATTEMPT COUNT
        // ----------------------------------------------------

        const currentAttempts =
            removalAttempts.get(
                memberName
            ) || 0;

        // ----------------------------------------------------
        // SKIP USER AFTER 2 ATTEMPTS
        // ----------------------------------------------------

        if (
            currentAttempts >=
            MAX_REMOVAL_ATTEMPTS
        ) {

            console.warn(
                `Skipping "${memberName}" — ` +
                `${MAX_REMOVAL_ATTEMPTS} attempts already used`
            );

            // Move past this member so the loop does not
            // repeatedly try the same user.
            const scroller =
                findMemberScroller();

            if (scroller) {

                const maxTop =
                    Math.max(
                        0,
                        scroller.scrollHeight -
                        scroller.clientHeight
                    );

                scroller.scrollTop =
                    Math.min(
                        maxTop,
                        scroller.scrollTop + 250
                    );
            }

            await sleep(
                SCROLL_WAIT
            );

            continue;
        }

        // ----------------------------------------------------
        // INCREMENT THIS USER'S ATTEMPT COUNT
        // ----------------------------------------------------

        const attemptNumber =
            currentAttempts + 1;

        removalAttempts.set(
            memberName,
            attemptNumber
        );

        console.log(
            `Removing "${memberName}" ` +
            `(attempt ${attemptNumber}/${MAX_REMOVAL_ATTEMPTS})`
        );

        // ----------------------------------------------------
        // ATTEMPT REMOVAL
        // ----------------------------------------------------

        const success =
            await leftClick(
                ACTION,
                memberName
            );

        if (success) {

            removed++;

            console.log(
                `SUCCESS: "${memberName}" removed`
            );

        } else {

            failed++;

            console.warn(
                `FAILED: "${memberName}" ` +
                `(attempt ${attemptNumber}/${MAX_REMOVAL_ATTEMPTS})`
            );

            // Give WhatsApp UI time to recover.
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
        // AT BOTTOM
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
    'Users tracked:',
    removalAttempts.size
);

console.log(
    '============================================'
);
