<script>
import Big from '~/assets/big.js';
import debounce from 'debounce-promise';
import {AsyncComputedMixin} from 'vue-async-computed/src/index.js';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required.js';
import minLength from 'vuelidate/lib/validators/minLength.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import stripZeros from 'pretty-num/src/pretty-num.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import eventBus from '~/assets/event-bus.js';
import focusElement from '~/assets/focus-element.js';
import {getCoinId} from '@/api/gate.js';
import {getPool, getSwapCoinList} from '@/api/explorer.js';
import checkEmpty from '~/assets/v-check-empty';
import {SLIPPAGE_INPUT_TYPE} from '~/assets/variables.js';
import {decreasePrecisionFixed, decreasePrecisionSignificant, pretty, prettyExact} from "~/assets/utils.js";
import {getErrorText} from '~/assets/server-error.js';
import BaseAmount from '~/components/common/BaseAmount.vue';
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin.vue';
import FieldPercentage from '~/components/common/FieldPercentage.vue';
import FieldUseMax from '~/components/common/FieldUseMax.vue';
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';

let watcherTimer;
let slippageWatcherTimer;

const INPUT_TYPE = {
    AMOUNT0: 'amount0',
    AMOUNT1: 'amount1',
    AMOUNT1_SLIPPAGE_AMOUNT: 'amount1_slippage_amount',
    AMOUNT1_SLIPPAGE_PERCENT: 'amount1_slippage_percent',
};

export default {
    TX_TYPE,
    INPUT_TYPE,
    SLIPPAGE_INPUT_TYPE,
    components: {
        BaseAmount,
        TxForm,
        FieldCoin,
        FieldPercentage,
        FieldUseMax,
        InputMaskedAmount,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin, AsyncComputedMixin],
    fetch() {
        return getSwapCoinList()
            .then((coinList) => {
                this.poolCoinList = coinList;
            });
    },
    data() {
        return {
            form: {
                coin0: '',
                volume0: '',
                coin1: '',
                maximumVolume1: '',
            },
            formAmount1: '',
            formSlippagePercent1: 5,
            selectedInput: INPUT_TYPE.AMOUNT0,
            selectedSlippageInput: SLIPPAGE_INPUT_TYPE.PERCENT,
            // list of all pools' coins
            poolCoinList: [],
            addressBalance: [],
            debouncedFetchPoolData: null,
        };
    },
    validations() {
        const form = {
            volume0: {
                //@TODO maxValue
                //@TODO validAmount
                required,
            },
            coin0: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
            coin1: {
                required,
                minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
            },
        };

        return {
            form,
            formSlippagePercent1: {
                maxValue: maxValue(100),
            },
            formAmount1: {
            },
        };
    },
    asyncComputed: {
        poolData() {
            // function argument not used, but they are required to trigger computed property recalculation
            return this.debouncedFetchPoolData?.(this.form.coin0, this.form.coin1);
        },
    },
    computed: {
        isPoolLoaded() {
            return this.$asyncComputed.poolData.success && this.poolData?.liquidity;
        },
        whatAffectsAmount() {
            return {
                poolData: this.poolData,
                volume0: this.form.volume0,
                selectedInput: this.selectedInput,
                formSlippagePercent1: this.formSlippagePercent1,
                formAmount1: this.formAmount1,
            };
        },
        whatAffectsSlippage() {
            return {
                selectedSlippageInput: this.selectedSlippageInput,
                formAmount1: this.formAmount1,
                formSlippagePercent1: this.formSlippagePercent1,
                maximumVolume1: this.form.maximumVolume1,
            };
        },
        // intersection of address balance and pool coins
        availableCoinList() {
            return this.addressBalance.filter((balanceItem) => {
                return this.poolCoinList.find((poolCoin) => poolCoin.id === balanceItem.coin.id);
            });
        },
    },
    watch: {
        whatAffectsAmount: {
            handler() {
                // @input and @input.native may fire in different time so timer needed to wait all events
                clearTimeout(watcherTimer);
                watcherTimer = setTimeout(() => {
                    if (!this.isPoolLoaded) {
                        return;
                    }

                    if (this.selectedInput === INPUT_TYPE.AMOUNT0) {
                        if (!this.form.volume0) {
                            this.formAmount1 = '';
                        } else {
                            this.formAmount1 = decreasePrecisionSignificant(new Big(this.form.volume0).div(this.poolData.amount0).times(this.poolData.amount1).toString());
                        }
                    }

                    if (this.selectedInput === INPUT_TYPE.AMOUNT1) {
                        if (!this.formAmount1) {
                            this.form.volume0 = '';
                        } else {
                            this.form.volume0 = stripZeros(new Big(this.formAmount1).div(this.poolData.amount1).times(this.poolData.amount0).toString());
                        }
                    }
                }, 20);
            },
            deep: true,
        },
        whatAffectsSlippage: {
            handler() {
                // @input and @input.native may fire in different time so timer needed to wait all events
                clearTimeout(slippageWatcherTimer);
                slippageWatcherTimer = setTimeout(() => {
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.AMOUNT && this.formAmount1) {
                        const slippageAmount = this.form.maximumVolume1;
                        let slippagePercent;
                        if (!slippageAmount || Number(slippageAmount) < Number(this.formAmount1)) {
                            slippagePercent = 0;
                        } else {
                            slippagePercent = (slippageAmount / this.formAmount1 - 1) * 100;
                        }
                        this.formSlippagePercent1 = decreasePrecisionFixed(slippagePercent);
                    }
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.PERCENT && this.formAmount1) {
                        const slippage = 1 + (this.formSlippagePercent1 || 0) / 100;
                        this.form.maximumVolume1 = decreasePrecisionSignificant(this.formAmount1 * slippage);
                    }
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.PERCENT && this.estimationError) {
                        this.form.maximumVolume1 = 0;
                    }
                });
            },
            deep: true,
        },
    },
    mounted() {
        this.debouncedFetchPoolData = debounce(this.fetchPoolData, 400);

        eventBus.on('activate-add-liquidity', ({coin0, coin1}) => {
            this.form.coin0 = coin0;
            this.form.coin1 = coin1;

            const inputEl = this.$refs.fieldAmount.$el.querySelector('input');
            focusElement(inputEl);
        });
    },
    destroyed() {
        eventBus.off('activate-add-liquidity');
    },
    methods: {
        pretty,
        prettyExact,
        fetchPoolData() {
            // no pair entered
            if (!this.form.coin0 || !this.form.coin1 || this.form.coin0 === this.form.coin1) {
                return;
            }
            if (this.$v.form.coin0.$invalid || this.$v.form.coin1.$invalid) {
                return;
            }

            return getPool(this.form.coin0, this.form.coin1);
        },
        success() {
            eventBus.emit('update-pool-list');
        },
        slippageAmountBlur() {
            // reset to percent if no amount
            if (!this.form.maximumVolume1 && (!this.formSlippagePercent1 || this.formSlippagePercent1 <= 0)) {
                this.selectedSlippageInput = SLIPPAGE_INPUT_TYPE.PERCENT;
                this.formSlippagePercent1 = 5;
            }
        },
        beforeConfirm(txFormContext) {
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            txFormContext.isFormSending = true;
            txFormContext.serverError = '';
            txFormContext.serverSuccess = '';
            return this.fetchPoolData()
                .then(() => {
                    txFormContext.isFormSending = false;
                })
                .catch((error) => {
                    txFormContext.isFormSending = false;
                    txFormContext.serverError = getErrorText(error);
                    throw error;
                });
        },
        reverseCoins() {
            const coin0 = this.form.coin0;
            const coin0Amount = this.form.volume0;
            this.form.coin0 = this.form.coin1;
            this.form.coin1 = coin0;
            this.form.volume0 = this.formAmount1;
            this.formAmount1 = coin0Amount;
            // if (this.selectedInput === INPUT_TYPE.AMOUNT0) {
            //     this.selectedInput = INPUT_TYPE.AMOUNT1;
            // } else if (this.selectedInput === INPUT_TYPE.AMOUNT1) {
            //     this.selectedInput = INPUT_TYPE.AMOUNT0;
            // }
        },
        clearForm() {
            this.form.volume0 = '';
            this.form.coin0 = '';
            this.form.coin1 = '';
            this.form.maximumVolume1 = '';

            this.formAmount1 = '';
            this.formSlippagePercent1 = 5;
            this.selectedInput = INPUT_TYPE.AMOUNT0;
            this.selectedSlippageInput = SLIPPAGE_INPUT_TYPE.PERCENT;
            this.$v.$reset();
        },
    },
};
</script>

<template>
    <TxForm
        :txData="form"
        :$txData="$v.form"
        :txType="$options.TX_TYPE.ADD_LIQUIDITY"
        :before-confirm-modal-show="beforeConfirm"
        @update:addressBalance="addressBalance = $event"
        @success-tx="success()"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Add liquidity to swap pool', 'pool.add-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Choose pair of coins the coins that you own and specify the amount you would like to add.', 'pool.add-description') }}
            </p>
        </template>

        <template v-slot:extra-panel="{fee, addressBalance}">
            <div class="panel__section panel__section--medium">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                        <FieldCoin
                            v-model="form.coin0"
                            :$value="$v.form.coin0"
                            :label="$td('First coin', 'form.pool-coin0')"
                            :coin-list="availableCoinList"
                            :select-mode="true"
                        />
                        <span class="form-field__error" v-if="$v.form.coin0.$dirty && !$v.form.coin0.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <!--<span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                        <FieldUseMax
                            ref="fieldAmount"
                            v-model="form.volume0"
                            :$value="$v.form.volume0"
                            :label="(form.coin0 || $td('First coin', 'form.pool-coin0')) + ' ' + $td('amount', 'form.pool-remove-amount')"
                            :selected-coin-symbol="form.coin0"
                            :fee="fee"
                            :address-balance="addressBalance"
                            @input.native="selectedInput = $options.INPUT_TYPE.AMOUNT0"
                            @use-max="selectedInput = $options.INPUT_TYPE.AMOUNT0"
                        />
                        <span class="form-field__error" v-if="$v.form.volume0.$dirty && !$v.form.volume0.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
                    </div>
                </div>
            </div>
            <div class="icon-divider">
                <button class="icon-divider__icon u-semantic-button" type="button" @click="reverseCoins">
                    <img class="" :src="`${BASE_URL_PREFIX}/img/icon-reverse.svg`" width="24" height="24" alt="" role="presentation"/>
                </button>
            </div>
            <div class="panel__section panel__section--medium">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                        <FieldCoin
                            v-model="form.coin1"
                            :$value="$v.form.coin1"
                            :label="$td('Second coin', 'form.pool-coin1')"
                            :coin-list="availableCoinList"
                            :select-mode="true"
                        />
                        <span class="form-field__error" v-if="$v.form.coin1.$dirty && !$v.form.coin1.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <!--<span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                        <FieldUseMax
                            v-model="formAmount1"
                            :$value="$v.formAmount1"
                            :label="(form.coin1 || $td('Second coin', 'form.pool-coin1')) + ' ' + $td('amount', 'form.pool-remove-amount')"
                            :selected-coin-symbol="form.coin1"
                            :address-balance="addressBalance"
                            @input.native="selectedInput = $options.INPUT_TYPE.AMOUNT1"
                            @use-max="selectedInput = $options.INPUT_TYPE.AMOUNT1"
                        />
                        <div class="form-field__help">
                            {{ $td('Estimated, depends on the pool ratio', 'form.pool-remove-amount-help') }}
                        </div>
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                        <FieldPercentage
                            v-model="formSlippagePercent1"
                            :$value="$v.formSlippagePercent1"
                            :label="(form.coin1 || $td('Second coin', 'form.pool-coin1')) + ' ' + $td('slippage tolerance', 'form.pool-remove-slippage')"
                            min-value="0"
                            max-value="100"
                            :allow-decimal="true"
                            @input.native="selectedSlippageInput = $options.SLIPPAGE_INPUT_TYPE.PERCENT"
                        />
                        <span class="form-field__error" v-if="!$v.formSlippagePercent1.maxValue">{{ $td('Maximum 100%', 'form.percent-error-max') }}</span>
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                        <label class="form-field">
                            <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                               v-model="form.maximumVolume1"
                                               @input.native="selectedSlippageInput = $options.SLIPPAGE_INPUT_TYPE.AMOUNT"
                                               @blur="slippageAmountBlur"
                            />
                            <span class="form-field__label">{{ form.coin1 || $td('Second coin', 'form.pool-coin0') }} {{ $td('max amount to spend', 'form.pool-add-max-amount') }}</span>
                        </label>
                        <div class="form-field__help">
                            {{ $td('Default:', 'form.help-default') }} 10^15
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!--        <template v-slot:default="{fee, addressBalance}">-->
        <!--        </template>-->

        <template v-slot:submit-title>
            {{ $td('Add', 'form.pool-add-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-pool.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Add liquidity to swap pool', 'pool.add-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coin0" :amount="form.volume0" :exact="true"/>
                        <div class="form-field__label">{{ $td('First coin', 'form.pool-coin0') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            ≈<BaseAmount :coin="form.coin1" :amount="formAmount1"/>
                            <span class="u-text-muted">({{ form.maximumVolume1 }} maximum)</span>
                        </div>
                        <div class="form-field__label">{{ $td('Second coin', 'form.pool-coin1') }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
