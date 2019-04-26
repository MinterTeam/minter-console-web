<script>
    import {shortHashFilter} from "~/assets/utils";

    export default {
        props: {
            linkText: {
                type: [String, Number],
                required: true,
            },
            linkPath: {
                type: String,
                required: true,
            },
            isNotLink: {
                type: Boolean,
                default: false,
            },
            shouldNotShorten: {
                type: Boolean,
                default: false,
            },
        },
        computed: {
            shortText() {
                return this.shouldNotShorten ? this.linkText : shortHashFilter(this.linkText);
            },
            // isShorten() {
            //     return this.linkText !== this.shortText;
            // },
            isExternal() {
                return this.linkPath.indexOf('http') === 0 || this.linkPath.indexOf('//') === 0;
            },
            elementTag() {
                if (this.isNotLink) {
                    return 'div';
                } else if (this.isExternal) {
                    return 'a';
                } else {
                    return 'nuxt-link';
                }
            },
            elementData() {
                let elData = {
                    class: {
                        // 'table__cell-overflow--middle': this.isShorten,
                        'link--default': !this.isNotLink,
                    },
                };

                if (this.isNotLink) {

                } else if (this.isExternal) {
                    elData.attrs = {
                        href: this.linkPath,
                        target: '_blank',
                    };
                } else {
                    elData.props = {
                        to: this.linkPath,
                    };
                }

                return elData;
            },
        },
        render(createElement) {
            return createElement(
                this.elementTag,
                this.elementData,
                [
                    this.shortText,
                ]
            );
        },
    };
</script>
