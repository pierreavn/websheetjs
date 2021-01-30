(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.websheet = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Cache {
    constructor(enabled) {
        this.enabled = enabled;
        this.fetchData = (googleSheetUrl) => {
            if (!this.enabled)
                return null;
            try {
                const json = localStorage.getItem(`websheet:${googleSheetUrl}`);
                return JSON.parse(json);
            }
            catch (error) {
                return null;
            }
        };
        this.setData = (googleSheetUrl, data) => {
            if (!this.enabled)
                return;
            localStorage.setItem(`websheet:${googleSheetUrl}`, JSON.stringify(data));
        };
        if (this.enabled !== false) {
            this.enabled = true;
        }
    }
}
exports.default = Cache;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handlers = [
    { attribute: /^data-websheet-text$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (value)
                block.innerText = value.formatted || value.value;
        } },
    { attribute: /^data-websheet-html$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (value)
                block.innerHTML = value.value;
        } },
    { attribute: /^data-websheet-if$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (!value || !value.value)
                block.remove();
        } },
    { attribute: /^data-websheet-unless$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (value && !!value.value)
                block.remove();
        } },
    { attribute: /^data-websheet-bind:(.*)$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            const targetAttr = attr.match(/^data-websheet-bind:(.*)$/)[1];
            if (value)
                block.setAttribute(targetAttr, value.formatted || value.value);
        } },
];
exports.default = handlers;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache_1 = require("./cache");
const snapshots_1 = require("./snapshots");
const style_1 = require("./style");
const formatters_1 = require("./formatters");
window._websheet_handlers = {};
document.head.insertAdjacentHTML("beforeend", style_1.default);
class Websheet {
    constructor(dataset, options) {
        this.dataset = dataset;
        this.options = options;
        this.abort = (message) => {
            this.snapshots.restore('initial');
            for (const section of this.sections) {
                section.classList.remove('websheet--loaded');
                section.classList.add('websheet--error');
            }
            throw new Error(`[websheet:${this.dataset}] ${message}`);
        };
        this.onDataReceived = (data, cacheVersion = false) => {
            if (data.status === 'error') {
                this.abort(data.errors.map(error => error.detailed_message).join(', '));
            }
            const rows = data.table.rows.map(rawRow => {
                const row = {};
                for (const index in data.table.cols) {
                    const col = data.table.cols[index];
                    if (col.label === "")
                        continue;
                    let value = rawRow.c[index] ? rawRow.c[index].v || null : null;
                    if (value && (col.type === 'date' || col.type === 'datetime')) {
                        value = eval(`new ${value}`);
                    }
                    row[col.label] = {
                        type: col.type,
                        value,
                        formatted: rawRow.c[index] ? rawRow.c[index].f || null : null
                    };
                }
                if (this.options.aliases) {
                    for (const alias of Object.keys(this.options.aliases)) {
                        const value = this.options.aliases[alias](row);
                        row[alias] = {
                            type: typeof value,
                            value,
                            formatted: null
                        };
                    }
                }
                return row;
            });
            if (this.options.caching) {
                if (cacheVersion) {
                    this.cachedVersionSig = data.sig;
                }
                else if (data.sig !== this.cachedVersionSig) {
                    this.cache.setData(this.googleSheetUrl, data);
                    if (this.snapshots.hasVersion('before_cache_applied')) {
                        this.snapshots.restore('before_cache_applied');
                    }
                }
                else {
                    return;
                }
            }
            if (cacheVersion)
                this.snapshots.capture('before_cache_applied');
            for (const section of this.sections) {
                this.renderSection(section, rows);
            }
            if (this.options.onLoaded && !cacheVersion) {
                this.options.onLoaded(rows);
            }
        };
        this.sections = [...document.querySelectorAll(`[data-websheet="${dataset}"]`)]
            .map(section => section);
        this.snapshots = new snapshots_1.Snapshots(this.sections);
        this.snapshots.capture('initial');
        this.cache = new cache_1.default(this.options.caching);
        this.templates = {};
        const templates = document.querySelectorAll(`[data-websheet-template]`);
        for (const template of templates) {
            const name = template.dataset.websheetTemplate;
            this.templates[name] = template;
        }
        this.renderTemplates();
        this.snapshots.capture('initial');
    }
    exec() {
        if (!this.options.url || !this.options.sheet)
            this.abort("Missing url or sheet");
        const urlParts = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\//g.exec(this.options.url);
        if (!urlParts)
            this.abort("Invalid spreadsheet url");
        this.fetchData(this.onDataReceived);
        const cachedData = this.cache.fetchData(this.googleSheetUrl);
        if (cachedData)
            this.onDataReceived(cachedData, true);
    }
    renderTemplates() {
        const renderables = document.querySelectorAll(`[data-websheet-render]`);
        for (const renderable of renderables) {
            const name = renderable.dataset.websheetRender;
            if (!this.templates[name]) {
                this.abort(`Template '${name}' not defined`);
            }
            renderable.innerHTML = this.templates[name].innerHTML;
        }
    }
    fetchData(callback) {
        const datasetId = Object.keys(window._websheet_handlers).length;
        const params = {
            tqx: 'out:json;responseHandler:window._websheet_handlers.dataset' + datasetId,
            sheet: this.options.sheet,
            headers: 1,
            tq: this.options.query ? this.options.query.trim() : 'select *'
        };
        const urlParts = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\//g.exec(this.options.url);
        const encodedParams = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`);
        this.googleSheetUrl = `https://docs.google.com/spreadsheets/d/${urlParts[1]}/gviz/tq?${encodedParams.join('&')}`;
        window._websheet_handlers[`dataset${datasetId}`] = callback;
        fetch(this.googleSheetUrl)
            .then(res => {
            if (res.status === 404) {
                throw new Error('spreadsheet not found');
            }
            else if (res.status !== 200) {
                throw new Error(`error ${res.status}`);
            }
            else {
                return res.text();
            }
        })
            .then(data => eval(data))
            .catch(err => {
            this.abort(`An error occured while trying to fetch data: ${err.stack}`);
        });
    }
    renderSection(section, rows) {
        const sectionClones = [];
        for (const row of rows) {
            const sectionClone = section.cloneNode(true);
            for (const formatter of formatters_1.default) {
                const elements = [...sectionClone.querySelectorAll('*')].filter(element => {
                    for (const attr of element.getAttributeNames()) {
                        if (attr.match(formatter.attribute)) {
                            return true;
                        }
                    }
                    return false;
                });
                for (const element of elements) {
                    for (const attr of element.getAttributeNames()) {
                        if (attr.match(formatter.attribute)) {
                            const attrInDataset = attr.substring(5).replace(/-[a-z]/g, group => group.substring(1).toUpperCase());
                            const attrValue = element.dataset[attrInDataset].trim();
                            if (formatter.valueSource === 'column') {
                                if (row[attrValue]) {
                                    formatter.handler(element, attr, row[attrValue]);
                                }
                                else {
                                    this.abort(`Column or alias '${attrValue}' not found (used in ${attr})`);
                                }
                            }
                            else {
                                formatter.handler(element, attr, attrValue);
                            }
                        }
                    }
                }
            }
            sectionClone.className = `${sectionClone.className} websheet--loaded`;
            sectionClones.push(sectionClone);
        }
        section.style.display = 'none';
        for (let i = 0; i < sectionClones.length; i++) {
            const ref = (i === 0 ? section : sectionClones[i - 1]);
            ref.parentNode.insertBefore(sectionClones[i], ref.nextSibling);
        }
    }
}
module.exports = (dataset, options) => {
    (new Websheet(dataset, options)).exec();
};

},{"./cache":1,"./formatters":2,"./snapshots":4,"./style":5}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Snapshots = void 0;
class Snapshots {
    constructor(elements) {
        this.versions = [];
        this.sections = elements.map(element => ({
            element,
            versions: {}
        }));
    }
    hasVersion(version) {
        return this.versions.includes(version);
    }
    capture(version) {
        for (const section of this.sections) {
            section.versions[version] = section.element.innerHTML;
        }
        if (!this.hasVersion(version))
            this.versions.push(version);
    }
    restore(version) {
        if (!this.hasVersion(version))
            throw new Error(`websheet versioning: version ${version} not found`);
        for (const section of this.sections) {
            section.element.innerHTML = section.versions[version];
        }
    }
}
exports.Snapshots = Snapshots;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = `<style>

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

},{}]},{},[3])(3)
});
