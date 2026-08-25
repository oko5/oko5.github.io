(() => {
    const target = [...document.querySelectorAll('[role="gridcell"]')]
        .find(el =>
            el.querySelector(
                '[data-testid="cell-frame-title"] span[title="+61 485 595 807"]'
            )
        )?.querySelector('[data-testid="cell-frame-title"]');

    if (!target) {
        console.error('Target not found');
        return;
    }

    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const event = (type, button = 0, buttons = 0, detail = 1) => {
        target.dispatchEvent(new MouseEvent(type, {
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

    // Normal left-click sequence
    event('mouseenter');
    event('mouseover');
    event('mousemove');
    event('mousedown', 0, 1);
    event('mouseup', 0, 0);
    event('click', 0, 0, 1);
})();
