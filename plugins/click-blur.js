/**
 * Remove unnecessary :focus from links and buttons after mouse click
 */
document.addEventListener('click', (e) => {
    const el = typeof e.target.closest === 'function' && (e.target.closest('a') || e.target.closest('button'));
    if (e.screenX > 0 && el) {
        el.blur();
    }
});
