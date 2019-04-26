<script>
    import QrScanner from 'qr-scanner';
    import QrScannerWorkerPath from '!!file-loader!~/node_modules/qr-scanner/qr-scanner-worker.min.js';
    import Modal from '~/components/common/Modal';

    QrScanner.WORKER_PATH = QrScannerWorkerPath;

    /** @type QrScanner */
    let qrScanner;

    export default {
        components: {
            Modal,
        },
        props: {
            qrVisible: {
                type: Boolean,
                default: false,
            },
        },
        data() {
            return {
                hasCamera: false,
                cameraError: false,
                isModalVisible: false,
            };
        },
        mounted() {
            QrScanner.hasCamera()
                .then(() => {
                    this.hasCamera = true;
                    this.$emit('update:qrVisible', true);

                    qrScanner = new QrScanner(this.$refs.qrVideo, (result) => {
                        qrScanner.stop();
                        this.isModalVisible = false;
                        this.$emit('qrScanned', result);
                    });
                })
                .catch(() => {
                    this.hasCamera = false;
                    this.$emit('update:qrVisible', false);
                });
        },
        destroyed() {
            if (qrScanner) {
                qrScanner.destroy();
            }
        },
        methods: {
            scanQr() {
                this.isModalVisible = true;
                qrScanner.start()
                    .then(() => {
                        this.cameraError = false;
                    })
                    .catch(() => {
                        this.cameraError = true;
                    });
            },
            stopScanQr() {
                qrScanner.stop();
            },
        },

    };
</script>

<template>
    <div v-show="hasCamera" @click.prevent>
        <button class="form-field__icon form-field__icon--qr u-semantic-button" type="button" @click.prevent="scanQr">
            <img src="/img/icon-qr.svg" alt="Scan QR Code" width="24" height="24">
        </button>
        <Modal class="qr-scan__modal"
               modal-container-class="qr-scan__modal-container"
               v-bind:isOpen.sync="isModalVisible"
               :keepMarkup="true"
               @modalClose="stopScanQr"
        >
            <div class="qr-scan__notice">
                <svg class="loader" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28">
                    <circle class="loader__path" cx="14" cy="14" r="12"></circle>
                </svg>
                <div v-if="cameraError">Allow camera access</div>
            </div>
            <video class="qr-scan__video" ref="qrVideo" autoplay playsinline muted></video>
        </Modal>
    </div>
</template>
