<script>

    export default {
        layout({store}) {
            return store.getters.isAuthorized ? 'default' : 'nonAuth';
        },
        props: ['error'],
    };
</script>

<template>
    <div class="u-container u-container--medium">
        <div class="u-section">
            <h1 class="">{{ $td('Error', 'error.title-error') }} {{ error.statusCode }}</h1>
            <p class="u-container--small" v-if="error.statusCode === 404">{{ $td('Page not found', 'error.message-404') }}</p>
            <p class="u-container--small" v-else-if="error.statusCode === 504" v-html="$td('Request failed with status code 504. <br> Gateway time-out.', 'error.message-504')"></p>
            <p class="u-container--small" v-else-if="error.statusCode === 503" v-html="$td('The webpage is currently unavailable. <br> It may be overloaded or down for maintenance.', 'error.message-503')"></p>
            <p class="u-container--small" v-else-if="error.message === 'Network Error'">{{ $td('Network Error', 'error.message-network') }}</p>
            <p class="u-container--small" v-else>{{ error.message }}</p>
            <p>
                <span class="button-group">
                    <a class="button button--ghost" href="" v-if="error.statusCode !== 404">{{ $td('Refresh page', 'error.refresh-link') }}</a>
                    <a class="button button--ghost" href="/">{{ $td('Return to main page', 'error.return-link') }}</a>
                </span>
            </p>
        </div>
    </div>

</template>
