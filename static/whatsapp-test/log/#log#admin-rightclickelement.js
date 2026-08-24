console.clear();
const admins = document.querySelectorAll(
    '[aria-label^="Members list"] [role="listitem"]'
);

admins.forEach(member => {
    if (!member.querySelector('[data-testid="group-admin-marker"]')) return;

    const element = member.querySelector(
        '[data-testid="cell-frame-title"] span[dir="auto"]'
    );

    if (element) {
        console.log('Admin right-click element:', element);
        console.log('Admin name:', element.textContent.trim());
    }
});
