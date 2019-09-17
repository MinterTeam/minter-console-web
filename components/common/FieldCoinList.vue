<script>
    import checkEmpty from '~/assets/v-check-empty';
    import BaseDataList from '~/components/common/BaseDataList';
    import InputUppercase from '~/components/common/InputUppercase';

    const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    const isFirefox = /firefox/i.test(window.navigator.userAgent);

    const MAX_ITEM_COUNT = 10;
    const SLICE_END = (isSafari || isFirefox) ? undefined : MAX_ITEM_COUNT - 1;

    export default {
        components: {
            BaseDataList,
            InputUppercase,
        },
        directives: {
            checkEmpty,
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
            /** @type Array */
            coinList: {
                type: Array,
                default: () => [],
            },
        },
        data() {
            return {
                /** @type Array */
                coinListAll: [],
            };
        },
        computed: {
            // all parent listeners except `input`
            listeners() {
                const { input, ...listeners } = this.$listeners;
                return listeners;
            },
            coinListSorted() {
                const currentCoinList = this.coinList && this.coinList.length ? this.coinList : this.coinListAll;
                return currentCoinList
                    .slice()
                    // disable filter due strange animation in chrome and hanged dropdown in safari with list from 1 letter for 0 letter after deletion
                    // .filter((coin) => {
                    //     if (!this.value) {
                    //         return true;
                    //     }
                    //     // for 1 letter search keep only values started with this letter (e.g. remove "WALLET" for "T" search)
                    //     if (this.value.length === 1 && coin.symbol.indexOf(this.value) !== 0) {
                    //         return false;
                    //     }
                    //     return true
                    // })
                    .sort((a, b) => {
                        // @TODO reconsider after https://bugs.webkit.org/show_bug.cgi?id=201121 will be resolved
                        // @TODO reconsider after https://bugzilla.mozilla.org/show_bug.cgi?id=1474137 will be resolved
                        // don't do anything for safari because displayed datalist is out of sync with DOM
                        if (isSafari || isFirefox) {
                            return 0;
                        }
                        if (!this.value) {
                            return 0;
                        }
                        // move coins first if it's name starts with current value
                        // prevent "ABIP" coin to be higher than "BIP" for "BIP" request
                        const aHasStart = a.indexOf(this.value) === 0;
                        const bHasStart = b.indexOf(this.value) === 0;
                        // need to save browser's datalist order to prevent lose these values after slice
                        const aHasAny = a.indexOf(this.value) !== -1;
                        const bHasAny = b.indexOf(this.value) !== -1;

                        if (aHasStart && !bHasStart) {
                            // set a first
                            return -1;
                        } else if (bHasStart && !aHasStart) {
                            // set b first
                            return 1;
                        } else if (aHasAny && !bHasAny) {
                            // set a first
                            return -1;
                        } else if (bHasAny && !aHasAny) {
                            // set b first
                            return 1;
                        } else {
                            // save order
                            return 0;
                        }
                    })
                    .slice(0, SLICE_END);
            },
            id() {
                const rand = Math.random().toString().replace('.', '');
                return `input-coin-list-${rand}`;
            },
        },
        mounted() {
            this.$store.dispatch('FETCH_COIN_LIST')
                .then((coinListAll) => {
                    this.coinListAll = Object.freeze(coinListAll.map((item) => item.symbol));
                })
                .catch((e) => {
                    console.log(e);
                });
        },
        methods: {

        },
    };


</script>

<template>
    <label class="form-field" :class="{'is-error': $value.$error}">
        <InputUppercase
                class="form-field__input" type="text" v-check-empty
                v-bind="$attrs"
                :value="value"
                @input="$emit('input', $event)"
                :list="id"
                @blur="$value.$touch()"
        />
        <span class="form-field__label">{{ label }}</span>
        <BaseDataList :id="id" :itemList="coinListSorted"/>
    </label>
</template>
