<script>
import {validationMixin} from 'vuelidate/src/index.js';
import required from 'vuelidate/src/validators/required.js';
import minValue from 'vuelidate/src/validators/minValue.js';
import maxValue from 'vuelidate/src/validators/maxValue.js';
import minLength from 'vuelidate/src/validators/minLength.js';
import maxLength from 'vuelidate/src/validators/maxLength.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import {estimateCoinSell} from '~/api/gate';
import {getSwapCoinList} from '@/api/explorer.js';
import debounce from '~/assets/lodash5-debounce.js';
import checkEmpty from '~/assets/v-check-empty';
import {getErrorText} from "~/assets/server-error";
import {pretty, prettyExact, decreasePrecisionSignificant, decreasePrecisionFixed} from "~/assets/utils.js";
import {SWAP_TYPE, COIN_TYPE, SLIPPAGE_INPUT_TYPE, DEFAULT_SLIPPAGE} from '~/assets/variables.js';
import BaseAmount from '~/components/common/BaseAmount.vue';
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin';
import FieldPercentage from '~/components/common/FieldPercentage.vue';
import InputMaskedAmount from '~/components/common/InputMaskedAmount.vue';
import Loader from '~/components/common/Loader';

let watcherTimer;

export default {
    TX_TYPE,
    CONVERT_TYPE: SWAP_TYPE,
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
        return getSwapCoinList()
            .then((swapCoinList) => {
                let poolSwapableMap = {};
                swapCoinList.forEach((item) => {
                    poolSwapableMap[item.id] = true;
                });

                this.poolSwapableMap = Object.freeze(poolSwapableMap);
            });
    },
    data() {
        return {
            form: {
                coinFrom: '',
                coinTo: '',
                minimumValueToBuy: '',
            },
            formSlippagePercent: DEFAULT_SLIPPAGE,
            selectedSlippageInput: SLIPPAGE_INPUT_TYPE.PERCENT,
            estimation: null,
            estimationType: null,
            estimationRoute: null,
            isEstimationLoading: false,
            estimationError: false,
            isEstimationPending: false,
            debouncedGetEstimation: null,
            //@TODO disable optimal in offline mode
            selectedConvertType: SWAP_TYPE.OPTIMAL,
            txForm: {},
            addressBalance: [],
            poolSwapableMap: {},
        };
    },
    validations() {
        const form = {
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
                maxValue: maxValue(100),
            },
        };
    },
    computed: {
        sellAmount() {
            const coinSellItem = this.addressBalance.find((item) => item.coin.symbol === this.form.coinFrom);
            return coinSellItem && coinSellItem.amount;
        },
        // replace invalid POOL_DIRECT with POOL
        // used for estimate
        preConvertType() {
            if (this.selectedConvertType === SWAP_TYPE.POOL_DIRECT) {
                return SWAP_TYPE.POOL;
            } else {
                return this.selectedConvertType;
            }
        },
        // POOL or BANCOR
        // used for tx type
        convertType() {
            if (this.preConvertType === SWAP_TYPE.OPTIMAL) {
                return this.estimationType;
            } else {
                return this.preConvertType;
            }
        },
        txType() {
            if (this.convertType === SWAP_TYPE.POOL) {
                return TX_TYPE.SELL_ALL_SWAP_POOL;
            }
            return TX_TYPE.SELL_ALL;
        },
        txData() {
            return {
                ...(this.txType === TX_TYPE.SELL_ALL ? {
                    coinToSell: this.form.coinFrom,
                    coinToBuy: this.form.coinTo,
                } : {
                    coins: this.estimationRoute
                        ? this.estimationRoute.map((coin) => coin.id)
                        : [this.form.coinFrom, this.form.coinTo],
                }),
                minimumValueToBuy: this.form.minimumValueToBuy || 0,
            };
        },
        tradableCoinList() {
            return this.$store.state.explorer.coinList
                .filter((coinItem) => {
                    // coin with reserve
                    if (coinItem.type === COIN_TYPE.COIN) {
                        return true;
                    }
                    // swapable within pool
                    if (this.poolSwapableMap[coinItem.id]) {
                        return true;
                    }
                    return false;
                })
                .map((coinItem) => coinItem.symbol);
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
                minimumValueToBuy: this.form.minimumValueToBuy,
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
                // @input and @input.native may fire in different time so timer needed to wait all events
                clearTimeout(watcherTimer);
                watcherTimer = setTimeout(() => {
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.AMOUNT && this.currentEstimation) {
                        const slippageAmount = this.form.minimumValueToBuy;
                        let slippagePercent;
                        if (!slippageAmount || Number(slippageAmount) > Number(this.currentEstimation)) {
                            slippagePercent = 0;
                        } else {
                            slippagePercent = (1 - slippageAmount / this.currentEstimation) * 100;
                        }
                        this.formSlippagePercent = decreasePrecisionFixed(slippagePercent);
                    }
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.PERCENT && this.currentEstimation) {
                        let slippage = 1 - (this.formSlippagePercent || 0) / 100;
                        if (slippage < 0) {
                            slippage = 0;
                        }
                        this.form.minimumValueToBuy = decreasePrecisionSignificant(this.currentEstimation * slippage);
                    }
                    if (this.selectedSlippageInput === SLIPPAGE_INPUT_TYPE.PERCENT && this.estimationError) {
                        this.form.minimumValueToBuy = 0;
                    }
                });
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
            if (!this.form.minimumValueToBuy && (!this.formSlippagePercent || this.formSlippagePercent <= 0)) {
                this.selectedSlippageInput = SLIPPAGE_INPUT_TYPE.PERCENT;
                this.formSlippagePercent = DEFAULT_SLIPPAGE;
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
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            if (this.$v.form.$invalid) {
                return;
            }
            if (!this.sellAmount) {
                this.estimationError = `There are no ${this.form.coinFrom} on your balance`;
                return Promise.reject(this.estimationError);
            }
            this.isEstimationLoading = true;
            this.estimationError = false;
            return estimateCoinSell({
                coinToSell: this.form.coinFrom,
                valueToSell: this.sellAmount,
                coinToBuy: this.form.coinTo,
                swapFrom: this.preConvertType,
                findRoute: this.selectedConvertType !== SWAP_TYPE.POOL_DIRECT,
                // gasCoin not used in sellAll
                // gasCoin: this.txForm.gasCoin || 0,
                sellAll: true,
            }, {
                idPreventConcurrency: 'convertSellAll',
                //@TODO debounceAdapter can be reworked to support flush, cancel, and pending
                // idDebounce: 'convertSellAll',
            })
                .then((result) => {
                    this.estimation = result.will_get;
                    this.estimationType = result.swap_from;
                    this.estimationRoute = result.route;
                    this.isEstimationLoading = false;
                })
                .catch((error) => {
                    if (error.isCanceled) {
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
            this.form.coinFrom = '';
            this.form.coinTo = '';
            this.form.minimumValueToBuy = '';
            this.$v.$reset();

            this.selectedConvertType = SWAP_TYPE.OPTIMAL;
            this.selectedSlippageInput = SLIPPAGE_INPUT_TYPE.PERCENT;
            if (this.formSlippagePercent > DEFAULT_SLIPPAGE) {
                this.formSlippagePercent = DEFAULT_SLIPPAGE;
            }
        },
    },
};
</script>

<template>
    <TxForm
        data-test-id="convertSellAll"
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
                {{ $td('Sell all coins', 'convert.sell-all-title') }}
            </h1>
            <p class="panel__header-description">
                {{ $td('Sell all of the coins that you possess in a single click and pay fee with the same coin you sell.', 'convert.sell-all-description') }}
            </p>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell">
                <div class="form-check-label">Swap type</div>
                <div class="form-check-group">
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
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    data-test-id="convertSellAllInputSellCoin"
                    v-model.trim="form.coinFrom"
                    :$value="$v.form.coinFrom"
                    :label="$td('Coin to sell', 'form.convert-sell-coin-sell')"
                    :coin-list="tradableAddressBalance"
                    :select-mode="true"
                    @blur="inputBlur()"
                />
                <span class="form-field__error" v-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinFrom.$dirty && !$v.form.coinFrom.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-2">
                <FieldCoin
                    data-test-id="convertSellAllInputBuyCoin"
                    v-model.trim="form.coinTo"
                    :$value="$v.form.coinTo"
                    :label="$td('Coin to get', 'form.convert-sell-coin-get')"
                    :coin-list="tradableCoinList"
                    @blur="inputBlur()"
                />
                <span class="form-field__error" v-if="$v.form.coinTo.$dirty && !$v.form.coinTo.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coinTo.$dirty && !$v.form.coinTo.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--medium--1-3" v-if="!$store.getters.isOfflineMode">
                <div class="form-field form-field--dashed" :class="{'is-error': isEstimationErrorVisible}">
                    <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinTo" :amount="currentEstimation" prefix="≈"/>
                    <div class="form-field__label">{{ $td('You will get approximately', 'form.convert-sell-receive-estimation') }}</div>
                    <Loader class="form-field__icon form-field__icon--loader" :isLoading="isEstimationWaiting"/>
                    <span class="form-field__error" v-if="isEstimationErrorVisible" data-test-id="estimationError">{{ estimationError }}</span>
                </div>
            </div>
            <div class="u-cell u-cell--medium--1-3" v-if="!$store.getters.isOfflineMode">
                <FieldPercentage
                    v-model="formSlippagePercent"
                    :$value="$v.formSlippagePercent"
                    :label="$td('Slippage tolerance', 'form.swap-slippage')"
                    min-value="0"
                    max-value="100"
                    :allow-decimal="true"
                    @input.native="selectedSlippageInput = $options.SLIPPAGE_INPUT_TYPE.PERCENT"
                />
                <span class="form-field__error" v-if="!$v.formSlippagePercent.maxValue">{{ $td('Maximum 100%', 'form.percent-error-max') }}</span>
            </div>
            <div class="u-cell u-cell--medium--1-3">
                <label class="form-field">
                    <InputMaskedAmount
                        class="form-field__input" type="text" inputmode="decimal" v-check-empty
                        v-model="form.minimumValueToBuy"
                        @input.native="selectedSlippageInput = $options.SLIPPAGE_INPUT_TYPE.AMOUNT"
                        @blur="slippageAmountBlur"
                    />
                    <span class="form-field__label">{{ $td('Min amount to get (optional)', 'form.convert-sell-min') }}</span>
                </label>
                <div class="form-field__help">
                    {{ $td('Default:', 'form.help-default') }} 0
                </div>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Sell all', 'form.convert-sell-button') }}
        </template>

        <template v-slot:panel-footer>
            <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                <div class="u-cell u-cell--medium--1-2">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            <template v-if="currentEstimation && convertType === $options.CONVERT_TYPE.POOL">
                                Pools:
                                {{ estimationRoute ? estimationRoute.map((coin) => coin.symbol).join(' > ') : form.coinFrom + ' > ' + form.coinTo }}
                            </template>
                            <template v-else-if="currentEstimation && convertType === $options.CONVERT_TYPE.BANCOR">Reserves</template>
                            <template v-else>—</template>
                        </div>
                        <div class="form-field__label">{{ $td('Swap type', 'form.convert-type') }}</div>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--medium--1-4">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinTo" :amount="currentEstimation ? estimation / sellAmount : 0"/>
                        <div class="form-field__label">1 {{ form.coinFrom || 'coin to sell' }} {{ $td('rate', 'form.convert-rate') }}</div>
                    </div>
                </div>
                <div class="u-cell u-cell--1-2 u-cell--medium--1-4">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinFrom" :amount="currentEstimation ? sellAmount / estimation : 0"/>
                        <div class="form-field__label">1 {{ form.coinTo || 'coin to get' }} {{ $td('rate', 'form.convert-rate') }}</div>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-convert.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Convert Coins', 'convert.convert-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinFrom" :amount="sellAmount" :exact="true"/>
                        <div class="form-field__label">{{ $td('You will send', 'form.convert-sell-confirm-send') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            <BaseAmount v-if="estimation" :coin="form.coinTo" :amount="estimation" prefix="≈"/>
                            <template v-else>{{ form.coinTo }}</template>
                            <span class="u-text-muted u-display-ib">(min: {{ prettyExact(txData.minimumValueToBuy) }})</span>
                        </div>
                        <div class="form-field__label">
                            <template v-if="estimation">{{ $td('You will get approximately *', 'form.convert-sell-confirm-receive-estimation') }}</template>
                            <template v-else>{{ $td('You will get', 'form.convert-sell-confirm-receive') }}</template>
                        </div>
                    </div>
                    <div class="form-field__help u-text-left">
                        {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above but can\'t exceed the limit.', 'form.convert-confirm-note') }}
                    </div>
                </div>
                <template v-if="estimation">
                    <div class="u-cell u-cell--1-2">
                        <div class="form-field form-field--dashed">
                            <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinTo" :amount="estimation / sellAmount"/>
                            <div class="form-field__label">1 {{ form.coinFrom }} {{ $td('rate', 'form.convert-rate') }}</div>
                        </div>
                    </div>
                    <div class="u-cell u-cell--1-2">
                        <div class="form-field form-field--dashed">
                            <BaseAmount tag="div" class="form-field__input is-not-empty" :coin="form.coinFrom" :amount="sellAmount / estimation"/>
                            <div class="form-field__label">1 {{ form.coinTo }} {{ $td('rate', 'form.convert-rate') }}</div>
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
