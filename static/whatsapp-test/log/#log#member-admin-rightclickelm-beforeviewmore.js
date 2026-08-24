console.clear();

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
