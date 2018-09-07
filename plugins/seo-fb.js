export default ({ app }) => {
    /*
    ** Only run on client-side and only in production mode
    */
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    if (window.fbq) {
        return;
    }

    let windowFbq = window.fbq = function () {
        windowFbq.callMethod ?
            windowFbq.callMethod.apply(windowFbq, arguments) : windowFbq.queue.push(arguments)
    };
    if (!window._fbq) {
        window._fbq = windowFbq;
    }
    windowFbq.push = windowFbq;
    windowFbq.loaded = true;
    windowFbq.version = '2.0';
    windowFbq.queue = [];

    /*
    ** Include script
    */
    let script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.body.appendChild(script);


    fbq('init', '695903154106304');
    fbq('track', 'PageView');

    /*
    ** Every time the route changes (fired on initialization too)
    */
    app.router.afterEach((to, from) => {
        fbq('track', 'PageView');
    })
}
