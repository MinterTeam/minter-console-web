
export default {
    bind(el, binding, vnode) {
        checkInputElementIsEmpty(el);
        el.addEventListener('input', handleInputEvent);
    },
    unbind(el) {
        el.removeEventListener('input', handleInputEvent);
    },
}

/**
 * @param {Event} e
 */
function handleInputEvent(e) {
    checkInputElementIsEmpty(e.target);
}

/**
 * @param {HTMLInputElement|EventTarget} el
 */
function checkInputElementIsEmpty(el) {
    if (el.value.length) {
        el.classList.add('is-not-empty');
    } else {
        el.classList.remove('is-not-empty');
    }
}