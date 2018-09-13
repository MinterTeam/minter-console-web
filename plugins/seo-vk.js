export default function({ app }) {
    /*
    ** Only run on client-side and only in production mode
    */
    if (process.env.NODE_ENV !== 'production') {
        return;
    }
    /*
    ** Include script
    */
    let script = document.createElement('script');
    script.async = true;
    script.onload = () => {
        window.VK.Retargeting.Init("VK-RTRG-280843-b1lhy");
        window.VK.Retargeting.Hit();
    };
    script.src = 'https://vk.com/js/api/openapi.js?159';
    document.body.appendChild(script);

    /*
    ** Every time the route changes (fired on initialization too)
    */
    app.router.afterEach((to, from) => {
        if (typeof window.VK === 'object') {
            window.VK.Retargeting.Hit();
        }
    });
}
