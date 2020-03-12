import camelcaseKeys from 'camelcase-keys';

export default function toCamel(obj) {
    return camelcaseKeys(obj, {deep: true});
}
