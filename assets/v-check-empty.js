
export default {
    bind(el, binding, vnode) {
        checkInputElementIsEmpty(el);
        if (isSelect(el)) {
            el.addEventListener('change', handleInputEvent);
        } else {
            el.addEventListener('input', handleInputEvent);
        }
        if (binding.value) {
            el.addEventListener(binding.value, handleInputEvent);
        }
    },
    componentUpdated(el, binding) {
        checkInputElementIsEmpty(el);
        if (binding.oldValue !== binding.value) {
            el.removeEventListener(binding.oldValue, handleInputEvent);
        }
        if (binding.value) {
            el.addEventListener(binding.value, handleInputEvent);
        }
    },
    unbind(el, binding) {
        if (isSelect(el)) {
            el.removeEventListener('change', handleInputEvent);
        } else {
            el.removeEventListener('input', handleInputEvent);
        }
        if (binding.value) {
            el.removeEventListener(binding.value, handleInputEvent);
        }

    },
};

/**
 * @param {HTMLElement} el
 * @return {boolean}
 */
function isSelect(el) {
    return el.nodeName.toUpperCase() === 'SELECT';
}

/**
 * @param {HTMLElement} el
 * @return {boolean}
 */
// function isInput(el) {
//     return el.nodeName.toUpperCase() === 'INPUT';
// }

/**
 * @param {Event} e
 * @return void
 */
function handleInputEvent(e) {
    checkInputElementIsEmpty(e.target);
}

/**
 * @param {HTMLInputElement|EventTarget} el
 */
function checkInputElementIsEmpty(el) {
    // let input;
    // if (isInput(el) || isSelect(el)) {
    //     input = el;
    // } else {
    //     input = el.querySelector('input, select');
    // }
    // console.log(input)
    // if (!input) {
    //     return
    // }
    // wait select options to render or wait value updated programmatically by vue
    setTimeout(() => {
        if (el.value.length) {
            el.classList.add('is-not-empty');
        } else {
            el.classList.remove('is-not-empty');
        }
    }, 0);
}
