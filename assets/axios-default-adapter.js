import axios from 'axios';
import adapters from 'axios/lib/adapters/adapters.js';

const getAdapter = adapters.getAdapter;

/**
 *
 * @return {import('axios').AxiosAdapter}
 */
export function getDefaultAdapter() {
    return getAdapter(axios.defaults.adapter);
}
