import Vue from 'vue';
import {APP_BASE_URL} from '~/assets/variables.js';

Vue.mixin({
    computed: {
        BASE_URL_PREFIX: () => APP_BASE_URL.replace(/\/$/, ''),
    },
});
