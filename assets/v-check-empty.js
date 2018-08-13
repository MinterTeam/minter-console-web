
export default {
    bind(el, binding, vnode) {
        if (isSelect(el)) {
            // wait select options to render
            setTimeout(() => {
                checkInputElementIsEmpty(el);
            }, 0);
            el.addEventListener('change', handleInputEvent);
        } else {
            checkInputElementIsEmpty(el);
            el.addEventListener('input', handleInputEvent);
        }
    },
    componentUpdated(el) {
        checkInputElementIsEmpty(el);
    },
    unbind(el) {
        if (isSelect(el)) {
            el.removeEventListener('change', handleInputEvent);
        } else {
            el.removeEventListener('input', handleInputEvent);
        }
    },
}

/**
 * @param {HTMLElement} el
 * @return {boolean}
 */
function isSelect(el) {
    return el.nodeName.toUpperCase() === 'SELECT';
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
