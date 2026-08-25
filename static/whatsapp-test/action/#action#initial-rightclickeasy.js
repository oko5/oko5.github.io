(() => {
    const targetName = "~Adrian";

    const list = [...document.querySelectorAll('[role="list"]')]
        .find(list =>
            list.querySelector('[aria-label^="Members list:"]')
        );

    if (!list) {
        console.error('Members role="list" not found');
        return;
    }

    const member = [...list.querySelectorAll('[role="listitem"]')]
        .find(item =>
            [...item.querySelectorAll('*')].some(el =>
                el.getAttribute('title') === targetName
            )
        );

    if (!member) {
        console.error(`Member "${targetName}" not found`);
        return;
    }

    // The actual name element
    const nameElement = [...member.querySelectorAll('*')]
        .find(el => el.getAttribute('title') === targetName);

    if (!nameElement) {
        console.error(`Name span "${targetName}" not found`);
        return;
    }

    const rect = nameElement.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const dispatch = (type, button = 0, buttons = 0) => {
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

    // Right-click the NAME SPAN
    dispatch('mouseenter');
    dispatch('mouseover');
    dispatch('mousemove');
    dispatch('mousedown', 2, 2);
    dispatch('mouseup', 2, 0);
    dispatch('contextmenu', 2, 0);

    console.log('Right-clicked name span:', nameElement);
})();
