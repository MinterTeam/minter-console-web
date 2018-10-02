import cookie from 'cookie';
import Cookies from 'js-cookie';
import {getLocaleCodes} from 'nuxt-i18n/src/helpers/utils';
import {LANGUAGE_COOKIE_KEY} from '~/assets/variables';

const DETECT_BROWSER = false;

let isExecuted = false;

export default function({ app, req, res, route, store, redirect, isHMR }) {
    if (isHMR) {
        return;
    }

    // process only on first load
    if (process.client && isExecuted) {
        return;
    }
    isExecuted = true;

    // Helpers
    const locales = getLocaleCodes(app.i18n.locales);
    const preferredLocale = getCookie();
    const isRootPath = route.path === '/';

    // redirect only on root page, on other pages just set current locale as preferred
    if (isRootPath && preferredLocale && locales.indexOf(preferredLocale) !== -1) {
        return setLocale(preferredLocale);
    } else if (isRootPath && DETECT_BROWSER) {
        const browserLocale = getBrowserLocale();
        if (browserLocale && locales.indexOf(browserLocale) !== -1) {
            return setLocale(browserLocale);
        }
    } else if (!isRootPath) {
        return setLocale(app.i18n.locale);
    }

    // redirect to saved locale
    function setLocale(newLocale) {
        setCookie(newLocale);
        store.commit('SET_PREFERRED_LOCALE', newLocale);

        const baseRoute = route && route.name && {name: app.getRouteBaseName(route)};
        if (newLocale !== app.i18n.locale && baseRoute && app.hasLocalizedRoute(baseRoute, newLocale)) {
            return redirect(app.localePath(Object.assign({}, route, baseRoute), newLocale));
        }
    }

    // Get browser language either from navigator if running in mode SPA, or from the headers
    function getBrowserLocale() {
        let browserLocale = null;
        if (process.client && typeof navigator !== 'undefined' && navigator.language) {
            browserLocale = navigator.language.toLocaleLowerCase().substring(0, 2);
        } else if (req && typeof req.headers['accept-language'] !== 'undefined') {
            browserLocale = req.headers['accept-language'].split(',')[0].toLocaleLowerCase().substring(0, 2);
        }
        return browserLocale;
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

    function setCookie(value) {
        const date = new Date();
        if (process.client) {
            Cookies.set(LANGUAGE_COOKIE_KEY, value, {
                expires: new Date(date.setDate(date.getDate() + 365)),
                domain: window.location.host.split('.').slice(-2).join('.').replace(/:\d+$/, ''),
            });
        } else if (res && req) {
            const redirectCookie = cookie.serialize(LANGUAGE_COOKIE_KEY, value, {
                expires: new Date(date.setDate(date.getDate() + 365)),
                domain: req.headers.host.split('.').slice(-2).join('.').replace(/:\d+$/, ''),
            });
            res.setHeader('Set-Cookie', redirectCookie);
        }
    }
}
