<script>
    import {shortHashFilter} from "~/assets/utils";

    export default {
        props: {
            linkText: {
                type: String|Number,
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
            isShorten() {
                return this.linkText !== this.shortText;
            },
        },
        render(createElement) {
            return createElement(
                this.isNotLink ? 'div' : 'nuxt-link',
                {
                    class: {
                        'table__cell-overflow--middle': this.isShorten,
                        'link--default': !this.isNotLink,
                    },
                    props: this.isNotLink ? {} : {
                        to: this.linkPath,
                    },
                },
                [
                    this.shortText,
                ]
            );
        },
    };
</script>
