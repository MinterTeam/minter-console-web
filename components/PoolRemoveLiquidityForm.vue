<script>
import Big from '~/assets/big.js';
import {AsyncComputedMixin} from 'vue-async-computed/src/index.js';
import debounce from 'debounce-promise';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required';
import minLength from 'vuelidate/lib/validators/minLength';
import maxLength from 'vuelidate/lib/validators/maxLength';
import minValue from 'vuelidate/lib/validators/minValue.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import {TX_TYPE} from 'minterjs-util/src/tx-types.js';
import eventBus from '~/assets/event-bus.js';
import focusElement from '~/assets/focus-element.js';
import {getCoinId} from '~/api/gate.js';
import {getPoolProvider, getProviderPoolList} from '~/api/explorer.js';
import checkEmpty from '~/assets/v-check-empty';
import {getErrorText} from "~/assets/server-error";
import {decreasePrecisionFixed, decreasePrecisionSignificant, pretty, prettyExact} from "~/assets/utils";
import BaseAmount from '~/components/common/BaseAmount.vue';
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin';
import FieldPercentage from '~/components/common/FieldPercentage.vue';
import FieldUseMax from '~/components/common/FieldUseMax';

let watcherTimer;

const INPUT_TYPE = {
    AMOUNT0: 'amount0',
    AMOUNT1: 'amount1',
    LIQUIDITY_AMOUNT: 'liquidity_amount',
    LIQUIDITY_PERCENT: 'liquidity_percent',
};

export default {
    TX_TYPE,
    INPUT_TYPE,
    components: {
        BaseAmount,
        TxForm,
        FieldCoin,
        FieldPercentage,
        FieldUseMax,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin, AsyncComputedMixin],
    fetch() {
        //@TODO fetch all pages
        getProviderPoolList(this.$store.getters.address, {limit: 1000})
            .then((info) => {
                const poolList = info.data;
                let coinList = {};
                poolList.forEach((pool) => {
                    coinList[pool.coin0.symbol] = {
                        coin: pool.coin0,
                        amount: pool.amount0,
                    };
                    coinList[pool.coin1.symbol] = {
                        coin: pool.coin1,
                        amount: pool.amount1,
                    };
                });

                this.poolCoinList = Object.values(coinList);
            });
    },
    data() {
        return {
            form: {
                liquidity: '',
                coin0: '',
                coin1: '',
            },
            formLiquidityPercent: '',
            formAmount0: '',
            formAmount1: '',
            formSlippagePercent0: '5',
            formSlippagePercent1: '5',
            selectedInput: INPUT_TYPE.LIQUIDITY_PERCENT,
            // list of own pools' coins
            poolCoinList: [],
            debouncedFetchAddressLiquidity: null,
        };
    },
    validations() {
        const form = {
            liquidity: {
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
            formLiquidityPercent: {
                //@TODO maxValue
                //@TODO validAmount
                required,
                minValue: minValue(0),
                maxValue: maxValue(100),
            },
            formAmount0: {
            },
            formAmount1: {
            },
            formSlippagePercent0: {
                maxValue: maxValue(100),
            },
            formSlippagePercent1: {
                maxValue: maxValue(100),
            },
            isPoolLoaded: {
                success: (value) => !!value,
            },
        };
    },
    asyncComputed: {
        addressLiquidityData() {
            return this.debouncedFetchAddressLiquidity?.(this.form.coin0, this.form.coin1);
        },
    },
    computed: {
        isPoolLoaded() {
            return this.$asyncComputed.addressLiquidityData.success && this.addressLiquidityData?.liquidity;
        },
        whatAffectsLiquidity() {
            return {
                addressLiquidityData: this.addressLiquidityData,
                selectedInput: this.selectedInput,
                liquidity: this.form.liquidity,
                formLiquidityPercent: this.formLiquidityPercent,
                formAmount0: this.formAmount0,
                formAmount1: this.formAmount1,
            };
        },
        //@TODO allow edit minimum (required for offline mode)
        minimumVolume0() {
            if (!this.formAmount0) {
                return 0;
            }
            let slippage = 1 - (this.formSlippagePercent0 || 0) / 100;
            if (slippage < 0) {
                slippage = 0;
            }

            return decreasePrecisionSignificant(this.formAmount0 * slippage);
        },
        minimumVolume1() {
            if (!this.formAmount1) {
                return 0;
            }
            let slippage = 1 - (this.formSlippagePercent1 || 0) / 100;
            if (slippage < 0) {
                slippage = 0;
            }

            return decreasePrecisionSignificant(this.formAmount1 * slippage);
        },
    },
    watch: {
        whatAffectsLiquidity: {
            handler() {
                // @input and @input.native may fire in different time so timer needed to wait all events
                clearTimeout(watcherTimer);
                watcherTimer = setTimeout(() => {
                    if (!this.isPoolLoaded) {
                        return;
                    }

                    if (this.selectedInput === INPUT_TYPE.AMOUNT0) {
                        const amount0 = Math.min(this.formAmount0 || 0, this.addressLiquidityData.amount0);
                        this.formLiquidityPercent = liquidityPercentFromAmount(amount0, this.addressLiquidityData.amount0);
                        this.form.liquidity = poolTokenFromLiquidityPercent(this.formLiquidityPercent, this.addressLiquidityData.liquidity);
                        this.formAmount1 = amountFromLiquidityPercent(this.formLiquidityPercent, this.addressLiquidityData.amount1);
                    }

                    if (this.selectedInput === INPUT_TYPE.AMOUNT1) {
                        const amount1 = Math.min(this.formAmount1 || 0, this.addressLiquidityData.amount1);
                        this.formLiquidityPercent = liquidityPercentFromAmount(amount1, this.addressLiquidityData.amount1);
                        this.form.liquidity = poolTokenFromLiquidityPercent(this.formLiquidityPercent, this.addressLiquidityData.liquidity);
                        this.formAmount0 = amountFromLiquidityPercent(this.formLiquidityPercent, this.addressLiquidityData.amount0);
                    }

                    if (this.selectedInput === INPUT_TYPE.LIQUIDITY_PERCENT) {
                        const liquidityPercent = Math.max(Math.min(this.formLiquidityPercent || 0, 100), 0);
                        this.form.liquidity = poolTokenFromLiquidityPercent(liquidityPercent, this.addressLiquidityData.liquidity);
                        this.formAmount0 = amountFromLiquidityPercent(liquidityPercent, this.addressLiquidityData.amount0);
                        this.formAmount1 = amountFromLiquidityPercent(liquidityPercent, this.addressLiquidityData.amount1);
                    }

                    if (this.selectedInput === INPUT_TYPE.LIQUIDITY_AMOUNT) {
                        this.formLiquidityPercent = new Big(this.form.liquidity || 0).div(this.addressLiquidityData.liquidity).times(100).toFixed(2);
                        this.formAmount0 = amountFromLiquidityPercent(this.formLiquidityPercent, this.addressLiquidityData.amount0);
                        this.formAmount1 = amountFromLiquidityPercent(this.formLiquidityPercent, this.addressLiquidityData.amount1);
                    }

                    function poolTokenFromLiquidityPercent(liquidityPercent, providerLiquidity) {
                        return new Big(liquidityPercent).div(100).times(providerLiquidity).toString();
                    }

                    function liquidityPercentFromAmount(inputAmount, providerAmount) {
                        return decreasePrecisionFixed(inputAmount / providerAmount * 100);
                    }

                    function amountFromLiquidityPercent(liquidityPercent, providerAmount) {
                        // don't put 0 into amount field, as it will be not convenient to edit later
                        if (!liquidityPercent) {
                            return '';
                        }
                        return decreasePrecisionSignificant(liquidityPercent / 100 * providerAmount);
                    }
                }, 20);
            },
            deep: true,
        },
    },
    mounted() {
        this.debouncedFetchAddressLiquidity = debounce(this.fetchAddressLiquidity, 400);

        eventBus.on('activate-remove-liquidity', ({coin0, coin1}) => {
            this.form.coin0 = coin0;
            this.form.coin1 = coin1;
            this.formLiquidityPercent = 100;

            const inputEl = this.$refs.fieldAmount.$el.querySelector('input');
            focusElement(inputEl);
        });
    },
    destroyed() {
        eventBus.off('activate-remove-liquidity');
    },
    methods: {
        pretty,
        prettyExact,
        fetchAddressLiquidity() {
            // no pair entered
            if (!this.form.coin0 || !this.form.coin1 || this.form.coin0 === this.form.coin1) {
                return;
            }

            return getPoolProvider(this.form.coin0, this.form.coin1, this.$store.getters.address);
        },
        success() {
            eventBus.emit('update-pool-list');
        },
        beforeConfirm(txFormContext) {
            if (this.$store.getters.isOfflineMode) {
                return;
            }
            txFormContext.isFormSending = true;
            txFormContext.serverError = '';
            txFormContext.serverSuccess = '';
            return this.fetchAddressLiquidity()
                .then(() => {
                    txFormContext.isFormSending = false;
                })
                .catch((error) => {
                    txFormContext.isFormSending = false;
                    txFormContext.serverError = getErrorText(error);
                    throw error;
                });
        },
        clearForm() {
            this.form.liquidity = '';
            this.form.coin0 = '';
            this.form.coin1 = '';

            this.formLiquidityPercent = '';
            this.formAmount0 = '';
            this.formAmount1 = '';
            this.formSlippagePercent0 = 5;
            this.formSlippagePercent1 = 5;
            this.selectedInput = INPUT_TYPE.LIQUIDITY_PERCENT;

            this.$v.$reset();
        },
    },
};
</script>

<template>
    <!-- @TODO minimumVolume -->
    <TxForm
        :txData="{coin0: form.coin0, coin1: form.coin1, liquidity: form.liquidity, minimumVolume0: minimumVolume0, minimumVolume1: minimumVolume1}"
        :$txData="$v"
        :txType="$options.TX_TYPE.REMOVE_LIQUIDITY"
        :before-confirm-modal-show="beforeConfirm"
        @success-tx="success()"
        @clear-form="clearForm()"
    >
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Remove liquidity from swap pool', 'pool.remove-title') }}
            </h1>
            <!--            <p class="panel__header-description">-->
            <!--                {{ $td('Choose one of the coins that you own and specify the amount you would like to add.', 'swap.remove-description') }}-->
            <!--            </p>-->
        </template>

        <template v-slot:extra-panel="{fee, addressBalance}">
            <div class="panel__section panel__section--medium">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                        <FieldCoin
                            v-model="form.coin0"
                            :$value="$v.form.coin0"
                            :label="$td('First coin', 'form.pool-coin0')"
                            :coin-list="poolCoinList"
                            :select-mode="true"
                        />
                        <span class="form-field__error" v-if="$v.form.coin0.$dirty && !$v.form.coin0.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                        <span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                        <!--<span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                        <FieldUseMax
                            v-model="formAmount0"
                            :$value="$v.formAmount0"
                            :label="(form.coin0 || $td('First coin', 'form.pool-coin0')) + ' ' + $td('amount', 'form.pool-remove-amount')"
                            :max-value="isPoolLoaded ? addressLiquidityData.amount0 : undefined"
                            @input.native="selectedInput = $options.INPUT_TYPE.AMOUNT0"
                            @use-max="selectedInput = $options.INPUT_TYPE.AMOUNT0"
                        />
                        <div class="form-field__help">
                            {{ $td('Estimated, depends on the pool ratio', 'form.pool-remove-amount-help') }}
                        </div>
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                        <FieldPercentage
                            v-model="formSlippagePercent0"
                            :$value="$v.formSlippagePercent0"
                            :label="(form.coin0 || $td('First coin', 'form.pool-coin0')) + ' ' + $td('slippage tolerance', 'form.pool-remove-slippage')"
                            min-value="0"
                            max-value="100"
                            :allow-decimal="true"
                        />
                        <span class="form-field__error" v-if="!$v.formSlippagePercent0.maxValue">{{ $td('Maximum 100%', 'form.percent-error-max') }}</span>
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyExact(minimumVolume0) }}</div>
                            <span class="form-field__label">{{ form.coin0 || $td('First coin', 'form.pool-coin0') }} {{ $td('minimum amount to return', 'form.pool-remove-min') }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="panel__section panel__section--medium">
                <div class="u-grid u-grid--small u-grid--vertical-margin--small">
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4">
                        <FieldCoin
                            v-model="form.coin1"
                            :$value="$v.form.coin1"
                            :label="$td('Second coin', 'form.pool-coin1')"
                            :coin-list="poolCoinList"
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
                            :max-value="isPoolLoaded ? addressLiquidityData.amount1 : undefined"
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
                        />
                        <span class="form-field__error" v-if="!$v.formSlippagePercent1.maxValue">{{ $td('Maximum 100%', 'form.percent-error-max') }}</span>
                    </div>
                    <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="!$store.getters.isOfflineMode">
                        <div class="form-field form-field--dashed">
                            <div class="form-field__input is-not-empty">{{ prettyExact(minimumVolume1) }}</div>
                            <span class="form-field__label">{{ form.coin1 || $td('Second coin', 'form.pool-coin0') }} {{ $td('minimum amount to return', 'form.pool-remove-min') }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--small--1-2" v-if="!$store.getters.isOfflineMode">
                <FieldPercentage
                    ref="fieldAmount"
                    v-model="formLiquidityPercent"
                    :$value="$v.formLiquidityPercent"
                    :label="$td('Liquidity', 'form.pool-remove-liquidity-percent')"
                    min-value="0"
                    max-value="100"
                    :allow-decimal="true"
                    @input.native="selectedInput = $options.INPUT_TYPE.LIQUIDITY_PERCENT"
                />
                <span class="form-field__error" v-if="$v.formLiquidityPercent.$dirty && !$v.formLiquidityPercent.required">{{ $td('Enter percentage', 'form.pool-remove-liquidity-percent-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.formLiquidityPercent.$dirty && !$v.formLiquidityPercent.minValue">{{ $td('Min value 0%', 'form.percent-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.formLiquidityPercent.$dirty && !$v.formLiquidityPercent.maxValue">{{ $td('Maximum 100%', 'form.percent-error-max') }}</span>
                <span class="form-field__help" v-else>Percentage of your pool liquidity</span>
            </div>
            <div class="u-cell u-cell--small--1-2">
                <FieldUseMax
                    v-model="form.liquidity"
                    :$value="$v.form.liquidity"
                    :label="$td('Pool tokens amount', 'form.pool-remove-liquidity')"
                    :max-value="isPoolLoaded ? addressLiquidityData.liquidity : undefined"
                    @input.native="selectedInput = $options.INPUT_TYPE.LIQUIDITY_AMOUNT"
                    @use-max="selectedInput = $options.INPUT_TYPE.LIQUIDITY_AMOUNT"
                />
                <!--                @TODO form.liquidity validation-->
                <span class="form-field__error" v-if="$v.formLiquidityPercent.$dirty && !$v.formLiquidityPercent.required">{{ $td('Required', 'form.pool-remove-liquidity-error-required') }}</span>
            </div>
            <div class="u-cell">
                <span class="form__error" v-if="form.coin0 && form.coin1 && $v.isPoolLoaded.$dirty && !$v.isPoolLoaded.success">{{ $td('Provider\'s liquidity not found for selected pair', 'form.pool-remove-liquidity-error-pool') }}</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Remove', 'form.pool-remove-button') }}
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-pool.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Remove liquidity from swap pool', 'pool.remove-title') }}
            </h1>
        </template>

        <template v-slot:confirm-modal-body>
            <div class="u-grid u-grid--small u-grid--vertical-margin u-text-left">
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            {{ formLiquidityPercent }}%
                        </div>
                        <div class="form-field__label">{{ $td('Liquidity', 'form.pool-remove-liquidity-percent') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            ≈<BaseAmount :coin="form.coin0" :amount="formAmount0"/>
                            <span class="u-text-muted">({{ minimumVolume0 }} minimum)</span>
                        </div>
                        <div class="form-field__label">{{ $td('First coin', 'form.pool-coin0') }}</div>
                    </div>
                </div>
                <div class="u-cell">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">
                            ≈<BaseAmount :coin="form.coin1" :amount="formAmount1"/>
                            <span class="u-text-muted">({{ minimumVolume1 }} minimum)</span>
                        </div>
                        <div class="form-field__label">{{ $td('Second coin', 'form.pool-coin1') }}</div>
                    </div>
                </div>
            </div>
        </template>
    </TxForm>
</template>
