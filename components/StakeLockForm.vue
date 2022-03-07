<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {LOCK_STAKE_PERIOD} from '~/assets/variables.js';
    import {prettyRound} from "~/assets/utils";
    import TxForm from '~/components/common/TxForm.vue';

    export default {
        TX_TYPE,
        LOCK_STAKE_PERIOD,
        components: {
            TxForm,
        },
        mixins: [validationMixin],
        data() {
            return {
                form: {
                },
                domain: '',
                isDomainResolving: false,
            };
        },
        validations() {
            const form = {
            };

            return {form};
        },
        computed: {
        },
        methods: {
            prettyRound,
            clearForm() {
                this.$v.$reset();
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="{}"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.LOCK"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Lock stake', 'delegation.lock-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('You can lock your stake to receive increased rewards', 'delegation.lock-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
        </template>

        <template v-slot:submit-title>
            {{ $td('Lock', `form.delegation-lock-button`) }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-delegate.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Lock', 'delegation.lock-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            Warning! You are about to lock ALL your current and future stakes from ALL validators for ~3 years ({{ prettyRound($options.LOCK_STAKE_PERIOD) }})
        </template>
    </TxForm>
</template>
