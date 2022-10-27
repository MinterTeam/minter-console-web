<script>
    import {validationMixin} from 'vuelidate/src/index.js';
    import required from 'vuelidate/src/validators/required.js';
    import minLength from 'vuelidate/src/validators/minLength.js';
    import maxLength from 'vuelidate/src/validators/maxLength.js';
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
            onSuccess(tx) {
                if (!tx.tags?.unlock_block_id) {
                    return;
                }

                this.$store.commit('SET_STAKE_LOCK', {
                    startBlock: tx.height,
                    startTimestamp: new Date().toISOString(),
                    endBlock: tx.tags.unlock_block_id,
                });
            },
        },
    };
</script>

<template>
    <TxForm
        :txData="{}"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.LOCK_STAKE"
        @clear-form="clearForm()"
        @success-tx="onSuccess"
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
            <div class="u-cell" v-if="$store.state.stakeLock">
                You already locked your stake until <strong>{{ prettyRound($store.state.stakeLock.endBlock) }}</strong> block. Do you want to renew?
            </div>
            <div class="u-cell">
                You will lock ALL your current and future stakes from ALL validators for ≈3 years ({{ prettyRound($options.LOCK_STAKE_PERIOD) }} blocks)
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Lock stake', `form.delegation-lock-button`) }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-delegate.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Lock stake', 'delegation.lock-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-text-left">
                <span class="u-emoji">⚠️</span>
                <span class="u-fw-700">Warning!</span>
                <br>
                You are about to lock <strong>ALL</strong> your current and future stakes from <strong>ALL</strong> validators for <strong>≈3 years</strong> ({{ prettyRound($options.LOCK_STAKE_PERIOD) }} blocks)
            </div>
        </template>
    </TxForm>
</template>
