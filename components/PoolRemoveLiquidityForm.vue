<script>
import Big from 'big.js';
import {AsyncComputedMixin} from 'vue-async-computed/src/index.js';
import debounce from 'debounce-promise';
import {validationMixin} from 'vuelidate';
import required from 'vuelidate/lib/validators/required';
import minLength from 'vuelidate/lib/validators/minLength';
import maxLength from 'vuelidate/lib/validators/maxLength';
import minValue from 'vuelidate/lib/validators/minValue.js';
import maxValue from 'vuelidate/lib/validators/maxValue.js';
import {TX_TYPE} from 'minterjs-tx/src/tx-types';
import {getAddressLiquidity, getCoinId} from '~/api/gate.js';
import checkEmpty from '~/assets/v-check-empty';
import {getErrorText} from "~/assets/server-error";
import {pretty, prettyExact} from "~/assets/utils";
import TxForm from '~/components/common/TxForm.vue';
import FieldCoin from '~/components/common/FieldCoin';
import FieldPercentage from '~/components/common/FieldPercentage.vue';

export default {
    TX_TYPE,
    components: {
        TxForm,
        FieldCoin,
        FieldPercentage,
    },
    directives: {
        checkEmpty,
    },
    mixins: [validationMixin, AsyncComputedMixin],
    data() {
        return {
            form: {
                liquidity: '',
                coin0: '',
                coin1: '',
            },
            estimation: null,
        };
    },
    validations() {
        const form = {
            liquidity: {
                //@TODO maxValue
                //@TODO validAmount
                required,
                minValue: minValue(0),
                maxValue: maxValue(100),
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

        return {form};
    },
    asyncComputed: {
        addressLiquidityData() {
            return this.fetchAddressLiquidity(this.form.coin0, this.form.coin1);
        },
    },
    computed: {
        liquidityAmount() {
            if (!this.addressLiquidityData?.liquidity || !this.form.liquidity) {
                return 0;
            }

            return new Big(this.form.liquidity).div(100).times(this.addressLiquidityData.liquidity).div(10 ** 18).toFixed();
        },
        coin0Amount() {
            if (!this.addressLiquidityData?.amount0 || !this.form.liquidity) {
                return 0;
            }

            return new Big(this.form.liquidity).div(100).times(this.addressLiquidityData.amount0).div(10 ** 18).toFixed();
        },
        coin1Amount() {
            if (!this.addressLiquidityData?.amount1 || !this.form.liquidity) {
                return 0;
            }

            return new Big(this.form.liquidity).div(100).times(this.addressLiquidityData.amount1).div(10 ** 18).toFixed();
        },
        /*
        maxAmount() {
            if (!this.addressLiquidityData) {
                return;
            }
            return this.addressLiquidityData.liquidity;

            // @TODO select from list
            // no pool liquidity
            if (!this.poolList.length) {
                return;
            }
            // no pair entered
            if (!this.form.coin0 || !this.form.coin1) {
                return;
            }
            const selectedCoin = this.poolList.find((coin) => {
                return coin.coin.symbol === this.form.coinSymbol;
            });
            // coin not selected
            if (!selectedCoin) {
                return undefined;
            }
            return selectedCoin.value;
        },
        */
    },
    methods: {
        pretty,
        prettyExact,
        fetchAddressLiquidity: debounce(function() {
            // no pair entered
            if (!this.form.coin0 || !this.form.coin1 || this.form.coin0 === this.form.coin1) {
                return;
            }

            return getCoinId([this.form.coin0, this.form.coin1])
                .then(([id0, id1]) => {
                    return getAddressLiquidity(id0, id1, this.$store.getters.address);
                });
        }, 400),
        clearForm() {
            this.form.liquidity = '';
            this.form.coin0 = '';
            this.form.coin1 = '';
            this.$v.$reset();
        },
    },
};
</script>

<template>
    <!-- @TODO minimumVolume -->
    <TxForm :txData="{coin0: form.coin0, coin1: form.coin1, liquidity: liquidityAmount}" :$txData="$v.form" :txType="$options.TX_TYPE.REMOVE_LIQUIDITY" @clear-form="clearForm()">
        <template v-slot:panel-header>
            <h1 class="panel__header-title">
                {{ $td('Remove liquidity from swap pool', 'swap.remove-title') }}
            </h1>
            <!--            <p class="panel__header-description">-->
            <!--                {{ $td('Choose one of the coins that you own and specify the amount you would like to add.', 'swap.remove-description') }}-->
            <!--            </p>-->
        </template>

        <template v-slot:default="{fee, addressBalance}">
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-3">
                <FieldCoin
                    v-model="form.coin0"
                    :$value="$v.form.coin0"
                    :label="$td('Coin', 'form.swap-remove-coin')"
                />
                <span class="form-field__error" v-if="$v.form.coin0.$dirty && !$v.form.coin0.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coin0.$dirty && !$v.form.coin0.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--xlarge--1-3">
                <FieldCoin
                    v-model="form.coin1"
                    :$value="$v.form.coin1"
                    :label="$td('Coin', 'form.swap-remove-coin')"
                />
                <span class="form-field__error" v-if="$v.form.coin1.$dirty && !$v.form.coin1.required">{{ $td('Enter coin symbol', 'form.coin-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.minLength">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
                <!--<span class="form-field__error" v-else-if="$v.form.coin1.$dirty && !$v.form.coin1.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
            </div>
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-3">
                <FieldPercentage
                    v-model="form.liquidity"
                    :$value="$v.form.liquidity"
                    :label="$td('Liquidity', 'form.swap-remove-liquidity')"
                    min-value="0"
                    max-value="100"
                    :allow-decimal="true"
                />
                <span class="form-field__error" v-if="$v.form.liquidity.$dirty && !$v.form.liquidity.required">{{ $td('Enter percentage', 'form.swap-remove-liquidity-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.liquidity.$dirty && !$v.form.liquidity.minValue">{{ $td('Min value 0', 'form.swap-remove-liquidity-error-min') }}</span>
                <span class="form-field__error" v-else-if="$v.form.liquidity.$dirty && !$v.form.liquidity.maxValue">{{ $td('Maximum 100%', 'form.swap-remove-liquidity-error-max') }}</span>
                <span class="form-field__help" v-else>Percentage of your pool liquidity</span>
            </div>
        </template>

        <template v-slot:submit-title>
            {{ $td('Remove', 'form.swap-remove-button') }}
        </template>

        <template v-slot:panel-footer>
            <div class="u-grid">
                <div class="u-cell u-cell--medium--1-3">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(coin0Amount) }}</div>
                        <span class="form-field__label">{{ form.coin0 || 'Coin' }} {{ $td('to return', 'form.swap-remove-coin-amount') }}</span>
                    </div>
                </div>
                <div class="u-cell u-cell--medium--1-3">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(coin1Amount) }}</div>
                        <span class="form-field__label">{{ form.coin1 || 'Coin' }} {{ $td('to return', 'form.swap-remove-coin-amount') }}</span>
                    </div>
                </div>
                <div class="u-cell u-cell--medium--1-3">
                    <div class="form-field form-field--dashed">
                        <div class="form-field__input is-not-empty">{{ pretty(liquidityAmount) }}</div>
                        <span class="form-field__label">{{ $td('Liquidity to remove', 'form.swap-remove-liquidity-amount') }}</span>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:confirm-modal-header>
            <h1 class="panel__header-title">
                <img class="panel__header-title-icon" :src="`${BASE_URL_PREFIX}/img/icon-feature-pool.svg`" alt="" role="presentation" width="40" height="40">
                {{ $td('Remove liquidity from swap pool', 'swap.remove-title') }}
            </h1>
        </template>

        <!--        <template v-slot:confirm-modal-body>
                    <div class="u-grid u-grid&#45;&#45;small u-grid&#45;&#45;vertical-margin">
                        <div class="u-cell">
                            <label class="form-field form-field&#45;&#45;dashed">
                                <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                       :value="form.coin0 + ' ' + prettyExact(form.liquidity)"
                                >
                                <span class="form-field__label">{{ $td('You will send', 'form.swap-sell-confirm-send') }}</span>
                            </label>
                        </div>
                        <div class="u-cell">
                            <template v-if="estimation">
                                <label class="form-field form-field&#45;&#45;dashed">
                                    <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                           :value="form.coin1 + ' ' + pretty(estimation)"
                                    >
                                    <span class="form-field__label">{{ $td('You will get approximately *', 'form.swap-sell-confirm-receive-estimation') }}</span>
                                </label>
                                <div class="form-field__help u-text-left">
                                    {{ $td('* The result amount depends on the current rate at the time of the exchange and may differ from the above.', 'form.swap-confirm-note') }}
                                </div>
                            </template>
                            <template v-else>
                                <label class="form-field form-field&#45;&#45;dashed">
                                    <input class="form-field__input is-not-empty" type="text" readonly tabindex="-1"
                                           :value="form.coin1"
                                    >
                                    <span class="form-field__label">{{ $td('You will get', 'form.swap-sell-confirm-receive') }}</span>
                                </label>
                            </template>
                        </div>
                    </div>
                </template>-->
    </TxForm>
</template>
