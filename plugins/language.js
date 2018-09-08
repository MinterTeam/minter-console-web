import cookie from 'cookie'
import Cookies from 'js-cookie'
import {getLocaleCodes} from 'nuxt-i18n/src/helpers/utils'
import {LANGUAGE_COOKIE_KEY} from '~/assets/variables';

export default ({ app, req, route, store, redirect, isHMR }) => {
    if (isHMR) {
        return
    }

    app.router.onReady(() => {
        // without timeout i18n locale and messages not set correctly according to new redirected url
        setTimeout(() => {
            // Helpers
            const locales = getLocaleCodes(app.i18n.locales);
            const preferredLocale = getCookie();

            // redirect to saved locale
            if (preferredLocale && locales.indexOf(preferredLocale) !== -1) {
                store.commit('SET_PREFERRED_LOCALE', preferredLocale);

                const baseRoute =  route && route.name && {name: app.getRouteBaseName(route)};
                if (preferredLocale !== app.i18n.locale && baseRoute && app.hasLocalizedRoute(baseRoute, preferredLocale)) {
                    redirect(app.localePath(Object.assign({}, route , baseRoute), preferredLocale));
                }
            }

            function getCookie() {
                if (process.client) {
                    return Cookies.get(LANGUAGE_COOKIE_KEY);
                } else if (req && typeof req.headers.cookie !== 'undefined') {
                    const cookies = req.headers && req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
                    return cookies[LANGUAGE_COOKIE_KEY];
                }
                return null;
            }
        }, 0)
    });
}
