<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import minValue from 'vuelidate/lib/validators/minValue';
    import {isValidPublic} from "minterjs-util/src/public";
    import prepareSignedTx from 'minter-js-sdk/src/tx';
    import {privateToAddressString, toBuffer, TX_TYPE} from 'minterjs-util';
    import {postAutoDelegationTxList} from '~/api';
    import {getNonce} from '~/api/gate';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import FieldDomain from '~/components/common/FieldDomain';
    import FieldQr from '~/components/common/FieldQr';
    import InputMaskedAmount from '~/components/common/InputMaskedAmount';
    import InputMaskedInteger from '~/components/common/InputMaskedInteger';
    import ButtonCopyIcon from '~/components/common/ButtonCopyIcon';
    import Loader from '~/components/common/Loader';

    export default {
        components: {
            FieldDomain,
            FieldQr,
            InputMaskedAmount,
            InputMaskedInteger,
            ButtonCopyIcon,
            Loader,
        },
        directives: {
            checkEmpty,
        },
        filters: {
            pretty,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        mixins: [validationMixin],
        data() {
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: false,
                formTxCount: '',
                form: {
                    nonce: '',
                    data: {
                        publicKey: '',
                        stake: null,
                    },
                    gasPrice: '',
                },
                signedTxList: null,
                signedTxListFile: null,
                domain: '',
                isDomainResolving: false,
            };
        },
        validations() {
            const formTxCount = {
                required,
            };
            const form = {
                data: {
                    publicKey: {
                        required,
                        validPublicKey: this.isDomainResolving ? () => new Promise(() => 0) : isValidPublic,
                    },
                    stake: {
                        required,
                    },
                },
                gasPrice: {
                    minValue: minValue(1),
                },
            };

            if (this.$store.getters.isOfflineMode) {
                form.nonce = {
                    required,
                    minValue: minValue(1),
                };
            }

            return {formTxCount, form};
        },
        computed: {
        },
        destroyed() {
            this.clearDownload();
        },
        methods: {
            submit() {
                if (this.$store.getters.isOfflineMode) {
                    this.generateTxList();
                } else {
                    this.postTxList();
                }
            },
            generateTxList() {
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }

                this.signedTxList = null;
                this.serverError = '';
                this.serverSuccess = false;
                this.generateBatchTx()
                    .then(([signedTxList, nonce]) => {
                        this.signedTxList = signedTxList.join('\n');
                        this.setDownload(this.signedTxList, `${this.form.data.publicKey}-${nonce}-${nonce + this.formTxCount}`);
                        this.clearForm();
                    });
            },
            postTxList() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isFormSending = true;
                this.signedTxList = null;
                this.serverError = '';
                this.serverSuccess = false;
                this.$store.dispatch('FETCH_ADDRESS_ENCRYPTED')
                    .then(() => this.generateBatchTx())
                    .then(([signedTxList]) => postAutoDelegationTxList(signedTxList))
                    .then(() => {
                        this.isFormSending = false;
                        this.serverSuccess = true;
                        this.clearForm();
                    })
                    .catch((error) => {
                        this.isFormSending = false;
                        this.serverError = getErrorText(error);
                    });
            },
            generateBatchTx() {
                const privateKey = this.$store.getters.privateKey;
                const txCount = this.formTxCount;
                const txParams = {
                    ...this.form,
                    chainId: this.$store.getters.CHAIN_ID,
                    type: TX_TYPE.DELEGATE,
                    data: {
                        ...this.form.data,
                        coin: 0,
                    },
                    gasPrice: this.form.gasPrice || undefined,
                    gasCoin: 0,
                };
                const nonce = txParams.nonce;

                // ensure nonce
                const privateKeyBuffer = toBuffer(privateKey);
                const address = privateToAddressString(privateKeyBuffer);

                const noncePromise = nonce ? Promise.resolve(nonce) : getNonce(address);
                return noncePromise.then((nonce) => {
                    let result = [];
                    for(let i = 1; i <= txCount; i++) {
                        const signedTx = prepareSignedTx({
                            ...txParams,
                            nonce,
                        }, {privateKey}).serializeToString();
                        result.push(signedTx);
                        nonce++;
                    }

                    return [result, nonce];
                });
            },
            clearForm() {
                this.form.data.publicKey = '';
                this.form.data.stake = null;
                this.form.gasPrice = '';
                if (this.form.nonce && this.$store.getters.isOfflineMode) {
                    this.form.nonce = Number(this.form.nonce) + Number(this.formTxCount);
                } else {
                    this.form.nonce = '';
                }
                this.formTxCount = '';
                this.$v.$reset();
            },
            setDownload(text, name) {
                this.clearDownload();
                const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
                this.$set(this, 'signedTxListFile', {
                    url: URL.createObjectURL(file),
                    name: name + '.txt',
                });
            },
            clearDownload() {
                if (this.signedTxListFile && this.signedTxListFile.url) {
                    URL.revokeObjectURL(this.signedTxListFile.url);
                }
            },
            getExplorerTxUrl,
        },
    };
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="submit">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell u-cell--xlarge--1-2">
                <FieldDomain
                    v-model.trim="form.data.publicKey"
                    :$value="$v.form.data.publicKey"
                    valueType="publicKey"
                    :label="$td('Public key or domain', 'form.masternode-public')"
                    @update:domain="domain = $event"
                    @update:resolving="isDomainResolving = $event"
                />
            </div>
            <div class="u-cell u-cell--small--1-2  u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.form.data.stake.$error}">
                    <InputMaskedAmount class="form-field__input" type="text" inputmode="decimal" v-check-empty
                                       v-model="form.data.stake"
                                       @blur="$v.form.data.stake.$touch()"
                    />
                    <span class="form-field__label">{{ $store.getters.BASE_COIN }} {{ $td('stake per tx', 'form.delegation-reinvest-stake') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.form.data.stake.$dirty && !$v.form.data.stake.required">{{ $td('Enter stake', 'form.masternode-stake-error-required') }}</span>
            </div>
            <div class="u-cell u-cell--small--1-2  u-cell--xlarge--1-4">
                <label class="form-field" :class="{'is-error': $v.formTxCount.$error}">
                    <InputMaskedInteger class="form-field__input" type="text" v-check-empty
                                        v-model="formTxCount"
                                        @blur="$v.formTxCount.$touch()"
                    />
                    <span class="form-field__label">{{ $td('Tx count', 'form.delegation-reinvest-tx-count') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.formTxCount.$dirty && !$v.formTxCount.required">{{ $td('Enter tx count', 'form.delegation-reinvest-tx-count-error-required') }}</span>
                <!--                <div class="form-field__help">{{ $td('', 'form.delegation-reinvest-tx-count-help') }}</div>-->
            </div>
            <div class="u-cell u-cell--order-2" :class="$store.getters.isOfflineMode ? 'u-cell--small--1-2 u-cell--xlarge--1-4' : 'u-cell--large--1-2'">
                <label class="form-field" :class="{'is-error': $v.form.gasPrice.$error}">
                    <InputMaskedInteger class="form-field__input" v-check-empty
                                        v-model="form.gasPrice"
                                        @blur="$v.form.gasPrice.$touch()"
                    />
                    <span class="form-field__error" v-if="$v.form.gasPrice.$dirty && !$v.form.gasPrice.minValue">{{ $td(`Minimum gas price is 1`, 'form.gas-price-error-min') }}</span>
                    <span class="form-field__label">{{ $td('Gas price (optional)', 'form.gas-price') }}</span>
                </label>
                <div class="form-field__help">{{ $td('Default:', 'form.help-default') }} 1</div>
            </div>

            <!-- Generation -->
            <div class="u-cell u-cell--small--1-2 u-cell--xlarge--1-4" v-if="$store.getters.isOfflineMode">
                <FieldQr v-model="form.nonce"
                         :$value="$v.form.nonce"
                         :label="$td('Nonce', 'form.checks-issue-nonce')"
                         :isInteger="true"
                />
                <span class="form-field__error" v-if="$v.form.nonce.$error && !$v.form.nonce.required">{{ $td('Enter nonce', 'form.checks-issue-nonce-error-required') }}</span>
                <span class="form-field__error" v-else-if="$v.form.nonce.$dirty && !$v.form.nonce.minValue">{{ $td(`Minimum nonce is 1`, 'form.generate-nonce-error-min') }}</span>
                <div class="form-field__help">{{ $td('Tx\'s unique ID. Should be: current user\'s tx count + 1', 'form.generate-nonce-help') }}</div>
            </div>
            <div class="u-cell u-cell--xlarge--1-2 u-cell--order-2" v-if="$store.getters.isOfflineMode">
                <button class="button button--main button--full" :class="{'is-disabled': $v.$invalid}">
                    {{ $td('Generate', 'form.generate-button') }}
                </button>
            </div>

            <!-- Controls -->
            <div class="u-cell u-cell--large--1-2 u-cell--order-2" v-if="!$store.getters.isOfflineMode">
                <button
                    class="button button--main button--full"
                    :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}"
                >
                    <span class="button__content">{{ $td('Start auto-delegation', `form.delegation-reinvest-start-button`) }}</span>
                    <Loader class="button__loader" :isLoading="true"/>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell u-cell--order-2" v-if="serverSuccess">
                <strong>{{ $td('Auto-delegation have started', 'form.delegation-reinvest-start-success') }}</strong>
            </div>

            <div class="u-cell u-cell--order-2" v-if="signedTxList">
                <dl>
                    <dt>{{ $td('Signed tx list:', 'form.delegation-reinvest-result') }}</dt>
                    <dd class="u-icon-wrap">
                        <textarea class="u-icon-text reinvest__textarea" rows="6" autocapitalize="off" spellcheck="false" v-model="signedTxList"></textarea>
                        <!--                            <span class="u-select-all u-icon-text">-->
                        <!--                                {{ signedTxList }}-->
                        <!--                            </span>-->
                        <ButtonCopyIcon class="u-icon--copy--right" :copy-text="signedTxList"/>
                    </dd>
                    <dd>
                        <a class="link--default" :href="signedTxListFile.url" :download="signedTxListFile.name" v-if="signedTxListFile" target="_blank" rel="noopener">Download File</a>
                    </dd>
                </dl>
                <br>
            </div>
        </div>
    </form>
</template>
