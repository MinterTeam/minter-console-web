
import {BASE_TITLE_NETWORK, BASE_TITLE_END} from '~/assets/variables';

export default function getTitle(text, locale) {
    const console = locale === 'ru' ? 'Консоль' : 'Console';
    if (text) {
        return BASE_TITLE_NETWORK + console + '. ' + text + BASE_TITLE_END;
    } else {
        return BASE_TITLE_NETWORK + console + BASE_TITLE_END;
    }
}
