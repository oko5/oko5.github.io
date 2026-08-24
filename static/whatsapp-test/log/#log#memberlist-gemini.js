(() => {
    const modal = document.querySelector('[data-testid="contacts-modal"]');

    if (!modal) {
        console.error('Contacts modal ([data-testid="contacts-modal"]) not found.');
        return;
    }

    // Targets each contact item container
    const contactElements = modal.querySelectorAll('[role="listitem"]');

    console.log(`Found ${contactElements.length} contact DOM elements inside the modal:`);

    contactElements.forEach((el, index) => {
        // Log the raw DOM node directly
        console.log(`[Item ${index}]`, el);
    });
})();
