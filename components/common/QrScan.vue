<script>
    import QrScanner from 'qr-scanner/src/qr-scanner';
    import QrScannerWorkerPath from '!!file-loader!~/node_modules/qr-scanner/qr-scanner-worker.min.js';
    import Loader from '~/components/common/Loader';
    import Modal from '~/components/common/Modal';

    QrScanner.WORKER_PATH = QrScannerWorkerPath;


    export default {
        components: {
            Loader,
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
                /** @type QrScanner */
                qrScanner: null,
                cameraError: false,
                isModalVisible: false,
                isPlaying: false,
            };
        },
        mounted() {
            QrScanner.hasCamera()
                .then(() => {
                    this.$emit('update:qrVisible', true);
                    this.qrScanner = new QrScanner(this.$refs.qrVideo, (result) => {
                        this.stopScanQr();
                        this.isModalVisible = false;
                        this.$emit('qrScanned', result);
                    });
                })
                .catch(() => {
                    this.$emit('update:qrVisible', false);
                });
        },
        destroyed() {
            if (this.qrScanner) {
                this.qrScanner.destroy();
            }
        },
        methods: {
            scanQr() {
                this.isModalVisible = true;
                this.$refs.qrVideo.addEventListener('canplay', this.handlePlayStart);
                this.qrScanner.start()
                    .then(() => {
                        this.cameraError = false;
                    })
                    .catch(() => {
                        this.cameraError = true;
                    });
            },
            stopScanQr() {
                this.qrScanner.stop();
                this.isPlaying = false;
                window.removeEventListener('resize', this.repositionOverlay);
            },
            handlePlayStart() {
                this.repositionOverlay();
                this.isPlaying = true;
                window.addEventListener('resize', this.repositionOverlay);
                this.$refs.qrVideo.removeEventListener('canplay', this.handlePlayStart);
            },
            repositionOverlay() {
                requestAnimationFrame(() => {
                    if (!this.$refs.qrVideo) {
                        return;
                    }
                    const scannerHeight = this.$refs.qrVideo.offsetHeight;
                    const scannerWidth = this.$refs.qrVideo.offsetWidth;
                    const smallerDimension = Math.min(scannerHeight, scannerWidth);
                    if (smallerDimension === 0) return; // component not visible or destroyed
                    const overlaySize = Math.ceil(2 / 3 * smallerDimension);
                    // not always the accurate size of the sourceRect for QR detection in QrScanner (e.g. if video is landscape and screen portrait) but looks nicer in the UI.
                    const $qrOverlay = this.$refs.overlay;
                    $qrOverlay.style.width = overlaySize + 'px';
                    $qrOverlay.style.height = overlaySize + 'px';
                    $qrOverlay.style.top = ((scannerHeight - overlaySize) / 2) + 'px';
                    $qrOverlay.style.left = ((scannerWidth - overlaySize) / 2) + 'px';
                });
            },
        },

    };
</script>

<template>
    <div v-show="qrScanner" @click.prevent>
        <button class="form-field__icon u-semantic-button" type="button" @click.prevent="scanQr">
            <img src="/img/icon-qr.svg" alt="Scan QR Code" width="24" height="24">
        </button>
        <Modal class="qr-scan__modal"
               modal-container-class="qr-scan__modal-container"
               v-bind:isOpen.sync="isModalVisible"
               :keepMarkup="true"
               @modalClose="stopScanQr"
        >
            <div class="qr-scan__wrap">
                <div class="qr-scan__notice">
                    <Loader :isLoading="true"/>
                    <div v-if="cameraError">Allow camera access</div>
                </div>
                <video class="qr-scan__video" ref="qrVideo" autoplay playsinline muted></video>
                <div ref="overlay" class="qr-scan__overlay" v-show="isPlaying">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 238 238">
                        <path fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M31.3 2H10a8 8 0 0 0-8 8v21.3M206.8 2H228a8 8 0 0 1 8 8v21.3m0 175.4V228a8 8 0 0 1-8 8h-21.3m-175.4 0H10a8 8 0 0 1-8-8v-21.3"/>
                    </svg>
                </div>
            </div>
        </Modal>
    </div>
</template>
