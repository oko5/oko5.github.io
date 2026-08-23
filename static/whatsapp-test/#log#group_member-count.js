const button = [...document.querySelectorAll('button')]
    .find(btn => /^\d+ members$/.test(btn.textContent.trim()));

if (button) {
    console.log(button.textContent.trim());
}
