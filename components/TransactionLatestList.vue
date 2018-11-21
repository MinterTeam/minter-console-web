<script>
    import {mapGetters} from 'vuex';
    import {getTimeStamp, getTimeZone, pretty, txTypeFilter, shortHashFilter} from '~/assets/utils';
    import {TX_TYPES, EXPLORER_URL} from '~/assets/variables';
    import TableLink from '~/components/TableLink';

    export default {
        components: {
            TableLink,
        },
        filters: {
            pretty,
            // transform "camelCaseText" to "Sentence Case Text"
            txType: (value) => txTypeFilter(value).replace(/ coin$/, ''),
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
            txListFormatted() {
                return this.txList.slice(0, 5);
            },
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
                return tx.type === TX_TYPES.SELL_COIN || tx.type === TX_TYPES.SELL_ALL_COIN;
            },
            isBuy(tx) {
                return tx.type === TX_TYPES.BUY_COIN;
            },
            hasAmount(tx) {
                return typeof tx.data.amount !== 'undefined'
                    || typeof tx.data.value !== 'undefined'
                    || typeof tx.data.stake !== 'undefined'
                    || typeof tx.data.initial_amount !== 'undefined';
            },
            getConvertCoinSymbol(tx) {
                if (tx.type === TX_TYPES.SELL_COIN || tx.type === TX_TYPES.SELL_ALL_COIN) {
                    return tx.data.coin_to_sell;
                }
                if (tx.type === TX_TYPES.BUY_COIN) {
                    return tx.data.coin_to_buy;
                }
            },
            getConvertValue(tx) {
                if (tx.type === TX_TYPES.SELL_COIN || tx.type === TX_TYPES.SELL_ALL_COIN) {
                    return tx.data.value_to_sell;
                }
                if (tx.type === TX_TYPES.BUY_COIN) {
                    return tx.data.value_to_buy;
                }
            },
            getExplorerBlockUrl(block) {
                return EXPLORER_URL + '/blocks/' + block;
            },
            getExplorerTxUrl(hash) {
                return EXPLORER_URL + '/transactions/' + hash;
            },
            getExplorerAddressUrl(address) {
                return EXPLORER_URL + '/address/' + address;
            },
            getExplorerValidatorUrl(pubKey) {
                return EXPLORER_URL + '/validator/' + pubKey;
            },
        },
    };
</script>

<template>
    <section class="panel">
        <!--<div class="panel__section panel__header">
            <h1 class="panel__title panel__header-title">
                {{ tt('Latest Transactions', 'wallet.tx-title') }}
            </h1>
        </div>-->
        <div class="table-wrap">
            <table v-if="txListFormatted.length">
                <thead>
                <tr class="u-text-nowrap">
                    <th class="u-hidden-small-down">{{ tt('Latest Transactions', 'wallet.tx-title') }}</th>
                    <th class="u-hidden-small-up" colspan="3">{{ tt('Latest Transactions', 'wallet.tx-title') }}</th>
                    <th class="u-hidden-small-down">{{ tt('Block', 'wallet.tx-table-block') }}</th>
                    <th class="u-hidden-xlarge-down">{{ tt('TimeStamp', 'wallet.tx-table-time') }} ({{ timeZone}})</th>
                    <th class="u-hidden-xlarge-down">{{ tt('From', 'wallet.tx-table-from') }}</th>
                    <th class="u-hidden-large-down">{{ tt('Type', 'wallet.tx-table-type') }}</th>
                    <th class="u-hidden-large-down">{{ tt('Amount', 'wallet.tx-table-amount') }}</th>
                    <th class="u-hidden-large-up u-hidden-small-down">{{ tt('Value', 'wallet.tx-table-value') }}</th>
                    <th class="table__expand-cell u-hidden-small-down"></th>
                </tr>
                </thead>
                <tbody>
                <template v-for="tx in txListFormatted">
                    <tr class="u-text-nowrap" :class="{'is-expanded': isTxExpanded[tx.txn]}" :key="tx.txn">
                        <!-- hash -->
                        <td>
                            <TableLink :link-text="tx.hash" :link-path="getExplorerTxUrl(tx.hash)"/>
                        </td>
                        <!-- block -->
                        <td class="u-hidden-small-down">
                            <TableLink :link-text="tx.block" :link-path="getExplorerBlockUrl(tx.block)"/>
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
                        <td class="u-hidden-large-down">{{ tx.type | txType }}</td>
                        <!-- amount -->
                        <td class="u-hidden-large-down">
                            <div v-if="hasAmount(tx)">
                                {{ tx.data.amount || getConvertValue(tx) || tx.data.stake || tx.data.initial_amount || 0 | pretty }}
                                {{ tx.data.coin || tx.data.symbol || getConvertCoinSymbol(tx) }}
                            </div>
                        </td>
                        <!-- value -->
                        <td class="u-hidden-large-up">
                            {{ tx.type | txType }}
                            <span v-if="hasAmount(tx)">
                                {{ tx.data.amount || getConvertValue(tx) || tx.data.stake || tx.data.initial_amount || 0 | pretty }}
                                {{ tx.data.coin || tx.data.symbol || getConvertCoinSymbol(tx) }}
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
                                    <strong>{{ tt('From', 'wallet.tx-table-from') }}</strong> <br>
                                    <TableLink :link-text="tx.from"
                                               :link-path="getExplorerAddressUrl(tx.from)"
                                               :should-not-shorten="true"
                                    />
                                </div>

                                <!-- type SEND -->
                                <div class="table__inner-item" v-if="tx.data.to">
                                    <strong>{{ tt('To', 'wallet.tx-table-to') }}</strong> <br>
                                    <TableLink :link-text="tx.data.to"
                                               :link-path="getExplorerAddressUrl(tx.data.to)"
                                               :should-not-shorten="true"
                                    />
                                </div>

                                <!-- SELL -->
                                <div class="table__inner-item" v-if="isSell(tx)">
                                    <strong>{{ tt('Sell coins', 'wallet.tx-table-sell') }}</strong> <br>
                                    {{ tx.data.value_to_sell | pretty }} {{ tx.data.coin_to_sell }}
                                </div>
                                <div class="table__inner-item" v-if="isSell(tx)">
                                    <strong>{{ tt('Get coins', 'wallet.tx-table-get') }}</strong> <br>
                                    {{ tx.data.value_to_buy | pretty  }} {{ tx.data.coin_to_buy }}
                                </div>
                                <!-- BUY -->
                                <div class="table__inner-item" v-if="isBuy(tx)">
                                    <strong>{{ tt('Buy coins', 'wallet.tx-table-buy') }}</strong> <br>
                                    {{ tx.data.value_to_buy | pretty }} {{ tx.data.coin_to_buy }}
                                </div>
                                <div class="table__inner-item" v-if="isBuy(tx)">
                                    <strong>{{ tt('Spend coins', 'wallet.tx-table-spend') }}</strong> <br>
                                    {{ tx.data.value_to_sell | pretty }} {{ tx.data.coin_to_sell }}
                                </div>

                                <!-- type CREATE_COIN -->
                                <div class="table__inner-item" v-if="tx.data.name">
                                    <strong>{{ tt('Name', 'wallet.tx-table-name') }}</strong> <br>
                                    {{ tx.data.name }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.symbol">
                                    <strong>{{ tt('Symbol', 'wallet.tx-table-symbol') }}</strong> <br>
                                    {{ tx.data.symbol }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.initial_amount">
                                    <strong>{{ tt('Initial Amount', 'wallet.tx-table-initial-amount') }}</strong> <br>
                                    {{ tx.data.initial_amount | pretty }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.initial_reserve">
                                    <strong>{{ tt('Initial Reserve', 'wallet.tx-table-reserve') }}</strong> <br>
                                    {{ tx.data.initial_reserve | pretty }}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.constant_reserve_ratio">
                                    <strong>{{ tt('CRR', 'wallet.tx-table-crr') }}</strong> <br>
                                    {{ tx.data.constant_reserve_ratio }}&thinsp;%
                                </div>

                                <!-- type DECLARE_CANDIDACY, DELEGATE, UNBOND, SET_CANDIDATE_ONLINE, SET_CANDIDATE_OFFLINE -->
                                <div class="table__inner-item" v-if="tx.data.pub_key">
                                    <strong>{{ tt('Public Key', 'wallet.tx-table-public') }}</strong> <br>
                                    <TableLink :link-text="tx.data.pub_key"
                                               :link-path="getExplorerValidatorUrl(tx.data.pub_key)"
                                               :should-not-shorten="true"
                                    />
                                </div>
                                <div class="table__inner-item" v-if="isDefined(tx.data.stake)">
                                    <strong>{{ tt('Stake', 'wallet.tx-table-stake') }}</strong> <br>
                                    {{ tx.data.stake | pretty }} {{ tx.data.coin }}
                                </div>
                                <div class="table__inner-item" v-if="isDefined(tx.data.commission)">
                                    <strong>{{ tt('Commission', 'wallet.tx-table-commission') }}</strong> <br>
                                    {{ tx.data.commission }}&thinsp;%
                                </div>

                                <!-- type REDEEM_CHECK -->
                                <div class="table__inner-item" v-if="tx.data.raw_check">
                                    <strong>{{ tt('Check', 'wallet.tx-table-check') }}</strong> <br>
                                    <!--<TableLink :link-text="tx.data.raw_check" :is-not-link="true"/>-->
                                    {{ tx.data.raw_check | short}}
                                </div>
                                <div class="table__inner-item" v-if="tx.data.proof">
                                    <strong>{{ tt('Proof', 'wallet.tx-table-proof') }}</strong> <br>
                                    {{ tx.data.proof | short}}
                                </div>

                                <!-- block -->
                                <div class="table__inner-item u-hidden-small-up">
                                    <strong>{{ tt('Block', 'wallet.tx-table-block') }}</strong> <br>
                                    <TableLink :link-text="tx.block" :link-path="getExplorerBlockUrl(tx.block)"/>
                                </div>

                                <!-- time -->
                                <div class="table__inner-item u-hidden-xlarge-up">
                                    <strong>{{ tt('TimeStamp', 'wallet.tx-table-time') }} ({{ timeZone}})</strong> <br>
                                    {{ tx.timestamp | time }}
                                </div>

                                <!-- fee -->
                                <div class="table__inner-item">
                                    <strong>{{ tt('Fee', 'wallet.tx-table-fee') }}</strong> <br>
                                    {{ tx.fee | pretty }} {{ $store.state.COIN_NAME }}
                                </div>
                            </div>
                        </td>
                    </tr>
                </template>
                </tbody>
            </table>
            <div class="panel__content panel__section u-text-center" v-else-if="isLoading">
                <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                    <circle class="loader__path" cx="14" cy="14" r="12"></circle>
                </svg>
            </div>
            <div class="panel__content panel__section u-text-center" v-else>No Transactions</div>
        </div>
        <div class="panel__section u-text-center">
            <a :href="getExplorerAddressUrl(address)" class="button button--ghost-main" target="_blank">{{ tt('Show All Transactions', 'wallet.explore-tx')}}</a>
        </div>
    </section>
</template>
