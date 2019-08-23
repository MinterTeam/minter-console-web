<script>
    import checkEmpty from '~/assets/v-check-empty';
    import BaseDataList from '~/components/common/BaseDataList';
    import InputUppercase from '~/components/common/InputUppercase';

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
        },
        data() {
            return {
                /** @type Array<CoinItem> */
                coinList: [],
            };
        },
        computed: {
            // all parent listeners except `input`
            listeners() {
                const { input, ...listeners } = this.$listeners;
                return listeners;
            },
            coinListSorted() {
                // move coins first if it's name starts with current value
                // prevent "ABIP" coin to be higher than "BIP" for "BIP" request
                return this.coinList
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
                        if (!this.value) {
                            return 0;
                        }
                        const aHasValue = a.symbol.indexOf(this.value) === 0;
                        const bHasValue = b.symbol.indexOf(this.value) === 0;

                        if (aHasValue && bHasValue) {
                            // save order
                            return 0;
                        } else if (aHasValue) {
                            // set a first
                            return -1;
                        } else if (bHasValue) {
                            // set b first
                            return 1;
                        } else {
                            // save order
                            return 0;
                        }
                    });
            },
            id() {
                const rand = Math.random().toString().replace('.', '');
                return`input-coin-list-${rand}`;
            },
        },
        mounted() {
            this.$store.dispatch('FETCH_COIN_LIST')
                .then((coinList) => {
                    //@TODO maybe use flat list?
                    this.coinList = coinList;
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
        <BaseDataList :id="id" :itemList="coinListSorted" displayField="symbol"/>
    </label>
</template>
