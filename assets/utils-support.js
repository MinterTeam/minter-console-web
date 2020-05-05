export let support = {};
support.passiveListener = (function() {
    let supportsPassive = false;
    try {
        let opts = Object.defineProperty({}, 'passive', {
            /* eslint-disable-next-line getter-return */
            get: function() {
                supportsPassive = true;
            },
        });
        window.addEventListener('testPassiveListener', null, opts);
    } catch (e) {}
    return supportsPassive;
})();

if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
    support.hidden = "hidden";
    support.visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
    support.hidden = "msHidden";
    support.visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
    support.hidden = "webkitHidden";
    support.visibilityChange = "webkitvisibilitychange";
}
