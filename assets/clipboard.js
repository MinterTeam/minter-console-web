/**
 * Copy to clipboard
 * @see https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
 */
export function copy(str) {
    const el = document.createElement('textarea');  // Create a <textarea> element
    el.value = str;                                 // Set its value to the string that you want copied
    el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
    el.style.position = 'absolute';
    el.style.left = '-9999px';                      // Move outside the screen to make it invisible
    document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0        // Check if there is any content selected previously
            ? document.getSelection().getRangeAt(0)     // Store selection if found
            : false;                                    // Mark as false to know no selection existed before
    el.select();                                    // Select the <textarea> content
    document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el);                  // Remove the <textarea> element
    if (selected) {                                 // If a selection existed before copying
        document.getSelection().removeAllRanges();    // Unselect everything on the HTML document
        document.getSelection().addRange(selected);   // Restore the original selection
    }
}

/**
 * Returns the support of all actions
 * @see https://github.com/zenorocha/clipboard.js/blob/3382ea3d14a6c46d274df6147c73a83ef47e41b3/src/clipboard.js#L87
 */
export function isSupported() {
    const actions = ['copy'];
    let support = typeof document !== 'undefined' && typeof document.queryCommandSupported === 'function';

    actions.forEach((action) => {
        support = support && document.queryCommandSupported(action);
    });

    return support;
}
