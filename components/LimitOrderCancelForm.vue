<script>
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import checkEmpty from '~/assets/v-check-empty.js';
import focusElement from '~/assets/focus-element.js';
import eventBus from '~/assets/event-bus.js';
import TxForm from '~/components/common/TxForm.vue';
import InputMaskedInteger from '~/components/common/InputMaskedInteger.vue';

export default {
    TX_TYPE,
    components: {
        TxForm,
        InputMaskedInteger,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin],
    data() {
        return {
            form: {
                id: '',
            },
        };
    },
    validations() {
        const form = {
            id: {
                required,
            },
        };

        return {form};
    },
    computed: {
    },
    watch: {
    },
    mounted() {
        eventBus.on('activate-cancel-limit-order', (orderId) => {
            this.form.id = orderId;

            const inputEl = this.$refs.orderIdInput.$el;
            focusElement(inputEl);
        });
    },
    destroyed() {
        eventBus.off('activate-cancel-limit-order');
    },
    methods: {
        success() {
            eventBus.emit('update-limit-order-list');
        },
        clearForm() {
            this.form.id = '';
            this.$v.$reset();
        },
    },
};
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.REMOVE_LIMIT_ORDER"
        @success-tx="success()"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Cancel limit order', 'limit-order.remove-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('', 'limit-order.remove-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.id.$error}">
                    <InputMaskedInteger class="form-field__input" v-check-empty
                                        ref="orderIdInput"
                                        v-model="form.id"
                                        @blur="$v.form.id.$touch()"
                    />
                    <span class="form-field__label">{{ $td('ID', 'form.order-remove-id') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.id.$dirty && !$v.form.id.required">{{ $td('Enter ID', 'form.order-remove-id-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2 u-hidden-medium-down"></div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Cancel limit order', 'form.order-remove-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-vote.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Cancel limit order', 'limit-order.remove-title') }}
            </h1>
        </template>
    </TxForm>
</template>
