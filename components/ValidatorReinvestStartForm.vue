<script>
    import {validationMixin} from 'vuelidate';
    import required from 'vuelidate/lib/validators/required';
    import FileInput from 'v-file-input/src/FileInput';
    import {postAutoDelegationTxList} from '~/api';
    import autosize from 'v-autosize';
    import checkEmpty from '~/assets/v-check-empty';
    import {getErrorText} from "~/assets/server-error";
    import {getExplorerTxUrl, pretty} from "~/assets/utils";
    import Loader from '~/components/common/Loader';
    import Modal from '~/components/common/Modal';

    export default {
        components: {
            FileInput,
            Loader,
            Modal,
        },
        directives: {
            autosize,
            checkEmpty,
        },
        mixins: [validationMixin],
        filters: {
            pretty,
            uppercase: (value) => value ? value.toUpperCase() : value,
        },
        data() {
            return {
                isFormSending: false,
                serverError: '',
                serverSuccess: false,
                formSignedTxList: '',
                fileError: '',
                fileApiError: false,
                isDragLayerVisible: false,
            };
        },
        validations() {
            const formSignedTxList = {
                required,
            };

            return {formSignedTxList};
        },
        computed: {
        },
        methods: {
            postTxList() {
                if (this.isFormSending) {
                    return;
                }
                if (this.$v.$invalid) {
                    this.$v.$touch();
                    return;
                }
                this.isFormSending = true;
                this.serverError = '';
                this.serverSuccess = false;

                let signedTxList = this.formSignedTxList.split(/\r\n|\r|\n/g);
                signedTxList = signedTxList.map((item) => item.trim()).filter((item) => Boolean(item));

                postAutoDelegationTxList(signedTxList)
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
            handleFileUpdate(fileList) {
                var reader = new FileReader();
                reader.onload = () => {
                    this.formSignedTxList = reader.result;
                };
                reader.readAsText(fileList[0].blob);
            },
            clearForm() {
                this.formSignedTxList = '';
                this.$v.$reset();
            },
            getExplorerTxUrl,
        },
    };
</script>

<template>
    <form class="panel__section" novalidate @submit.prevent="postTxList">
        <div class="u-grid u-grid--small u-grid--vertical-margin--small">
            <div class="u-cell">
                <label class="form-field" :class="{'is-error': $v.formSignedTxList.$error}">
                    <textarea class="reinvest__upload-textarea form-field__input" rows="1" autocapitalize="off" v-autosize v-check-empty
                           v-model="formSignedTxList"
                           @blur="$v.formSignedTxList.$touch()"
                    ></textarea>
                    <span class="form-field__label">{{ $td('Signed tx list', 'form.delegation-reinvest-start-list') }}</span>
                </label>
                <span class="form-field__error" v-if="$v.formSignedTxList.$dirty && !$v.formSignedTxList.required">{{ $td('Enter stake', 'form.delegation-reinvest-start-list-error-required') }}</span>
            </div>
            <div class="u-cell">
                <label class="link link--default u-relative">
                    <FileInput accept="text/plain" v-if="!fileApiError"
                               @on-add="handleFileUpdate"
                               @on-error="fileApiError = true"
                               @on-drag-start="isDragLayerVisible = true"
                               @on-drag-end="isDragLayerVisible = false"
                    />
                    {{ $td('Select or drop file', 'delegation.reinvest-upload-input') }}
                </label>
            </div>

            <!-- Controls -->
            <div class="u-cell">
                <button class="button button--main button--full" :class="{'is-loading': isFormSending, 'is-disabled': $v.$invalid}">
                    <span class="button__content">{{ $td('Start auto-delegation', `form.delegation-reinvest-start-button`) }}</span>
                    <Loader class="button__loader" :isLoading="true"/>
                </button>
                <div class="form-field__error" v-if="serverError">{{ serverError }}</div>
            </div>
            <div class="u-cell" v-if="serverSuccess">
                <strong>{{ $td('Auto-delegation have started', 'form.delegation-reinvest-start-success') }}</strong>
            </div>
        </div>

        <Modal :isOpen.sync="isDragLayerVisible"
               :hideCloseButton="true"
               modal-class="file-input__drag-layer"
               modal-container-class="file-input__drag-layer-container"
        >
            <h3 class="modal__title u-h2">{{ $td('Upload file', 'delegation.reinvest-upload-title') }}</h3>
            <p class="modal__text">{{ $td('Drop file anywhere to upload', 'delegation.reinvest-upload-description') }}</p>
        </Modal>
    </form>
</template>
