<script>
    import {mapGetters} from 'vuex';
    import Big from 'big.js';
    import * as TX_TYPES from 'minterjs-tx/src/tx-types';
    import {getTimeStamp, getTimeZone, pretty, txTypeFilter, shortHashFilter, getExplorerBlockUrl, getExplorerTxUrl, getExplorerAddressUrl, getExplorerValidatorUrl, fromBase64} from '~/assets/utils';
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
            isSell(tx) {
                return tx.type === Number(TX_TYPES.TX_TYPE_SELL) || tx.type === Number(TX_TYPES.TX_TYPE_SELL_ALL);
            },
            isBuy(tx) {
                return tx.type === Number(TX_TYPES.TX_TYPE_BUY);
            },
            isMultisend(tx) {
                return tx.type === Number(TX_TYPES.TX_TYPE_MULTISEND);
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
                    || tx.data.initial_amount
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
                    return (tx.data.coin || tx.data.symbol || this.getConvertCoinSymbol(tx) || (tx.data.check && tx.data.check.coin) || this.getMultisendCoin(tx)) + ' ' + pretty(this.getAmount(tx) || 0);
                }
            },
            getConvertCoinSymbol(tx) {
                if (tx.type === Number(TX_TYPES.TX_TYPE_SELL) || tx.type === Number(TX_TYPES.TX_TYPE_SELL_ALL)) {
                    return tx.data.coin_to_sell;
                }
                if (tx.type === Number(TX_TYPES.TX_TYPE_BUY)) {
                    return tx.data.coin_to_buy;
                }
            },
            getConvertValue(tx) {
                if (tx.type === Number(TX_TYPES.TX_TYPE_SELL) || tx.type === Number(TX_TYPES.TX_TYPE_SELL_ALL)) {
                    return tx.data.value_to_sell;
                }
                if (tx.type === Number(TX_TYPES.TX_TYPE_BUY)) {
                    return tx.data.value_to_buy;
                }
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
                    return delivery.coin !== currentUserDeliveryList[0].coin;
                });
            },
            getMultisendCoin(tx) {
                if (!this.isMultisend(tx)) {
                    return;
                }
                if (!this.isMultisendMultipleCoin(tx)) {
                    return this.getMultisendDeliveryList(tx)[0].coin;
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
                    return currentUserDeliveryList.reduce((accumulator, delivery) => accumulator.plus(new Big(delivery.value)), new Big(0)).toFixed();
                }
            },
            getValidatorName(tx) {
                if (!tx.data.pub_key) {
                    return;
                }
                const validator = this.$store.state.validatorList.find((validatorItem) => validatorItem.public_key === tx.data.pub_key);
                return validator && validator.meta && validator.meta.name;
            },
            fromBase64,
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
                    <th class="u-hidden-xlarge-down">{{ $td('TimeStamp', 'wallet.tx-table-time') }} ({{ timeZone}})</th>
                    <th class="u-hidden-xlarge-down">{{ $td('From', 'wallet.tx-table-from') }}</th>
                    <th class="u-hidden-large-down">{{ $td('Type', 'wallet.tx-table-type') }}</th>
                    <th class="u-hidden-large-down">{{ $td('Amount', 'wallet.tx-table-amount') }}</th>
                    <th class="u-hidden-large-up u-hidden-small-down">{{ $td('Value', 'wallet.tx-table-value') }}</th>
                    <th class="table__expand-cell u-hidden-small-down"></th>
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
                            <TableLink :link-text="tx.block" :link-path="getExplorerBlockUrl(tx.block)" :should-not-shorten="true"/>
                        </td>
                        <!-- time -->
                        <td class="u-hidden-xlarge-down">{{ tx.timestamp | time }}</td>
                        <!-- from -->
                        <td class="u-hidden-xlarge-down">
                            <TableLink :link-text="tx.from"
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
                            <div v-if="hasAmount(tx)">
                                {{ getAmountWithCoin(tx) }}
                            </div>
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
                        <td class="table__expand-cell">
                            <button class="table__expand-button u-semantic-button" :class="{'is-expanded': isTxExpanded[tx.txn]}" @click="toggleTx(tx.txn)">Show Tx Data</button>
                        </td>
                    </tr>
                    <tr class="table__row-expanded-data" :key="'exp' + tx.txn" v-if="isTxExpanded[tx.txn]">
                        <td colspan="7">
                            <div class="table__inner">
                                <!-- from -->
                                <div class="table__inner-item u-hidden-xlarge-up">
                                    <strong>{{ $td('From', 'wallet.tx-table-from') }}</strong> <br>
                                    <TableLink :link-text="tx.from"
                                               :link-path="getExplorerAddressUrl(tx.from)"
                                               :should-not-shorten="true"
                                    />
                                </div>

                                <!-- type SEND -->
                                <div class="table__inner-item" v-if="tx.data.to">
                                    <strong>{{ $td('To', 'wallet.tx-table-to') }}</strong> <br>
                                    <TableLink :link-text="tx.data.to"
                                               :link-path="getExplorerAddressUrl(tx.data.to)"
                                               :should-not-shorten="true"
                                    />
                                </div>

                                <!-- SELL -->
                                <div class="table__inner-item" v-if="isSell(tx)">
                                    <strong>{{ $td('Sell coins', 'wallet.tx-table-sell') }}</strong> <br>
                                    {{ tx.data.coin_to_sell }} {{ tx.data.value_to_sell | pretty }}
                                </div>
                                <div class="table__inner-item" v-if="isSell(tx)">
                                    <strong>{{ $td('Get coins', 'wallet.tx-table-get') }}</strong> <br>
                                    {{ tx.data.coin_to_buy }} {{ tx.data.value_to_buy | pretty }}
                                </div>
                                <!-- BUY -->
                                <div class="table__inner-item" v-if="isBuy(tx)">
                                    <strong>{{ $td('Buy coins', 'wallet.tx-table-buy') }}</strong> <br>
                                    {{ tx.data.coin_to_buy }} {{ tx.data.value_to_buy | pretty }}
                                </div>
                                <div class="table__inner-item" v-if="isBuy(tx)">
                                    <strong>{{ $td('Spend coins', 'wallet.tx-table-spend') }}</strong> <br>
                                    {{ tx.data.coin_to_sell }} {{ tx.data.value_to_sell | pretty }}
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
                                <div class="table__inner-item" v-if="tx.data.initial_amount">
                                    <strong>{{ $td('Initial Amount', 'wallet.tx-table-initial-amount') }}</strong> <br>
                                    {{ tx.data.initial_amount | pretty }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.initial_reserve">
                                    <strong>{{ $td('Initial Reserve', 'wallet.tx-table-reserve') }}</strong> <br>
                                    {{ tx.data.initial_reserve | pretty }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.constant_reserve_ratio">
                                    <strong>{{ $td('CRR', 'wallet.tx-table-crr') }}</strong> <br>
                                    {{ tx.data.constant_reserve_ratio }}&thinsp;%
                                </div>

                                <!-- type DECLARE_CANDIDACY, DELEGATE, UNBOND, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                                <div class="table__inner-item" v-if="getValidatorName(tx)">
                                    <strong>Validator</strong> <br>
                                    <TableLink :link-text="getValidatorName(tx)"
                                               :link-path="getExplorerValidatorUrl(tx.data.pub_key)"
                                               :should-not-shorten="true"
                                    />
                                </div>
                                <div class="table__inner-item" v-if="tx.data.pub_key">
                                    <strong>{{ $td('Public Key', 'wallet.tx-table-public') }}</strong> <br>
                                    <TableLink :link-text="tx.data.pub_key"
                                               :link-path="getExplorerValidatorUrl(tx.data.pub_key)"
                                               :should-not-shorten="true"
                                    />
                                </div>
                                <div class="table__inner-item" v-if="isDefined(tx.data.stake)">
                                    <strong>{{ $td('Stake', 'wallet.tx-table-stake') }}</strong> <br>
                                    {{ tx.data.coin }} {{ tx.data.stake | pretty }}
                                </div>
                                <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                    <strong>{{ $td('Commission', 'wallet.tx-table-commission') }}</strong> <br>
                                    {{ tx.data.commission }}&thinsp;%
                                </div>
                                <div class="table__inner-item" v-if="tx.data.reward_address">
                                    <strong>{{ $td('Reward Address', 'wallet.tx-table-reward-address') }}</strong> <br>
                                    <TableLink :link-text="tx.data.reward_address"
                                               :link-path="getExplorerAddressUrl(tx.data.reward_address)"
                                               :should-not-shorten="true"
                                    />
                                </div>
                                <div class="table__inner-item" v-if="tx.data.owner_address">
                                    <strong>{{ $td('Owner Address', 'wallet.tx-table-owner-address') }}</strong> <br>
                                    <TableLink :link-text="tx.data.owner_address"
                                               :link-path="getExplorerAddressUrl(tx.data.owner_address)"
                                               :should-not-shorten="true"
                                    />
                                </div>

                                <!-- type REDEEM_CHECK -->
<!--
                                <div class="table__inner-item" v-if="tx.data.raw_check">
                                    <strong>{{ $td('Check', 'wallet.tx-table-check') }}</strong> <br>
                                    &lt;!&ndash;<TableLink :link-text="tx.data.raw_check" :is-not-link="true"/>&ndash;&gt;
                                    {{ tx.data.raw_check | short}}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.proof">
                                    <strong>{{ $td('Proof', 'wallet.tx-table-proof') }}</strong> <br>
                                    {{ tx.data.proof | short}}
                                </div>
-->
                                <div class="table__inner-item" v-if="tx.data.check && tx.data.check.sender">
                                    <strong>{{ $td('Check Issuer', 'wallet.tx-table-check-issuer') }}</strong> <br>
                                    <TableLink :link-text="tx.data.check.sender"
                                               :link-path="'/address/' + tx.data.check.sender"
                                               :should-not-shorten="true"
                                    />
                                </div>
                                <div class="table__inner-item" v-if="tx.data.check && tx.data.check.nonce">
                                    <strong>{{ $td('Check Nonce', 'wallet.tx-table-check-nonce') }}</strong> <br>
                                    {{ fromBase64(tx.data.check.nonce) }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.check && tx.data.check.due_block">
                                    <strong>{{ $td('Due Block', 'wallet.tx-table-check-issuer') }}</strong> <br>
                                    {{ tx.data.check.due_block }}
                                </div>

                                <!-- block -->
                                <div class="table__inner-item u-hidden-small-up">
                                    <strong>{{ $td('Block', 'wallet.tx-table-block') }}</strong> <br>
                                    <TableLink :link-text="tx.block" :link-path="getExplorerBlockUrl(tx.block)"/>
                                </div>

                                <!-- time -->
                                <div class="table__inner-item u-hidden-xlarge-up">
                                    <strong>{{ $td('TimeStamp', 'wallet.tx-table-time') }} ({{ timeZone}})</strong> <br>
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
            <div class="panel__content panel__section u-text-center" v-else>No Transactions</div>
        </div>
        <div class="panel__section u-text-center">
            <a :href="getExplorerAddressUrl(address)" class="button button--ghost-main" target="_blank">{{ $td('Show All Transactions', 'wallet.explore-tx')}}</a>
        </div>
    </section>
</template>

