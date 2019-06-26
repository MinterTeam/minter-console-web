import createPersistedState from 'vuex-persistedstate/index.js';

let isCreated = false;

const authMutationList = [
    'SET_AUTH_PROFILE',
    'SET_AUTH_ADVANCED',
    'LOGOUT',
    'UPDATE_PROFILE_PASSWORD',
];

export default ({store}) => {
    // window.onNuxtReady(() => {
    if (isCreated) {
        return;
    }
    createPersistedState({
        paths: ['auth'],
        filter(mutation) {
            // is auth mutation
            return authMutationList.indexOf(mutation.type) !== -1;
        },
    })(store);
    isCreated = true;
    // });
};
