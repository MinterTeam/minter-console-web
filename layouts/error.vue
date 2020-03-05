<script>
    import {getErrorText} from '~/assets/server-error';

    export default {
        layout({store}) {
            return store.getters.isAuthorized ? 'default' : 'nonAuth';
        },
        props: {
            error: {
                type: Object,
                required: true,
            },
        },
        computed: {
            statusCode() {
                if (this.error.response) {
                    return this.error.response.status;
                } else if (this.error.request) {
                    return this.error.request.status;
                } else {
                    return undefined;
                }
            },
            message() {
                let errorText = getErrorText(this.error, '');
                if (errorText === 'timeout of 0ms exceeded') {
                    errorText = 'Network error: request timed out';
                }
                return errorText;
            },
        },
    };
</script>

<template>
    <div class="u-container u-container--medium">
        <div class="u-section error">
            <h1 class="">{{ $td('Error', 'error.title-error') }} {{ statusCode }}</h1>
            <p class="u-container--small" v-if="statusCode === 404">{{ $td('Page not found', 'error.message-404') }}</p>
            <p class="u-container--small" v-else-if="statusCode === 504" v-html="$td('Request failed with status code 504. <br> Gateway time-out.', 'error.message-504')"></p>
            <p class="u-container--small" v-else-if="statusCode === 503" v-html="$td('The webpage is currently unavailable. <br> It may be overloaded or down for maintenance.', 'error.message-503')"></p>
            <p class="u-container--small" v-else-if="message === 'Network Error'">{{ $td('Network Error', 'error.message-network') }}</p>
            <p class="u-container--small" v-else>{{ message }}</p>
            <p>
                <span class="button-group">
                    <a class="button button--ghost" href="" v-if="statusCode !== 404">{{ $td('Refresh page', 'error.refresh-link') }}</a>
                    <a class="button button--ghost" href="/" v-if="$route.path !== '/'">{{ $td('Return to main page', 'error.return-link') }}</a>
                </span>
            </p>
        </div>
    </div>
</template>
