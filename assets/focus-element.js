/**
 *
 * @param {HTMLElement|Element} inputEl
 */
export default function focusElement(inputEl) {
    // calculate scroll
    const inputClientRectTop = inputEl.getBoundingClientRect().top;
    const windowTop = window.pageYOffset;
    const inputOffsetTop = inputClientRectTop + windowTop;
    const windowHeight = window.document.documentElement.clientHeight;
    // if inputEl not centered
    const shouldScroll = inputClientRectTop < windowHeight * 0.25 || inputClientRectTop > windowHeight * 0.75;

    setTimeout(() => {
        // focus
        inputEl.focus({preventScroll:true});
        // prevent focus scroll, set initial position
        window.scrollTo(0, windowTop);

        // scroll
        if (shouldScroll) {
            let targetOffset = inputOffsetTop - windowHeight / 3;
            // not needed for browser auto scroll
            // targetOffset = Math.max(targetOffset, 0);
            // targetOffset = Math.min(targetOffset, window.document.body.offsetHeight - window.document.documentElement.clientHeight);
            window.scrollTo({top: targetOffset, behavior: 'smooth'});
        }
    }, 0);
}
