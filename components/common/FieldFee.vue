<script>
import {getSwapCoinList} from '@/api/explorer.js';
import {COIN_TYPE} from '~/assets/variables.js';
import {pretty} from '~/assets/utils.js';
import FieldCoin from '~/components/common/FieldCoin.vue';

export default {
    name: 'FieldFee',
    components: {
        FieldCoin,
    },
    props: {
        value: {
            type: String,
            default: '',
        },
        $value: {
            type: Object,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        /** @type {Array<BalanceItem>} */
        addressBalance: {
            type: Array,
            default: () => [],
        },
        /** @type {Array<FeeData>} */
        fee: {
            type: Object,
            required: true,
        },
    },
    fetch() {
        return getSwapCoinList(this.$store.getters.BASE_COIN, 1)
            .then((swapCoinList) => {
                this.swapBaseCoinList = swapCoinList;
            });
    },
    data() {
        return {
            swapBaseCoinList: [],
        };
    },
    computed: {
        gasSuitableBalance() {
            return this.addressBalance.filter((balanceItem) => {
                // coin with reserve
                if (balanceItem.coin.type === COIN_TYPE.COIN) {
                    return true;
                }
                // swapable within pool to base coin
                if (this.swapBaseCoinList.find((swapCoinItem) => swapCoinItem.id === balanceItem.coin.id)) {
                    return true;
                }
                return false;
            });
        },
    },
    methods: {
        pretty: (val) => pretty(val, undefined, true),
    },
};
</script>

<template>
    <div>
        <FieldCoin
            :value="value"
            @input="$emit('input', $event)"
            :$value="$value"
            :label="label"
            :coin-list="gasSuitableBalance"
            :select-mode="true"
            :is-loading="fee.isLoading"
        />
        <span class="form-field__error" v-if="$value.$dirty && $value.minLength === false">{{ $td('Min 3 letters', 'form.coin-error-min') }}</span>
        <!--<span class="form-field__error" v-else-if="$value.$dirty && !$value.maxLength">{{ $td('Max 10 letters', 'form.coin-error-max') }}</span>-->
        <span class="form-field__error" v-else-if="$value.$dirty && $value.fee === false">{{ fee.error }}</span>
        <div class="form-field__help" v-else-if="$store.getters.isOfflineMode">{{ $td(`Equivalent of ${$store.getters.COIN_NAME} ${pretty(fee.baseCoinValue)}`, 'form.fee-help', {value: pretty(fee.baseCoinValue), coin: $store.getters.COIN_NAME}) }}</div>
        <div class="form-field__help" v-else>
            {{ pretty(fee.value) }} {{ fee.coinSymbol }}
            <span class="u-display-ib" v-if="!fee.isBaseCoin && fee.baseCoinValue">({{ pretty(fee.baseCoinValue) }} {{ $store.getters.COIN_NAME }})</span>
        </div>
    </div>
</template>
