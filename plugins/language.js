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
            window.Cookies = Cookies;
            // Helpers
            const locales = getLocaleCodes(app.i18n.locales);
            const preferredLocale = getCookie();

            // redirect to saved locale
            if (preferredLocale && locales.indexOf(preferredLocale) !== -1) {
                store.commit('SET_PREFERRED_LOCALE', preferredLocale)

                if (preferredLocale !== app.i18n.locale) {
                    const routeName = route && route.name ? app.getRouteBaseName(route) : 'index';
                    redirect(app.localePath(Object.assign({}, route , {
                        name: routeName,
                    }), preferredLocale));
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
