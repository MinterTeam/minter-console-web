import Vue from 'vue'
import _get from 'lodash-es/get'
import decode from 'entity-decode';

Vue.mixin({
    methods: {
        tt(text, path, params) {
            const translation = _get(this.$store.state.i18n.messages, path);
            return translation ? decode(this.$t(path, params)) : text;
        }
    },
});
