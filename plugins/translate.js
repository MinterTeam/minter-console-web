import Vue from 'vue'
import _get from 'lodash-es/get'
import decode from 'entity-decode';

Vue.mixin({
    methods: {
        tt: ttFactory('$i18n', '$store'),
    },
});

export default ({ app }, inject) => {
    // Set `i18n` instance on `app`
    // This way we can use it in middleware and pages `asyncData`/`fetch`
    app.tt = ttFactory('i18n', 'store');
}


function ttFactory(i18nPath, storePath) {
    return function tt(text, path, params) {
        const translation = _get(this[storePath].state.i18n.messages, path);
        return translation ? decode(this[i18nPath].t(path, params)) : text;
    }
}
