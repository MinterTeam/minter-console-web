import { ref, reactive, computed, watch } from 'vue';
import debounce from 'debounce-promise';
import {getDiscountForHolder as _getDiscountForHolder} from '~/api/hub.js';

export default function useHubDiscount() {
    // two different debounced functions
    const debouncedGetDiscountMinter = makeDebouncedGetDiscount();
    const debouncedGetDiscountEth = makeDebouncedGetDiscount();

    const props = reactive({
        minterAddress: '',
        ethAddress: '',
    });

    /**
     * @param {{minterAddress?: string, ethAddress?: string}} newProps
     */
    function setProps(newProps) {
        Object.assign(props, newProps);
    }

    const discountMinter = ref(0);
    const discountEth = ref(0);
    const discount = computed(() => {
        return Math.max(discountEth.value, discountMinter.value);
    });
    const discountUpsidePercent = computed(() => {
        const MAX_DISCOUNT = 0.6;
        return Math.round((MAX_DISCOUNT - discount.value) * 100);
    });

    const getMinterDiscount = async () => {
        discountMinter.value = await debouncedGetDiscountMinter(props.minterAddress);
    };
    const getEthDiscount = async () => {
        discountEth.value = await debouncedGetDiscountEth(props.ethAddress);
    };

    watch(() => props.minterAddress, getMinterDiscount);
    watch(() => props.ethAddress, getEthDiscount);

    return {
        discount,
        discountUpsidePercent,

        setDiscountProps: setProps,
    };
}

function getDiscountForHolder(address) {
    return _getDiscountForHolder(address)
        .catch((error) => {
            console.log(error);
            return 0;
        });
}

function makeDebouncedGetDiscount() {
    return debounce(getDiscountForHolder, 1000);
}
