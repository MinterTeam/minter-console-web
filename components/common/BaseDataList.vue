<script>
    export default {
        functional: true,
        props: {
            itemList: {
                type: Array,
                required: true,
            },
        },
        render(createElement, context) {
            // let options = '';
            // context.props.itemList.forEach((item) => {
            //     options += `<option value="${item}">${item}</option>`;
            // });
            return createElement('datalist', {
                attrs: context.data.attrs,
                // @TODO reconsider after https://bugs.chromium.org/p/chromium/issues/detail?id=721655 will be resolved
                // don't use innerHTML because Chrome flickers if it lose connection to previous HTMLElement after DOM update
                // domProps: {
                //     innerHTML: options,
                // },
            }, context.props.itemList.map((item) => createElement('option', {
                key: item,
                attrs: {
                    value: item,
                },
            }, item)));
        },
    };
</script>

<!--<template>
    <datalist>
        <option :value="item" v-for="item in itemList" :key="item">{{ item }}</option>
    </datalist>
</template>-->
