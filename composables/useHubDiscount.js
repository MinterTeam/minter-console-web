import { ref, reactive, computed, watch } from '@vue/composition-api';
import debounce from 'debounce-promise';
import {getDiscountForHolder as _getDiscountForHolder} from '@/api/hub.js';

export default function useHubDiscount() {
    // two different debounced functions
    const debouncedGetDiscountMinter = makeDebouncedGetDiscount();
    const debouncedGetDiscountEth = makeDebouncedGetDiscount();

    const discountProps = reactive({
        minterAddress: '',
        ethAddress: '',
    });
    const discountMinter = ref(0);
    const discountEth = ref(0);
    const discount = computed(() => {
        return Math.max(discountEth.value, discountMinter.value);
    });

    const getMinterDiscount = async () => {
        discountMinter.value = await debouncedGetDiscountMinter(discountProps.minterAddress);
    };
    const getEthDiscount = async () => {
        discountEth.value = await debouncedGetDiscountEth(discountProps.ethAddress);
    };

    watch(() => discountProps.minterAddress, getMinterDiscount);
    watch(() => discountProps.ethAddress, getEthDiscount);

    return {
        discount,
        discountProps,
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
