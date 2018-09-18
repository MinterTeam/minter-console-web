export default function({ app }) {
    /*
    ** Only run on client-side and only in production mode
    */
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    !function(s) {
        if (window.twq) {
            return;
        }
        let windowTwq = window.twq = function() {
            windowTwq.exe ? windowTwq.exe.apply(s, arguments) : windowTwq.queue.push(arguments);
        };
        windowTwq.version = '1.1';
        windowTwq.queue = [];
        let script = document.createElement('script');
        script.async = true;
        script.src = '//static.ads-twitter.com/uwt.js';
        document.body.appendChild(script);
    }();
// Insert Twitter Pixel ID and Standard Event data below
    twq('init', 'nzsr8');
    twq('track', 'PageView');

    /*
    ** Every time the route changes (fired on initialization too)
    */
    app.router.afterEach((to, from) => {
        twq('track', 'PageView');
    });
}
