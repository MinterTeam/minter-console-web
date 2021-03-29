<script>
export default {
    middleware({redirect, app}) {
        return redirect(app.i18nGetPreferredPath('swap'));
    },
};
</script>
