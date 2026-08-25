function leftClick(memberName) {
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

    // Click the actual descendant containing the member name
    const nameElement = [...target.querySelectorAll('*')]
        .find(child =>
            child.getAttribute('title') === memberName
        );

    if (!nameElement) {
        console.error(`Name element "${memberName}" not found`);
        return;
    }

    const rect = nameElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const event = (type, button = 0, buttons = 0, detail = 1) => {
        nameElement.dispatchEvent(new MouseEvent(type, {
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

    console.log('Left-clicked:', memberName, nameElement);
}

// Usage:
leftClick("oekoff");
