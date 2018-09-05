import Vue from 'vue'
import _get from 'lodash-es/get'

Vue.mixin({
    methods: {
        tt(text, path) {
            const translation = _get(this.$store.state.i18n.messages, path);
            return translation ? translation : text;
        }
    },
});