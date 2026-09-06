document.querySelectorAll('section[data-turn-id]').forEach(section => {
    const assistant = section.querySelector('[data-message-author-role="assistant"]');
    if (assistant) {
        console.log(assistant);
    }
});
