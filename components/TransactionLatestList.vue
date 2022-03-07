<script>
    import {mapGetters} from 'vuex';
    import Big from '~/assets/big.js';
    import {TX_TYPE} from 'minterjs-util/src/tx-types';
    import {getTimeStamp, getTimeZone, pretty, txTypeFilter, shortHashFilter, getExplorerBlockUrl, getExplorerTxUrl, getExplorerAddressUrl, getExplorerValidatorUrl, fromBase64} from '~/assets/utils';
    import {LOCK_STAKE_PERIOD} from '~/assets/variables.js';
    import Loader from '~/components/common/Loader';
    import TableLink from '~/components/common/TableLink';

    export default {
        components: {
            Loader,
            TableLink,
        },
        filters: {
            pretty,
            txType: txTypeFilter,
            short: shortHashFilter,
            time: getTimeStamp,
        },
        props: {
            /** @type Array<Transaction>*/
            txList: {
                type: Array,
                required: true,
            },
            // currentAddress: {
            //     type: String,
            // },
            isLoading: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                isTxExpanded: {/* {txn: boolean} */},
            };
        },
        computed: {
            ...mapGetters([
                'address',
            ]),
            timeZone() {
                return getTimeZone(new Date());
            },
        },
        methods: {
            isDefined(value) {
                return typeof value !== 'undefined';
            },
            toggleTx(txn) {
                this.isTxExpanded = {[txn]: !this.isTxExpanded[txn]};
                // this.$set(this.isTxExpanded, txn, !this.isTxExpanded[txn]);
            },
            isTxType(tx, txType) {
                return tx.type === Number(txType);
            },
            isSell(tx) {
                return this.isTxType(tx, TX_TYPE.SELL) || this.isTxType(tx, TX_TYPE.SELL_ALL);
            },
            isSellPool(tx) {
                return this.isTxType(tx, TX_TYPE.SELL_SWAP_POOL) || this.isTxType(tx, TX_TYPE.SELL_ALL_SWAP_POOL);
            },
            isBuy(tx) {
                return this.isTxType(tx, TX_TYPE.BUY);
            },
            isBuyPool(tx) {
                return this.isTxType(tx, TX_TYPE.BUY_SWAP_POOL);
            },
            isAddOrder(tx) {
                return this.isTxType(tx, TX_TYPE.ADD_LIMIT_ORDER);
            },
            isMultisend(tx) {
                return this.isTxType(tx, TX_TYPE.MULTISEND);
            },
            isIncomeMultisend(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const isOutcomeMultisend = this.address === tx.from;
                return !isOutcomeMultisend;
            },
            isIncomeSend(tx) {
                return this.address === tx.data.to;
            },
            isReceive(tx) {
                return this.isIncomeSend(tx) || this.isIncomeMultisend(tx);
            },
            getAmount(tx) {
                return tx.data.value
                    || this.getConvertValue(tx)
                    || tx.data.stake
                    || tx.data.initialAmount
                    || (tx.data.check && tx.data.check.value)
                    || this.getMultisendValue(tx);
            },
            hasAmount(tx) {
                return typeof this.getAmount(tx) !== 'undefined';
            },
            getAmountWithCoin(tx) {
                if (this.isMultisend(tx) && this.isMultisendMultipleCoin(tx)) {
                    return 'Multiple coins';
                } else {
                    return (tx.data.coin?.symbol || tx.data.symbol || this.getConvertCoinSymbol(tx) || tx.data.check?.coin.symbol || this.getMultisendCoinSymbol(tx)) + ' ' + pretty(this.getAmount(tx) || 0);
                }
            },
            getConvertCoinSymbol(tx) {
                if (this.isSell(tx)) {
                    return tx.data.coinToSell.symbol;
                }
                if (this.isBuy(tx)) {
                    return tx.data.coinToBuy.symbol;
                }
                if (this.isSellPool(tx)) {
                    return tx.data.coins[0].symbol;
                }
                if (this.isBuyPool(tx)) {
                    return tx.data.coins[tx.data.coins.length - 1].symbol;
                }
            },
            getConvertValue(tx) {
                if (this.isSell(tx) || this.isSellPool(tx)) {
                    return tx.data.valueToSell;
                }
                if (this.isBuy(tx) || this.isBuyPool(tx)) {
                    return tx.data.valueToBuy;
                }
            },
            isEditPool(tx) {
                return this.isTxType(tx, TX_TYPE.CREATE_SWAP_POOL) || this.isTxType(tx, TX_TYPE.ADD_LIQUIDITY) || this.isTxType(tx, TX_TYPE.REMOVE_LIQUIDITY);
            },
            getPoolCoins(tx) {
                let symbol0, symbol1;
                if (tx.data.coin0.id < tx.data.coin1.id) {
                    symbol0 = tx.data.coin0.symbol;
                    symbol1 = tx.data.coin1.symbol;
                } else {
                    symbol0 = tx.data.coin1.symbol;
                    symbol1 = tx.data.coin0.symbol;
                }

                return `${symbol0} / ${symbol1}`;
            },
            getMultisendDeliveryList(tx) {
                const isOutcomeMultisend = !this.isIncomeMultisend(tx);
                return isOutcomeMultisend ? tx.data.list : tx.data.list.filter((delivery) => {
                    return this.address === delivery.to;
                });
            },
            isMultisendMultipleCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                return currentUserDeliveryList.some((delivery) => {
                    return delivery.coin.id !== currentUserDeliveryList[0].coin.id;
                });
            },
            getMultisendCoinSymbol(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                if (!this.isMultisendMultipleCoin(tx)) {
                    return this.getMultisendDeliveryList(tx)[0].coin.symbol;
                }
            },
            getMultisendValue(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                const currentUserDeliveryList = this.getMultisendDeliveryList(tx);
                if (this.isMultisendMultipleCoin(tx)) {
                    return '...';
                } else {
                    return currentUserDeliveryList.reduce((accumulator, delivery) => accumulator.plus(delivery.value), new Big(0)).toString();
                }
            },
            getValidatorName(tx) {
                if (!tx.data.pubKey) {
                    return;
                }
                const validator = this.$store.state.validatorMetaList.find((validatorItem) => validatorItem.publicKey === tx.data.pubKey);
                return validator?.name;
            },
            getDueBlockHeight(tx) {
                if (this.isTxType(tx, TX_TYPE.LOCK_STAKE)) {
                    return tx.height + LOCK_STAKE_PERIOD;
                }
                return tx?.data?.dueBlock || tx?.check?.dueBlock;
            },
            fromBase64,
            pretty,
            getExplorerBlockUrl,
            getExplorerTxUrl,
            getExplorerAddressUrl,
            getExplorerValidatorUrl,
        },
    };
</script>

<template>
    <section class="panel">
        <!--<div class="panel__section panel__header">
            <h1 class="panel__title panel__header-title">
                {{ $td('Latest Transactions', 'wallet.tx-title') }}
            </h1>
        </div>-->
        <div class="table-wrap">
            <table v-if="txList.length">
                <thead>
                    <tr class="u-text-nowrap">
                        <th class="u-hidden-small-down">{{ $td('Latest Transactions', 'wallet.tx-title') }}</th>
                        <th class="u-hidden-small-up" colspan="3">{{ $td('Latest Transactions', 'wallet.tx-title') }}</th>
                        <th class="u-hidden-small-down">{{ $td('Block', 'wallet.tx-table-block') }}</th>
                        <th class="u-hidden-xlarge-down">{{ $td('TimeStamp', 'wallet.tx-table-time') }} ({{ timeZone }})</th>
                        <th class="u-hidden-xlarge-down">{{ $td('From', 'wallet.tx-table-from') }}</th>
                        <th class="u-hidden-large-down">{{ $td('Type', 'wallet.tx-table-type') }}</th>
                        <th class="u-hidden-large-down">{{ $td('Amount', 'wallet.tx-table-amount') }}</th>
                        <th class="u-hidden-large-up u-hidden-small-down">{{ $td('Value', 'wallet.tx-table-value') }}</th>
                        <th class="table__controls-cell u-hidden-small-down"></th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="tx in txList">
                        <tr class="u-text-nowrap" :class="{'is-expanded': isTxExpanded[tx.txn]}" :key="tx.txn">
                            <!-- hash -->
                            <td>
                                <TableLink data-test-id="walletTxHash" :link-text="tx.hash" :link-path="getExplorerTxUrl(tx.hash)"/>
                            </td>
                            <!-- block -->
                            <td class="u-hidden-small-down">
                                <TableLink :link-text="tx.height" :link-path="getExplorerBlockUrl(tx.height)" :should-not-shorten="true"/>
                            </td>
                            <!-- time -->
                            <td class="u-hidden-xlarge-down">{{ tx.timestamp | time }}</td>
                            <!-- from -->
                            <td class="u-hidden-xlarge-down">
                                <TableLink
                                    :link-text="tx.from"
                                    :link-path="getExplorerAddressUrl(tx.from)"
                                />
                            </td>
                            <!-- type -->
                            <td class="u-hidden-large-down">
                                <span v-if="isReceive(tx)">Receive</span>
                                <span v-else>{{ tx.type | txType }}</span>
                            </td>
                            <!-- amount -->
                            <td class="u-hidden-large-down">
                                <template v-if="hasAmount(tx)">
                                    {{ getAmountWithCoin(tx) }}
                                </template>
                                <template v-else-if="isEditPool(tx)">
                                    {{ getPoolCoins(tx) }}
                                </template>
                            </td>
                            <!-- value -->
                            <td class="u-hidden-large-up">
                                <span v-if="isReceive(tx)">Receive</span>
                                <span v-else>{{ tx.type | txType }}</span>
                                <span v-if="hasAmount(tx)">
                                    {{ getAmountWithCoin(tx) }}
                                </span>
                            </td>
                            <!--expand button -->
                            <td class="table__controls-cell">
                                <button class="table__controls-button table__controls-button--expand u-semantic-button link--opacity" :class="{'is-expanded': isTxExpanded[tx.txn]}" @click="toggleTx(tx.txn)">Show Tx Data</button>
                            </td>
                        </tr>
                        <tr class="table__row-expanded-data" :key="'exp' + tx.txn" v-if="isTxExpanded[tx.txn]">
                            <td colspan="7">
                                <div class="table__inner">
                                    <!-- from -->
                                    <div class="table__inner-item u-hidden-xlarge-up">
                                        <strong>{{ $td('From', 'wallet.tx-table-from') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.from"
                                            :link-path="getExplorerAddressUrl(tx.from)"
                                            :should-not-shorten="true"
                                        />
                                    </div>

                                    <!-- type SEND -->
                                    <div class="table__inner-item" v-if="tx.data.to">
                                        <strong>{{ $td('To', 'wallet.tx-table-to') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.data.to"
                                            :link-path="getExplorerAddressUrl(tx.data.to)"
                                            :should-not-shorten="true"
                                        />
                                    </div>

                                    <!-- SELL -->
                                    <div class="table__inner-item" v-if="isSell(tx)">
                                        <strong>{{ $td('Sell coins', 'wallet.tx-table-sell') }}</strong> <br>
                                        {{ tx.data.coinToSell.symbol }} {{ tx.data.valueToSell | pretty }}
                                    </div>
                                    <div class="table__inner-item" v-if="isSell(tx)">
                                        <strong>{{ $td('Get coins', 'wallet.tx-table-get') }}</strong> <br>
                                        {{ tx.data.coinToBuy.symbol }} {{ tx.data.valueToBuy | pretty }}
                                    </div>
                                    <!-- SELL_POOL -->
                                    <div class="table__inner-item" v-if="isSellPool(tx)">
                                        <strong>{{ $td('Sell coins', 'wallet.tx-table-sell') }}</strong> <br>
                                        {{ tx.data.coins[0].symbol }} {{ tx.data.valueToSell | pretty }}
                                    </div>
                                    <div class="table__inner-item" v-if="isSellPool(tx)">
                                        <strong>{{ $td('Get coins', 'wallet.tx-table-get') }}</strong> <br>
                                        {{ tx.data.coins[tx.data.coins.length - 1].symbol }} {{ tx.data.valueToBuy | pretty }}
                                    </div>
                                    <!-- BUY -->
                                    <div class="table__inner-item" v-if="isBuy(tx)">
                                        <strong>{{ $td('Buy coins', 'wallet.tx-table-buy') }}</strong> <br>
                                        {{ tx.data.coinToBuy.symbol }} {{ tx.data.valueToBuy | pretty }}
                                    </div>
                                    <div class="table__inner-item" v-if="isBuy(tx)">
                                        <strong>{{ $td('Spend coins', 'wallet.tx-table-spend') }}</strong> <br>
                                        {{ tx.data.coinToSell.symbol }} {{ tx.data.valueToSell | pretty }}
                                    </div>
                                    <!-- BUY_POOL -->
                                    <div class="table__inner-item" v-if="isBuyPool(tx)">
                                        <strong>{{ $td('Buy coins', 'wallet.tx-table-buy') }}</strong> <br>
                                        {{ tx.data.coins[tx.data.coins.length - 1].symbol }} {{ tx.data.valueToBuy | pretty }}
                                    </div>
                                    <div class="table__inner-item" v-if="isBuyPool(tx)">
                                        <strong>{{ $td('Spend coins', 'wallet.tx-table-spend') }}</strong> <br>
                                        {{ tx.data.coins[0].symbol }} {{ tx.data.valueToSell | pretty }}
                                    </div>

                                    <!-- ADD_LIMIT_ORDER -->
                                    <div class="table__inner-item" v-if="isAddOrder(tx)">
                                        <strong>Want to sell</strong> <br>
                                        {{ tx.data.coinToSell.symbol }} {{ pretty(tx.data.valueToSell) }}
                                    </div>
                                    <div class="table__inner-item" v-if="isAddOrder(tx)">
                                        <strong>Want to buy</strong> <br>
                                        {{ tx.data.coinToBuy.symbol }} {{ pretty(tx.data.valueToBuy) }}
                                    </div>

                                    <!-- ADD_LIMIT_ORDER, REMOVE_LIMIT_ORDER -->
                                    <div class="table__inner-item" v-if="tx.data.id || tx.data.orderId">
                                        <strong>Order ID</strong> <br>
                                        {{ tx.data.id || tx.data.orderId }}
                                    </div>

                                    <!-- type CREATE_COIN -->
                                    <div class="table__inner-item" v-if="tx.data.name">
                                        <strong>{{ $td('Name', 'wallet.tx-table-name') }}</strong> <br>
                                        {{ tx.data.name }}
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.symbol">
                                        <strong>{{ $td('Symbol', 'wallet.tx-table-symbol') }}</strong> <br>
                                        {{ tx.data.symbol }}
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.initialAmount">
                                        <strong>{{ $td('Initial amount', 'wallet.tx-table-initial-amount') }}</strong> <br>
                                        {{ tx.data.initialAmount | pretty }}
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.initialReserve">
                                        <strong>{{ $td('Initial reserve', 'wallet.tx-table-reserve') }}</strong> <br>
                                        {{ tx.data.initialReserve | pretty }}
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.constantReserveRatio">
                                        <strong>{{ $td('CRR', 'wallet.tx-table-crr') }}</strong> <br>
                                        {{ tx.data.constantReserveRatio }}&thinsp;%
                                    </div>

                                    <!-- type DECLARE_CANDIDACY, DELEGATE, UNBOND, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                                    <div class="table__inner-item" v-if="getValidatorName(tx)">
                                        <strong>Validator</strong> <br>
                                        <TableLink
                                            :link-text="getValidatorName(tx)"
                                            :link-path="getExplorerValidatorUrl(tx.data.pubKey)"
                                            :should-not-shorten="true"
                                        />
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.pubKey">
                                        <strong>{{ $td('Public key', 'wallet.tx-table-public') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.data.pubKey"
                                            :link-path="getExplorerValidatorUrl(tx.data.pubKey)"
                                            :should-not-shorten="true"
                                        />
                                    </div>
                                    <div class="table__inner-item" v-if="isDefined(tx.data.stake)">
                                        <strong>{{ $td('Stake', 'wallet.tx-table-stake') }}</strong> <br>
                                        {{ tx.data.coin.symbol }} {{ tx.data.stake | pretty }}
                                    </div>
                                    <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                        <strong>{{ $td('Commission', 'wallet.tx-table-commission') }}</strong> <br>
                                        {{ tx.data.commission }}&thinsp;%
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.ownerAddress">
                                        <strong>{{ $td('Owner address', 'wallet.tx-table-owner-address') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.data.ownerAddress"
                                            :link-path="getExplorerAddressUrl(tx.data.ownerAddress)"
                                            :should-not-shorten="true"
                                        />
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.rewardAddress">
                                        <strong>{{ $td('Reward address', 'wallet.tx-table-reward-address') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.data.rewardAddress"
                                            :link-path="getExplorerAddressUrl(tx.data.rewardAddress)"
                                            :should-not-shorten="true"
                                        />
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.controlAddress">
                                        <strong>{{ $td('Control address', 'wallet.tx-table-control-address') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.data.controlAddress"
                                            :link-path="getExplorerAddressUrl(tx.data.controlAddress)"
                                            :should-not-shorten="true"
                                        />
                                    </div>

                                    <!-- type REDEEM_CHECK -->
                                    <!--
                                <div class="table__inner-item" v-if="tx.data.rawCheck">
                                    <strong>{{ $td('Check', 'wallet.tx-table-check') }}</strong> <br>
                                    &lt;!&ndash;<TableLink :link-text="tx.data.rawCheck" :is-not-link="true"/>&ndash;&gt;
                                    {{ tx.data.rawCheck | short}}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.proof">
                                    <strong>{{ $td('Proof', 'wallet.tx-table-proof') }}</strong> <br>
                                    {{ tx.data.proof | short}}
                                </div>
-->
                                    <div class="table__inner-item" v-if="tx.data.check && tx.data.check.sender">
                                        <strong>{{ $td('Check issuer', 'wallet.tx-table-check-issuer') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.data.check.sender"
                                            :link-path="getExplorerAddressUrl(tx.data.check.sender)"
                                            :should-not-shorten="true"
                                        />
                                    </div>
                                    <div class="table__inner-item" v-if="tx.data.check && tx.data.check.nonce">
                                        <strong>{{ $td('Check nonce', 'wallet.tx-table-check-nonce') }}</strong> <br>
                                        {{ fromBase64(tx.data.check.nonce) }}
                                    </div>
                                    <div class="table__inner-item" v-if="getDueBlockHeight(tx)">
                                        <strong>{{ $td('Due block', 'wallet.tx-table-due-block') }}</strong> <br>
                                        {{ getDueBlockHeight(tx) }}
                                    </div>

                                    <!-- type CREATE_MULTISIG -->
                                    <div class="table__inner-item" v-if="tx.data.multisigAddress">
                                        <strong>{{ $td('Created multisig address', 'wallet.tx-table-multisig-address') }}</strong> <br>
                                        <TableLink
                                            :link-text="tx.data.multisigAddress"
                                            :link-path="getExplorerAddressUrl(tx.data.multisigAddress)"
                                            :should-not-shorten="true"
                                        />
                                    </div>

                                    <!-- block -->
                                    <div class="table__inner-item u-hidden-small-up">
                                        <strong>{{ $td('Block', 'wallet.tx-table-block') }}</strong> <br>
                                        <TableLink :link-text="tx.height" :link-path="getExplorerBlockUrl(tx.height)"/>
                                    </div>

                                    <!-- time -->
                                    <div class="table__inner-item u-hidden-xlarge-up">
                                        <strong>{{ $td('Timestamp', 'wallet.tx-table-time') }} ({{ timeZone }})</strong> <br>
                                        {{ tx.timestamp | time }}
                                    </div>

                                    <!-- fee -->
                                    <div class="table__inner-item">
                                        <strong>{{ $td('Fee', 'wallet.tx-table-fee') }}</strong> <br>
                                        {{ $store.getters.COIN_NAME }} {{ tx.fee | pretty }}
                                    </div>

                                    <!-- message -->
                                    <div class="table__inner-item" v-if="tx.payload">
                                        <strong>Message</strong> <br>
                                        {{ fromBase64(tx.payload) }}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
            <div class="panel__content panel__section u-text-center" v-else-if="isLoading">
                <Loader :isLoading="true"/>
            </div>
            <div class="panel__content panel__section u-text-center" v-else>No transactions</div>
        </div>
        <div class="panel__section u-text-center">
            <a :href="getExplorerAddressUrl(address)" class="button button--ghost-main" target="_blank" tabindex="0">{{ $td('Show All Transactions', 'wallet.explore-tx') }}</a>
        </div>
    </section>
</template>

