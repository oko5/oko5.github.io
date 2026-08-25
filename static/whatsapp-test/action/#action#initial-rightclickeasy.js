(() => {
    const targetName = "Luke Totu"; // <-- CHANGE THIS

    const target = [...document.querySelectorAll(
        '[data-testid="cell-frame-title"]'
    )].find(el =>
        el.querySelector(`span[title="${CSS.escape(targetName)}"]`)
    );

    if (!target) {
        console.error(`Target "${targetName}" not found`);
        return;
    }

    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const dispatch = (type, button = 2, buttons = 0) => {
        target.dispatchEvent(new MouseEvent(type, {
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

    // Right-click sequence
    dispatch('mouseenter', 0, 0);
    dispatch('mouseover', 0, 0);
    dispatch('mousemove', 0, 0);
    dispatch('mousedown', 2, 2);
    dispatch('mouseup', 2, 0);
    dispatch('contextmenu', 2, 0);
})();
