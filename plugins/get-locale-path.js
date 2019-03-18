import Vue from 'vue';
import {I18N_ROUTE_NAME_SEPARATOR} from '~/assets/variables';

Vue.mixin({
    methods: {
        getLocalePath: getLocalePathFactory('$store', '$i18n'),
        hasLocalizedRoute: hasLocalizedRouteFactory('$router'),
    },
});

export default ({ app }, inject) => {
    // Set `i18n` instance on `app`
    // This way we can use it in middleware and pages `asyncData`/`fetch`
    app.getLocalePath = getLocalePathFactory('store', 'i18n');
    app.hasLocalizedRoute = hasLocalizedRouteFactory('router');
};


function getLocalePathFactory(storePath, i18nPath) {
    /**
     * Enhanced .localePath()
     * Check preferredLocale first, returns initial route if no localized route found
     * @param route
     * @return {*}
     */
    return function getLocalePath(route) {
        const store = this[storePath];
        const i18n = this[i18nPath];

        // Abort if no route
        if (!route) {
            return;
        }
        // collect locales to check in the routes
        let localesToCheck = [];
        if (store.state.preferredLocale) {
            localesToCheck.push(store.state.preferredLocale);
        }
        if (i18n.locale && localesToCheck.indexOf(i18n.locale) === -1) {
            localesToCheck.push(i18n.locale);
        }
        if (i18n.defaultLocale && localesToCheck.indexOf(i18n.defaultLocale) === -1) {
            localesToCheck.push(i18n.defaultLocale);
        }

        // If route parameters is a string, use it as the route's name
        if (typeof route === 'string') {
            route = { name: route };
        }

        let locale = localesToCheck.find((item) => this.hasLocalizedRoute(route, item));

        if (locale) {
            return this.localePath(route, locale);
        } else {
            return route;
        }
    };
}

function hasLocalizedRouteFactory(routerPath) {
    /**
     * Check existence of localized route
     * @param route
     * @param locale
     * @return {boolean}
     */
    return function checkLocaleInRoutes(route, locale) {
        const router = this[routerPath];

        const name = route.name + I18N_ROUTE_NAME_SEPARATOR + locale;
        return router.options.routes.some((item) => item.name === name);
    };
}
