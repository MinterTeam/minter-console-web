export default ({ app }) => {
    /*
    ** Only run on client-side and only in production mode
    */
    if (process.env.NODE_ENV !== 'production') {
        return;
    }

    (window["yandex_metrika_callbacks2"] = window["yandex_metrika_callbacks2"] || []).push(function () {
        try {
            window.yaCounter49878307 = new Ya.Metrika2({
                id: 49878307,
                clickmap: false,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: false
            });
        } catch (e) {}
    });

    /*
    ** Include script
    */
    let script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.body.appendChild(script);

    /*
    ** Every time the route changes (fired on initialization too)
    */
    app.router.afterEach((to, from) => {
        if(typeof window.yaCounter49878307 === 'object') {
            window.yaCounter49878307.hit(to.fullPath);
        }
    })
}
