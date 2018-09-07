import Vue from 'vue';
console.log('get locale3')

Vue.mixin({
    methods: {
        getLocalePath: getLocalePathFactory('$store', '$router', '$i18n'),
    },
});

export default ({ app }, inject) => {
    // Set `i18n` instance on `app`
    // This way we can use it in middleware and pages `asyncData`/`fetch`
    app.getLocalePath = getLocalePathFactory('store', 'router', 'i18n');
}


function getLocalePathFactory(storePath, routerPath, i18nPath) {
    /**
     * Enhanced .localePath()
     * Check preferredLocale first, returns initial route if no localized route found
     * @param route
     * @return {*}
     */
    return function getLocalePath (route) {
        const store = this[storePath];
        const router = this[routerPath];
        const i18n = this[i18nPath];
        console.log('get locale call')
        // Abort if no route
        if (!route) {
            return;
        }
        // collect locales to check in the routes
        let localesToCheck = [];
        if (store.state.preferredLocale) {
            localesToCheck.push(store.state.preferredLocale)
        }
        if (i18n.locale && localesToCheck.indexOf(i18n.locale) === -1) {
            localesToCheck.push(i18n.locale);
        }
        if (i18n.defaultLocale && localesToCheck.indexOf(i18n.defaultLocale) === -1) {
            localesToCheck.push(i18n.defaultLocale);
        }

        // If route parameters is a string, use it as the route's name
        if (typeof route === 'string') {
            route = { name: route }
        }

        let locale = localesToCheck.find((item) => checkLocaleInRoutes(route, item));

        if (locale) {
            return this.localePath(route, locale);
        } else {
            return route;
        }


        /**
         * Check existence of localized route
         * @param route
         * @param locale
         * @return {boolean}
         */
        function checkLocaleInRoutes(route, locale) {
            const name = route.name + i18n.routesNameSeparator + locale;
            return router.options.routes.some((item) => item.name === name);
        }
    }
}









