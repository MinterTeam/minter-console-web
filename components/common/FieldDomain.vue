<script>
    import {isValidAddress} from "minterjs-util/src/prefix";
    import {isValidPublic} from "minterjs-util/src/public";
    import {ResolveDomain, isDomain, checkDomainSignature} from '~/api/mns';
    import FieldQr from '~/components/common/FieldQr';

    export default {
        ideFix: true,
        TYPE_ADDRESS: 'address',
        TYPE_PUBLIC_KEY: 'publicKey',
        inheritAttrs: false,
        components: {
            FieldQr,
        },
        props: {
            // self
            /** @type "address"|"publicKey" */
            valueType: {
                type: String,
                required: true,
            },
            // nested
            value: {
                type: [String, Number],
                required: true,
            },
            $value: {
                type: Object,
                required: true,
            },
            label: {
                type: String,
                required: true,
            },
            // self
            help: {
                type: String,
                default: '',
            },
        },
        data() {
            return {
                domain: this.value,
                isResolving: 0,
                mnsResolveDomain: ResolveDomain(),
            };
        },
        methods: {
            handleInput(inputValue) {
                inputValue = inputValue.trim();
                if (isDomain(inputValue)) {
                    // instant resolve without throttle
                    this.resolveDomain(inputValue, {throttle: true});
                    this.$emit('input', '');
                    this.$emit('update:domain', inputValue);
                    this.domain = inputValue;
                } else {
                    this.$emit('input', inputValue);
                    this.$emit('update:domain', '');
                    this.domain = '';
                }
            },
            handleBlur() {
                if (this.domain) {
                    // instant resolve without throttle
                    this.resolveDomain(this.domain);
                }
            },
            resolveDomain(value, {throttle} = {}) {
                this.isResolving += 1;
                this.$emit('update:resolving', !!this.isResolving);
                return this.mnsResolveDomain(value, {throttle})
                    .then((domainData) => {
                        if(this.valueType === 'address' && isValidAddress(domainData.address) && checkDomainSignature(domainData)){
                            this.$emit('input', domainData.address);
                        } else if(this.valueType === 'publicKey' && isValidPublic(domainData.publickey) && checkDomainSignature(domainData)){
                            this.$emit('input', domainData.publickey);
                        }
                        this.isResolving -= 1;
                        this.$emit('update:resolving', !!this.isResolving);
                    })
                    .catch(() => {
                        this.isResolving -= 1;
                        this.$emit('update:resolving', !!this.isResolving);
                    });
            },
        },
    };
</script>

<template>
    <div>
        <FieldQr
            v-bind="$attrs"
            :value="domain ? domain : value"
            @input="handleInput"
            :$value="$value"
            :label="label"
            @blur="handleBlur"
        />

        <template v-if="valueType === $options.TYPE_ADDRESS && !$value.$pending">
            <span class="form-field__error" v-if="$value.$dirty && !$value.required && !domain">
                {{ $td('Enter address', 'form.wallet-send-address-error-required') }}
            </span>
            <span class="form-field__error" v-else-if="$value.$dirty && !$value.validAddress && !domain">
                {{ $td('Address is invalid', 'form.wallet-send-address-error-invalid') }}
            </span>
            <span class="form-field__error" v-else-if="$value.$dirty && !$value.validAddress && domain">
                {{ $td('Address not found for such domain', 'form.wallet-send-domain-error-invalid') }}
            </span>
        </template>

        <template v-if="valueType === $options.TYPE_PUBLIC_KEY && !$value.$pending">
            <span class="form-field__error" v-if="$value.$dirty && !$value.required && !domain">
                {{ $td('Enter public key', 'form.masternode-public-error-required') }}
            </span>
            <span class="form-field__error" v-else-if="$value.$dirty && !$value.validPublicKey && !domain">
                {{ $td('Public key is invalid', 'form.masternode-public-error-invalid') }}
            </span>
            <span class="form-field__error" v-else-if="$value.$dirty && !$value.validPublicKey && domain">
                {{ $td('Public key not found for such domain', 'form.masternode-domain-error-invalid') }}
            </span>
        </template>

        <div class="form-field__help" v-if="help">{{ help }}</div>
    </div>
</template>

