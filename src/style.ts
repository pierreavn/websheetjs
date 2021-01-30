/**
 * websheet.js embeded style
 */

export default `<style>

.websheet--loaded[data-websheet] [data-websheet-on\\:loaded] {
    display: block;
}

.websheet--error[data-websheet] [data-websheet-on\\:error] {
    display: block;
}

.websheet--error[data-websheet] [data-websheet-on\\:loading] {
    display: none;
}

[data-websheet-template],
[data-websheet] [data-websheet-on\\:loaded],
[data-websheet] [data-websheet-on\\:error],
.websheet--loaded[data-websheet] [data-websheet-on\\:loading] {
    display: none;
}

</style>`;