import { ref, computed } from '@vue/composition-api';
import throttle from 'lodash-es/throttle.js';
import {getTimeOffset} from '~/assets/axios-time-offset.js';
import {getTimeDistance} from '~/assets/utils';
import useNow from '~/composables/use-now.js';
// ensure composition api is installed
import '~/plugins/composition-api.js';


// data
const isLastUpdateTimeChanged = ref(false);
const lastUpdateTime = ref(9999999999999);

// computed
const {now} = useNow();
/**
 * Text representation of distance to now
 * @type {ComputedRef<string|false>}
 */
const lastUpdateTimeDistance = computed(() => {
    const dummyVarToDependOnNow = now.value;
    return getTimeDistance(lastUpdateTime.value);
});
const lastUpdateTimeToNow = computed(() => {
    return now.value - lastUpdateTime.value;
});

// methods
export const setLastUpdateTime = throttle(_setLastUpdateTime, 1000, {leading: true, trailing: true});
function _setLastUpdateTime(timestamp) {
    lastUpdateTime.value = timestamp - getTimeOffset();
    isLastUpdateTimeChanged.value = true;
}



export default function useLastUpdateTime() {
    return {
        lastUpdateTime,
        lastUpdateTimeDistance,
        lastUpdateTimeToNow,
        isLastUpdateTimeChanged,
        setLastUpdateTime,
    };
}
