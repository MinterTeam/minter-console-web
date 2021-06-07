<script>
    import axios from 'axios';
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minLength from 'vuelidate/lib/validators/minLength';
    import maxLength from 'vuelidate/lib/validators/maxLength';
    import minValue from 'vuelidate/lib/validators/minValue.js';
    import maxValue from 'vuelidate/lib/validators/maxValue.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
    import {estimateCoinBuy} from '~/api/gate';
    import {getCoinList, getSwapCoinList} from '@/api/explorer.js';
    import debounce from '~/assets/lodash5-debounce.js';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {pretty, prettyExact, decreasePrecisionSignificant, decreasePrecisionFixed} from "~/assets/utils.js";
    import {CONVERT_TYPE, COIN_TYPE, SLIPPAGE_INPUT_TYPE} from '~/assets/variables.js';
    import BaseAmount from '~/components/common/BaseAmount.vue';
    import TxForm from '~/components/common/TxForm.vue';
    import FieldCoin from '~/components/common/FieldCoin';
    import FieldPercentage from '~/components/common/FieldPercentage.vue';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';
    import Loader from '~/components/common/Loader';

    let estimationCancel;
    const CANCEL_MESSAGE = 'Cancel previous request';

    export default {
        TX_TYPE,
        CONVERT_TYPE,
        SLIPPAGE_INPUT_TYPE,
        components: {
            BaseAmount,
            TxForm,
            FieldCoin,
            FieldPercentage,
            InputMaskedAmount,
            Loader,
        },
        directives: {
            checkEmpty,
        },
        mixins: [validationMixin],
        fetch() {
            return Promise.all([getCoinList(), getSwapCoinList()])
                .then(([coinList, swapCoinList]) => {
                    const tradableCoinList = coinList.filter((coinItem) => {
                        // coin with reserve
                        if (coinItem.type === COIN_TYPE.COIN) {
                            return true;
                        }
                        // swapable within pool
                        if (swapCoinList.find((swapCoinItem) => swapCoinItem.id === coinItem.id)) {
                            return true;
                        }
                        return false;
                    });

                    this.tradableCoinList = tradableCoinList.map((coinItem) => coinItem.symbol);
                });
        },
        data() {
            return {
                form: {
                    buyAmount: '',
                    coinFrom: '',
                    coinTo: '',
                    maximumValueToSell: '',
                },
                formSlippagePercent: '5',
                selectedSlippageInput: SLIPPAGE_INPUT_TYPE.PERCENT,
                estimation: null,
                estimationType: null,
                estimationRoute: null,
                isEstimationLoading: false,
                estimationError: false,
                isEstimationPending: false,
                debouncedGetEstimation: null,
                //@TODO disable optimal in offline mode
                selectedConvertType: CONVERT_TYPE.OPTIMAL,
                txForm: {},
                addressBalance: [],
                tradableCoinList: [],
            };
        },
        validations() {
            const form = {
                buyAmount: {
                    required,
                },
                coinFrom: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
                coinTo: {
                    required,
                    minLength: this.$store.getters.isOfflineMode ? () => true : minLength(3),
                },
            };

            return {
                form,
                formSlippagePercent: {
                },
            };
        },
        computed: {
            // replace invalid POOL_DIRECT with POOL
            // used for estimate
            preConvertType() {
                if (this.selectedConvertType === CONVERT_TYPE.POOL_DIRECT) {
                    return CONVERT_TYPE.POOL;
                } else {
                    return this.selectedConvertType;
                }
            },
            // POOL or BANCOR
            // used for tx type
            convertType() {
                if (this.preConvertType === CONVERT_TYPE.OPTIMAL) {
                    return this.estimationType;
                } else {
                    return this.preConvertType;
                }
            },
            txType() {
                if (this.convertType === CONVERT_TYPE.POOL) {
                    return TX_TYPE.BUY_SWAP_POOL;
                }
                return TX_TYPE.BUY;
            },
            txData() {
                return {
                    ...(this.txType === TX_TYPE.BUY ? {
                        coinToSell: this.form.coinFrom,
                        coinToBuy: this.form.coinTo,
                    } : {
                        coins: this.estimationRoute
                            ? this.estimationRoute.map((coin) => coin.id)
                            : [this.form.coinFrom, this.form.coinTo],
                    }),
                    valueToBuy: this.form.buyAmount,
                    maximumValueToSell: this.form.maximumValueToSell || 10**15,
                };
            },
            tradableAddressBalance() {
                return this.addressBalance.filter((balanceItem) => {
                    return this.tradableCoinList.find((coinSymbol) => balanceItem.coin.symbol === coinSymbol);
                });
            },
            whatAffectsSlippage() {
                return {
                    selectedSlippageInput: this.selectedSlippageInput,
                    currentEstimation: this.currentEstimation,
                    formSlippagePercent: this.formSlippagePercent,
                    maximumValueToSell: this.form.maximumValueToSell,
                };
            },
            currentEstimation() {
                if (this.$v.form.$invalid || !this.estimation || this.isEstimationWaiting || this.estimationError) {
                    return 0;
                }

                return this.estimation;
            },
            isEstimationWaiting() {
                return this.isEstimationPending || this.isEstimationLoading;
            },
            isEstimationErrorVisible() {
                return this.estimationError && !this.isEstimationWaiting;
            },
        },
        watch: {
            'form.buyAmount': function() {
                this.watchForm();
            },
            'form.coinFrom': function() {
                this.watchForm();
            },
            'form.coinTo': function() {
                this.watchForm();
            },
            'selectedConvertType': function() {
                this.forceEstimation();
            },
            whatAffectsSlippage: {
                handler() {
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.AMOUNT && this.currentEstimation) {
                        const slippageAmount = this.form.maximumValueToSell;
                        let slippagePercent;
                        if (!slippageAmount || slippageAmount < this.currentEstimation) {
                            slippagePercent = 0;
                        } else {
                            slippagePercent = (slippageAmount / this.currentEstimation - 1) * 100;
                        }
                        this.formSlippagePercent = decreasePrecisionFixed(slippagePercent);
                    }
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.PERCENT && this.currentEstimation) {
                        const slippage = (this.formSlippagePercent || 0) / 100 + 1;
                        this.form.maximumValueToSell = decreasePrecisionSignificant(this.currentEstimation * slippage);
                    }
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.PERCENT && this.estimationError) {
                        this.form.maximumValueToSell = 0;
                    }
                },
                deep: true,
            },
        },
        created() {
            this.debouncedGetEstimation = debounce(this.getEstimation, 1000);
        },
        methods: {
            pretty,
            prettyExact,
            inputBlur() {
                // force estimation after blur if estimation was delayed
                if (this.debouncedGetEstimation.pending()) {
                    this.debouncedGetEstimation.flush();
                }
            },
            slippageAmountBlur() {
                // reset to percent if no amount
                if (!this.form.maximumValueToSell && (!this.formSlippagePercent || this.formSlippagePercent <= 0)) {
                    this.selectedSlippageInput = SLIPPAGE_INPUT_TYPE.PERCENT;
                    this.formSlippagePercent = 5;
                }
            },
            watchForm() {
                if (this.$store.getters.isOfflineMode) {
                    return;
                }
                if (this.$v.form.$invalid) {
                    return;
                }
                this.debouncedGetEstimation();
                this.isEstimationPending = true;
            },
            getEstimation() {
                this.isEstimationPending = false;
                if (this.isEstimationLoading && typeof estimationCancel === 'function') {
                    estimationCancel(CANCEL_MESSAGE);
                }
                if (this.$store.getters.isOfflineMode) {
                    return;
                }
                if (this.$v.form.$invalid) {
                    return;
                }
                this.isEstimationLoading = true;
                this.estimationError = false;
                return estimateCoinBuy({
                    coinToBuy: this.form.coinTo,
                    valueToBuy: this.form.buyAmount,
                    coinToSell: this.form.coinFrom,
                    swapFrom: this.preConvertType,
                    findRoute: this.selectedConvertType !== CONVERT_TYPE.POOL_DIRECT,
                    gasCoin: this.txForm.gasCoin || 0,
                }, {
                    cancelToken: new axios.CancelToken((cancelFn) => estimationCancel = cancelFn),
                })
                    .then((result) => {
                        this.estimation = result.will_pay;
                        this.estimationType = result.swap_from;
                        this.estimationRoute = result.route;
                        this.isEstimationLoading = false;
                    })
                    .catch((error) => {
                        if (error.message === CANCEL_MESSAGE) {
                            return;
                        }
                        this.isEstimationLoading = false;
                        this.estimationError = getErrorText(error, 'Estimation error: ');
                    });
            },
            forceEstimation() {
                // force new estimation without delay
                this.debouncedGetEstimation();
                return this.debouncedGetEstimation.flush();
            },
            beforeConfirm(txFormContext) {
                if (this.$store.getters.isOfflineMode) {
                    return;
                }
                txFormContext.isFormSending = true;
                txFormContext.serverError = '';
                txFormContext.serverSuccess = '';
                //@TODO in case if last estimation still loading we can use it instead of forcing new estimation
                return this.forceEstimation()
                    .then(() => {
                        txFormContext.isFormSending = false;
                        // error already caught, it can be checked in estimationError
                        if (this.estimationError) {
                            return Promise.reject(this.estimationError);
                        }
                    });
            },
            clearForm() {
                this.form.buyAmount = '';
                this.form.coinFrom = '';
                this.form.coinTo = '';
                this.form.maximumValueToSell = '';
                this.$v.$reset();

                this.selectedConvertType = CONVERT_TYPE.OPTIMAL;
                this.selectedSlippageInput = SLIPPAGE_INPUT_TYPE.PERCENT;
                this.formSlippagePercent = 5;
            },
        },
    };
</script>

<template>
    <TxForm
        data-test-id="convertBuy"
        :txData="txData"
        :$txData="$v.form"
        :txType="txType"
        :before-confirm-modal-show="beforeConfirm"
        @update:addressBalance="addressBalance = $event"
        @update:txForm="txForm = $event"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Buy coins', 'convert.buy-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('If you want to buy a specific coin, you can do it here.', 'convert.buy-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell">
                <div class="form-check-label">Swap type</div>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.CONVERT_TYPE.OPTIMAL" v-model="selectedConvertType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Auto', 'form.convert-type-auto') }}</span>
                </label>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.CONVERT_TYPE.BANCOR" v-model="selectedConvertType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Reserves', 'form.convert-type-bancor') }}</span>
                </label>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.CONVERT_TYPE.POOL" v-model="selectedConvertType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Pools', 'form.convert-type-pool') }}</span>
                </label>
                <label class="form-check">
                    <input type="radio" class="form-check__input" name="convert-type" :value="$options.CONVERT_TYPE.POOL_DIRECT" v-model="selectedConvertType">
                    <span class="form-check__label form-check__label--radio">{{ $td('Direct pool', 'form.convert-type-pool-direct') }}</span>
                </label>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    data-test-id="convertBuyInputBuyCoin"
                    v-model.trim="form.coinTo"
                    :$value="$v.form.coinTo"
                    :label="$td('Coin to buy', 'form.convert-buy-coin-buy')"
                    :coin-list="tradableCoinList"
                    @blur="inputBlur()"
                />
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field" :class="{'is-error': $v.form.buyAmount.$error}">
                    <InputMaskedAmount
                        data-test-id="convertBuyInputBuyAmount"
                        class="form-field__input" v-check-empty
                        v-model="form.buyAmount"
                        @blur="$v.form.buyAmount.$touch(); inputBlur()"
                    />
                    <span class="form-field__label">{{ $td('Buy amount', 'form.convert-buy-amount') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.buyAmount.$dirty && !$v.form.buyAmount.required">{{ $td('Enter amount', 'form.amount-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    data-test-id="convertBuyInputSellCoin"
                    v-model.trim="form.coinFrom"
                    :$value="$v.form.coinFrom"
                    :label="$td('Coin to spend', 'form.convert-buy-coin-spend')"
                    :coin-list="tradableAddressBalance"
                    @blur="inputBlur()"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2" v-if="!$store.getters.isOfflineMode">
                <div class="form-field form-field--dashed" :class="{'is-error': isEstimationErrorVisible}">
                    <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinFrom" :amount="currentEstimation" prefix="≈ "/>
                    <div class="form-field__label">{{ $td('You will pay approximately', 'form.convert-buy-pay-estimation') }}</div>
                    <Loader class="form-field__icon form-field__icon--loader" :isLoading="isEstimationWaiting"/>
                    <span class="form-field__error" v-if="isEstimationErrorVisible">{{ estimationError }}</span>
                </div>
            </div>
            <div class="u-cell u-cell--medium--1-2" v-if="!$store.getters.isOfflineMode">
                <FieldPercentage
                    v-model="formSlippagePercent"
                    :$value="$v.formSlippagePercent"
                    :label="$td('Slippage tolerance', 'form.swap-slippage')"
                    :class="{'is-error': formSlippagePercent > 100}"
                    min-value="0"
                    max-value="100"
                    :allow-decimal="true"
                    @input.native="selectedSlippageInput = $options.SLIPPAGE_INPUT_TYPE.PERCENT"
                />
                <span class="form-field__error" v-if="formSlippagePercent > 100">{{ $td('Slippage to high', 'form.swap-slippage-error-high') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <label class="form-field">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.maximumValueToSell"
                                       @input.native="selectedSlippageInput = $options.SLIPPAGE_INPUT_TYPE.AMOUNT"
                                       @blur="slippageAmountBlur"
                    />
                    <span class="form-field__label">{{ $td('Max amount to spend (optional)', 'form.convert-buy-max') }}</span>
                </label>
                <div class="form-field__help">
                    {{ $td('Default:', 'form.help-default') }} 10^15
                </div>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Buy', 'form.convert-buy-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-convert.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Convert сoins', 'convert.convert-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinTo" :amount="form.buyAmount" :exact="true"/>
                        <div class="form-field__label">{{ $td('You buy', 'form.convert-buy-confirm-get') }}</div>
                    </div>
                </div>
                <div class="u-cell" v-if="estimation">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinFrom" :amount="estimation" prefix="≈ "/>
                        <div class="form-field__label">{{ $td('You will pay approximately *', 'form.convert-buy-confirm-pay-estimation') }}</div>
                    </div>
                    <div class="form-field__help u-text-left">
                        {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.convert-confirm-note') }}
                    </div>
                </div>
                <div class="u-cell" v-else>
                    <label class="form-field form-field--dashed">
                        <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                               :value="form.coinFrom"
                        >
                        <span class="form-field__label">{{ $td('You will pay', 'form.convert-buy-confirm-pay') }}</span>
                    </label>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinFrom" :amount="txData.maximumValueToSell" :exact="true"/>
                        <div class="form-field__label">{{ $td('Max amount to spend', 'form.convert-buy-confirm-max') }}</div>
                    </div>
                </div>
                <template v-if="estimation">
                    <div class="u-cell">
                        <div class="form-field form-field--dashed">
                            <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinFrom" :amount="estimation / form.buyAmount"/>
                            <div class="form-field__label">1 {{ form.coinTo }} {{ $td('rate', 'form.convert-rate') }}</div>
                        </div>
                    </div>
                    <div class="u-cell">
                        <div class="form-field form-field--dashed">
                            <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinTo" :amount="form.buyAmount / estimation"/>
                            <div class="form-field__label">1 {{ form.coinFrom }} {{ $td('rate', 'form.convert-rate') }}</div>
                        </div>
                    </div>
                </template>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            <template v-if="convertType === $options.CONVERT_TYPE.POOL">
                                Pools:
                                {{ estimationRoute ? estimationRoute.map((coin) => coin.symbol).join(' > ') : form.coinFrom + ' > ' + form.coinTo }}
                            </template>
                            <template v-else>Reserves</template>
                        </div>
                        <div class="form-field__label">{{ $td('Swap type', 'form.convert-type') }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
