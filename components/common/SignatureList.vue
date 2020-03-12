<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required.js';
    import minLength from 'vuelidate/lib/validators/minLength.js';
    import maxLength from 'vuelidate/lib/validators/maxLength.js';
    import autosize from 'v-autosize';
    import checkEmpty from '~/assets/v-check-empty';


    export default {
        directives: {
            autosize,
            checkEmpty,
        },
        mixins: [validationMixin],
        props: {
            value: {
                type: Array,
                default: null,
            },
            // $signatureList: {
            //     type: Object,
            //     required: true,
            // },
        },
        data() {
            return {
                list: getListValueFromProp(this.value),
            };
        },
        validations() {
            return {
                list: {
                    minLength: minLength(1),
                    maxLength: maxLength(32),
                    $each: {
                        signature: {
                            required,
                        },
                    },
                },
            };
        },
        computed: {
            listHash() {
                let signatures = this.list.reduce((accumulator, item) => {
                    return accumulator + item.signature;
                }, '');

                return this.list.length.toString() + signatures;
            },
        },
        watch: {
            value(newVal) {
                // clear list on clearForm()
                if (newVal === null) {
                    this.list = getListValueFromProp(newVal);
                }
            },
            listHash() {
                this.updateModel();
            },
        },
        methods: {
            addParticipant() {
                this.list.push({
                    signature: '',
                });
            },
            removeParticipant(index) {
                // wait modal to handle click
                // otherwise it will can't find clicked button in the DOM and decides outerClick happen and close modal
                setTimeout(() => {
                    this.list.splice(index, 1);
                }, 100);
            },
            updateModel() {
                this.$emit('input', this.list.map((item) => item.signature));
            },
        },
    };

    function getListValueFromProp(modelValue) {
        if (modelValue) {
            return modelValue.map((item) => ({signature: item}));
        } else {
            return [
                {signature: ''},
                {signature: ''},
            ];
        }
    }
</script>

<template>
    <div class="u-grid u-grid--small u-grid--vertical-margin">
        <div class="multisig-signature__cell u-cell" v-for="(v, index) in $v.list.$each.$iter" :key="index">
            <label class="form-field multisig-signature__field" :class="{'is-error': v.signature.$error}">
                <textarea class="form-field__input" type="text" autocapitalize="off" spellcheck="false" rows="1" v-check-empty v-autosize
                          v-model.trim="v.signature.$model"
                          @blur="v.signature.$touch()"
                ></textarea>
                <span class="form-field__label">{{ $td('Signature', 'form.multisig-signature-list-item') }} #{{ Number(index) + 1 }}</span>
            </label>

            <button class="multisig-signature__remove u-semantic-button link--opacity" type="button"
                    v-if="index > 0"
                    @click="removeParticipant(index)"
            >
                <img src="/img/icon-remove.svg" alt="Remove signature">
            </button>

            <span class="form-field__error" v-if="v.signature.$dirty && !v.signature.required">{{ $td('Enter signature', 'form.multisig-signature-list-item-error-required') }}</span>
        </div>
        <div class="u-cell u-text-left">
            <button class="button button--ghost" type="button" @click="addParticipant">
                {{ $td('+ Add signature', 'form.multisig-signature-list-add') }}
            </button>
        </div>
    </div>
</template>

