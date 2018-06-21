/**
 * Remove unnecessary :focus from links and buttons after mouse click
 */
document.addEventListener('click', (e) => {
    if (e.screenX > 0 && e.target.tagName && (e.target.tagName.toLowerCase() === 'a' || e.target.tagName.toLowerCase() === 'button')) {
        e.target.blur();
    }
});
