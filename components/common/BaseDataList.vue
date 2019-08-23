<script>
    export default {
        props: {
            itemList: {
                type: Array,
                required: true,
            },
            displayField: {
                type: String,
                required: true,
            },
        },
    };
</script>

<template>
    <datalist>
        <option :value="item[displayField]" v-for="item in itemList" :key="item[displayField]">{{ item[displayField] }}</option>
    </datalist>
</template>
