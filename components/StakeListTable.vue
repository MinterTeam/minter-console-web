<script>
import debounce from 'lodash-es/debounce';
import {pretty, prettyPrecise, getExplorerValidatorUrl, getExplorerAddressUrl} from '~/assets/utils';
import eventBus from '~/assets/event-bus';
import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
import TableLink from "~/components/common/TableLink";

const STAKE_TYPE_VALIDATOR = 'validator'; // delegator page: list of validators for current delegator
const STAKE_TYPE_DELEGATOR = 'delegator'; // validator page: list of delegations to validator

let resizeHandler;

export default {
    name: 'StakeListTable',
    STAKE_TYPE_VALIDATOR,
    STAKE_TYPE_DELEGATOR,
    pretty,
    prettyPrecise,
    components: {
        ButtonCopyIcon,
        TableLink,
    },
    filters: {
        pretty,
    },
    props: {
        /** @type Array<StakeItem> */
        stakeList: {
            type: Array,
            required: true,
        },
        stakeItemType: {
            type: String,
            default: STAKE_TYPE_VALIDATOR,
        },
        isLoading: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            shouldShortenLabel: this.getShouldShortenLabel(),
            sort: {
                // 0 - no sort, -1 - ascending, 1 - descending
                hash: 0,
                value: -1,
                coin: 0,
            },
            isExpandedList: {/* {hash: boolean} */},
        };
    },
    computed: {
        hashName() {
            if (this.stakeItemType === STAKE_TYPE_VALIDATOR) {
                return 'Validator';
            }
            if (this.stakeItemType === STAKE_TYPE_DELEGATOR) {
                return 'Address';
            }
            return '';
        },
        /** @type Array<{hash: string, stakeList: Array<StakeItem>}> */
        stakeListGrouped() {
            return this.stakeList
                .reduce((accumulator, item) => {
                    const hash = this.getLabel(item);
                    let groupIndex = accumulator.findIndex((groupItem) => groupItem.hash === hash);
                    if (groupIndex === -1) {
                        accumulator.push({
                            hash,
                            stakeList: [],
                        });
                        groupIndex = accumulator.length - 1;
                    }
                    accumulator[groupIndex].stakeList.push(item);
                    return accumulator;
                }, [])
                // sort groups
                .sort((a, b) => {
                    return this.getGroupBipValue(b) - this.getGroupBipValue(a);
                })
                // sort stakes
                .map((item) => {
                    item.stakeList.sort((a, b) => {
                        return b.bipValue - a.bipValue;
                    });
                    return item;
                });
        },
        /** @type Array<StakeItem> */
        /*
                    stakeListSorted() {
                        return this.stakeList.slice(0).sort(makeSortQueue([
                            makeOrderedSortFn(this.sort.hash, this.hashSortFn),
                            makeOrderedSortFn(this.sort.value, valueSortFn),
                            makeOrderedSortFn(this.sort.coin, coinSortFn),
                        ]));
                    },
        */
        totalStake() {
            return this.stakeList.reduce((accumulator, item) => {
                return accumulator + Number(item.bipValue);
            }, 0);
        },
    },
    mounted() {
        if (process.client) {
            resizeHandler = debounce(() => {
                this.shouldShortenLabel = this.getShouldShortenLabel();
            });
            window.addEventListener('resize', resizeHandler, 100);
        }
    },
    destroyed() {
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
        }
    },
    methods: {
        prettyPrecise,
        getGroupCoinList(stakeGroup) {
            // keep unique coins
            return stakeGroup.stakeList.map((item) => item.coin.symbol).filter(function(item, index, self) {
                return self.indexOf(item) === index;
            });
        },
        getGroupCoinListLabel(stakeGroup) {
            const COUNT_TO_SHOW = 3;
            const coinList = this.getGroupCoinList(stakeGroup);
            if (coinList.length <= COUNT_TO_SHOW + 1) {
                return coinList.join(', ');
            } else {
                return coinList.slice(0, COUNT_TO_SHOW).join(', ') + ` + ${coinList.length - COUNT_TO_SHOW} more`;
            }
        },
        getGroupBipValue(stakeGroup) {
            return stakeGroup.stakeList.reduce((accumulator, item) => {
                return accumulator + Number(item.bipValue);
            }, 0);
        },
        isGroupHasWaitlisted(stakeGroup) {
            return stakeGroup.stakeList.some((item) => item.isWaitlisted);
        },
        isGroupCanExpand(stakeGroup) {
            return stakeGroup.stakeList.length > 1;
        },
        toggleExpand(hash) {
            this.isExpandedList = {[hash]: !this.isExpandedList[hash]};
            // this.$set(this.isTxExpanded, txn, !this.isTxExpanded[txn]);
        },
        getValidatorName(stakeItem) {
            return stakeItem.validator?.name;
        },
        getLabel(stakeItem) {
            if (this.stakeItemType === STAKE_TYPE_VALIDATOR) {
                return stakeItem.validator.publicKey;
            }
            if (this.stakeItemType === STAKE_TYPE_DELEGATOR) {
                return stakeItem.address;
            }
        },
        getUrl(stakeItem) {
            if (this.stakeItemType === STAKE_TYPE_VALIDATOR) {
                return getExplorerValidatorUrl(stakeItem.validator.publicKey);
            }
            if (this.stakeItemType === STAKE_TYPE_DELEGATOR) {
                return getExplorerAddressUrl(stakeItem.address);
            }
        },
        getShouldShortenLabel() {
            if (this.stakeItemType === STAKE_TYPE_VALIDATOR) {
                return process.client && window.innerWidth < 1280;
            }
            if (this.stakeItemType === STAKE_TYPE_DELEGATOR) {
                return process.client && window.innerWidth < 600;
            }
        },
        /*
                    toggleSort(field, inverseDirection) {
                        // remove other fields from sort
                        Object.keys(this.sort).forEach((key) => {
                            if (key !== field && this.sort[key] !== 0) {
                                this.sort[key] = 0;
                            }
                        });
                        const step = inverseDirection ? -1 : 1;
                        // change field sort order between -1 and 1
                        if (this.sort[field] === 0) {
                            this.sort[field] += step;
                        } else {
                            this.sort[field] = -1 * this.sort[field];
                        }
                        // change field sort order between -1, 0, 1
                        // if (this.sort[field] === step) {
                        //     this.sort[field] = -1 * step;
                        // } else {
                        //     this.sort[field] += step;
                        // }
                    },
                    getSortClass(field) {
                        switch (this.sort[field]) {
                            case 1:
                                return 'table__sort-button-icon--ascending';
                            case -1:
                                return 'table__sort-button-icon--descending';
                            case 0:
                                return '';
                        }
                    },
                    /!**
                     * Default ascending: A -> B
                     *!/
                    hashSortFn(a, b) {
                        const nameA = this.getValidatorName(a);
                        const nameB = this.getValidatorName(b);
                        if (!nameA && nameB) {
                            return 1;
                        } else if (nameA && !nameB) {
                            return -1;
                        } else {
                            const labelA = this.getLabel(a);
                            const labelB = this.getLabel(b);
                            return labelA.localeCompare(labelB);
                        }
                    },
        */
            activateDelegate({hash}) {
                eventBus.$emit('activate-delegate', {hash});
            },
            activateUnbond({hash, coin}) {
                eventBus.$emit('activate-unbond', {hash, coin});
            },
    },
};

/**
 * Default ascending: A -> B
 */
function coinSortFn(a, b) {
    return ('' + a.coin.symbol).localeCompare(b.coin.symbol);
}

/**
 * Default ascending: 1 -> 2
 */
function valueSortFn(a, b) {
    return a.bipValue - b.bipValue;
}


/**
 * Change sort order direction depending on `order` (-1, 0, 1)
 * @param {number} order - 0: no sort, 1: default, -1: inverse
 * @param {Function} sortFn
 */
function makeOrderedSortFn(order, sortFn) {
    return function(a, b) {
        return order * sortFn(a, b);
    };
}

/**
 * Make sort function, which will apply every sortFn from array of sort functions, next sortFn applies only if previous returned `0`
 * @param {Array<Function>} fnArray
 * @return {Function} sort function
 */
function makeSortQueue(fnArray) {
    return function(a, b) {
        return fnArray.reduce((result, sortFnItem) => {
            // if result === 0 => apply sortFnItem
            return result || sortFnItem(a, b);
        }, 0);
    };
}
</script>

<template>
    <div class="table-wrap">
        <div class="panel__content panel__section u-text-center" v-if="isLoading">
            <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                <circle class="loader__path" cx="14" cy="14" r="12"></circle>
            </svg>
        </div>
        <table class="table--stake-list u-text-nowrap" v-else-if="stakeListGrouped.length">
            <thead class="u-hidden-medium-down">
            <tr>
                <!-- hash (colspan copy cell) -->
                <th colspan="2">
                    {{ hashName }}
                    <!--
                                        <button class="table__sort-button u-semantic-button link&#45;&#45;hover" @click="toggleSort('hash')">
                                            <span class="table__sort-button-text">{{ hashName }}</span>
                        <img class="table__sort-button-icon" :src="`${BASE_URL_PREFIX}/img/icon-sort.svg`" alt="Sort" :class="getSortClass('hash')">
                                        </button>
                    -->
                </th>
                <th class="table__cell-waitlist"><!-- Waitlist--></th>
                <th>
                    Coins
                    <!--
                                        <button class="table__sort-button u-semantic-button link&#45;&#45;hover" @click="toggleSort('coin')">
                                            <span class="table__sort-button-text">Coin</span>
                        <img class="table__sort-button-icon" :src="`${BASE_URL_PREFIX}/img/icon-sort.svg`" alt="Sort" :class="getSortClass('coin')">
                                        </button>
                    -->
                </th>
                <th class="table__cell-stake-amount">
                    Amount
                    <!--
                                        <button class="table__sort-button u-semantic-button link&#45;&#45;hover" @click="toggleSort('value', true)">
                                            <span class="table__sort-button-text">Amount</span>
                        <img class="table__sort-button-icon" :src="`${BASE_URL_PREFIX}/img/icon-sort.svg`" alt="Sort" :class="getSortClass('value')">
                                        </button>
                    -->
                </th>
                <!-- controls -->
                <th class="table__controls-cell table__controls-cell--x2"></th>
            </tr>
            </thead>
            <tbody>
            <template v-for="stakeGroup in stakeListGrouped">
                <!-- desktop overall values -->
                <tr class="table__row-lead--medium-down" :class="{'is-expanded': isExpandedList[stakeGroup.hash], 'is-waitlisted': isGroupHasWaitlisted(stakeGroup) && !isExpandedList[stakeGroup.hash]}" :key="stakeGroup.hash">
                    <!-- copy -->
                    <td class="table__controls-cell table__controls-cell--copy">
                        <ButtonCopyIcon class="table__controls-button" :copy-text="stakeGroup.hash"/>
                    </td>
                    <!-- hash -->
                    <td>
                        <div class="table__cell-title" v-if="getValidatorName(stakeGroup.stakeList[0])">{{ getValidatorName(stakeGroup.stakeList[0]) }}</div>
                        <TableLink
                            class="table__cell-sub"
                            :link-text="stakeGroup.hash"
                            :link-path="getUrl(stakeGroup.stakeList[0])"
                            :should-not-shorten="!shouldShortenLabel"
                        />
                        <!--
                                                <div v-if="isGroupCanExpand(stakeGroup)" class="u-hidden-medium-up">
                                                    <div v-if="!isExpandedList[stakeGroup.hash]" class="u-text-normal">
                                                        {{ getGroupCoinList(stakeGroup).join(', ') }}
                                                    </div>
                                                    <div :title="$options.prettyPrecise(getGroupBipValue(stakeGroup))">
                                                        {{ $options.pretty(getGroupBipValue(stakeGroup)) }}
                                                    </div>
                                                </div>
                                                <div class="u-hidden-medium-up" v-else>{{ stakeGroup.stakeList[0].coin }} {{ $options.pretty(stakeGroup.stakeList[0].value) }}</div>
                        -->
                    </td>
                    <!-- waitlist-->
                    <td class="table__cell-waitlist">
                        <span class="u-emoji u-hidden-medium-down"
                              :class="{'u-visually-hidden': isExpandedList[stakeGroup.hash]}"
                              title="Stake is dropped to wait list, top up or unbond it"
                              v-if="isGroupHasWaitlisted(stakeGroup)"
                        >⚠️</span>
                    </td>
                    <!-- coin list -->
                    <td class="u-hidden-medium-down">
                        <span v-if="isGroupCanExpand(stakeGroup)" class="u-text-normal" :class="{'u-visually-hidden': isExpandedList[stakeGroup.hash]}">
                            {{ getGroupCoinListLabel(stakeGroup) }}
                        </span>
                        <span v-else>{{ stakeGroup.stakeList[0].coin.symbol }}</span>
                    </td>
                    <!-- amount total -->
                    <td class="table__cell-stake-amount u-hidden-medium-down">
                        <span v-if="isGroupCanExpand(stakeGroup)" :title="$options.prettyPrecise(getGroupBipValue(stakeGroup))">
                            {{ $options.pretty(getGroupBipValue(stakeGroup)) }}
                        </span>
                        <template v-else>
                            <span :title="$options.prettyPrecise(stakeGroup.stakeList[0].value)">{{ $options.pretty(stakeGroup.stakeList[0].value) }}</span>
                            <div class="u-text-muted" :title="$options.prettyPrecise(stakeGroup.stakeList[0].bipValue)" v-if="stakeGroup.stakeList[0].coin.symbol !== $store.getters.COIN_NAME">
                                {{ $store.getters.COIN_NAME }} {{ $options.pretty(stakeGroup.stakeList[0].bipValue) }}
                            </div>
                        </template>
                    </td>
                    <!-- controls -->
                    <td class="table__controls-cell table__controls-cell--x2">
                        <button class="table__controls-button u-semantic-button link--opacity"
                                @click="activateDelegate({hash: stakeGroup.hash})"
                        >
                            <img :src="`${BASE_URL_PREFIX}/img/icon-plus.svg`" alt="Delegate to validator">
                        </button>
                        <button class="table__controls-button u-semantic-button link--opacity"
                                @click="activateUnbond({hash: stakeGroup.hash, coin: stakeGroup.stakeList[0].coin.symbol})"
                                v-if="!isGroupCanExpand(stakeGroup)"
                        >
                            <img :src="`${BASE_URL_PREFIX}/img/icon-minus.svg`" alt="Unbond coin">
                        </button>
                        <button class="table__controls-button table__controls-button--expand u-semantic-button link--opacity"
                                :class="{'is-expanded': isExpandedList[stakeGroup.hash]}"
                                v-if="isGroupCanExpand(stakeGroup)"
                                @click="toggleExpand(stakeGroup.hash)"
                        >
                            Toggle Stakes
                        </button>
                    </td>
                </tr>
                <!-- mobile overall values -->
                <tr class="u-hidden-medium-up" :class="{'is-expanded': isExpandedList[stakeGroup.hash], 'is-waitlisted': isGroupHasWaitlisted(stakeGroup) && !isExpandedList[stakeGroup.hash]}" :key="`${stakeGroup.hash}-mobile`">
                    <!-- copy -->
                    <td class="table__controls-cell table__controls-cell--copy"></td>
                    <!-- hash -->
                    <td>
                        <div v-if="isGroupCanExpand(stakeGroup)">
                            <div v-if="!isExpandedList[stakeGroup.hash]" class="u-text-normal">
                                {{ getGroupCoinListLabel(stakeGroup) }}
                            </div>
                            <div class="u-text-muted" :title="$options.prettyPrecise(getGroupBipValue(stakeGroup))">
                                Total: {{ $options.pretty(getGroupBipValue(stakeGroup)) }} {{ $store.getters.COIN_NAME }}
                            </div>
                        </div>
                        <div v-else>{{ stakeGroup.stakeList[0].coin.symbol }} {{ $options.pretty(stakeGroup.stakeList[0].value) }}</div>
                    </td>
                    <td class="table__cell-waitlist">
                        <span class="u-emoji"
                              :class="{'u-visually-hidden': isExpandedList[stakeGroup.hash]}"
                              title="Stake is dropped to wait list, top up or unbond it"
                              v-if="isGroupHasWaitlisted(stakeGroup)"
                        >⚠️</span>
                    </td>
                    <!-- controls placeholder -->
                    <td></td>
                </tr>
                <!-- expanded stake items -->
                <template v-if="isGroupCanExpand(stakeGroup) && isExpandedList[stakeGroup.hash]">
                    <tr v-for="stakeItem in stakeGroup.stakeList" :key="stakeGroup.hash + stakeItem.coin.id" class="is-expanded" :class="{'is-waitlisted': stakeItem.isWaitlisted}">
                        <!-- copy -->
                        <td class="table__controls-cell table__controls-cell--copy"></td>
                        <!-- hash -->
                        <td class="u-hidden-medium-down"></td>
                        <!-- waitlist-->
                        <td class="u-hidden-medium-down table__cell-waitlist">
                            <span class="u-emoji" v-if="stakeItem.isWaitlisted" title="Stake is dropped to wait list, top up or unbond it">⚠️</span>
                        </td>
                        <!-- coin -->
                        <td class="u-hidden-medium-down">{{ stakeItem.coin.symbol }}</td>
                        <!-- amount -->
                        <td class="table__cell-stake-amount">
                            <span class="u-hidden-medium-up">{{ stakeItem.coin.symbol }}</span>

                            <span :title="$options.prettyPrecise(stakeItem.value)">{{ $options.pretty(stakeItem.value) }}</span>
                            <div class="u-text-muted" :title="$options.prettyPrecise(stakeItem.bipValue)" v-if="stakeItem.coin.symbol !== $store.getters.COIN_NAME">
                                {{ $store.getters.COIN_NAME }} {{ $options.pretty(stakeItem.bipValue) }}
                            </div>
                        </td>
                        <!-- waitlist-->
                        <td class="u-hidden-medium-up table__cell-waitlist">
                            <span class="u-emoji" v-if="stakeItem.isWaitlisted">⚠️</span>
                        </td>
                        <!-- controls -->
                        <td class="table__controls-cell table__controls-cell--x2">
                            <button class="table__controls-button u-semantic-button link--opacity"
                                    @click="activateUnbond({hash: stakeGroup.hash, coin: stakeItem.coin.symbol})"
                            >
                                <img :src="`${BASE_URL_PREFIX}/img/icon-minus.svg`" alt="Unbond coin">
                            </button>
                        </td>
                    </tr>
                </template>
            </template>
            </tbody>
            <tfoot v-if="stakeListGrouped.length > 1 && stakeItemType === $options.STAKE_TYPE_VALIDATOR">
            <tr>
                <!-- hash (colspan copy) -->
                <td colspan="2">Total</td>
                <!-- placeholder for waitlist and coin-->
                <td colspan="2" class="u-hidden-medium-down"></td>
                <!-- amount (colspan controls)-->
                <td colspan="2">{{ $options.pretty(totalStake) }} {{ $store.getters.COIN_NAME }}</td>
            </tr>
            </tfoot>
        </table>
        <div class="panel__content panel__section u-text-center" v-else>No Stakes</div>
    </div>
</template>
