window._websheet = {
    handlers: {},
    templates: {}
}

/**
 * Websheet Style
 */
document.head.insertAdjacentHTML("beforeend", `<style>

.websheet--loaded[data-websheet] [data-websheet-on\\:loaded] {
    display: block;
}

[data-websheet-template],
[data-websheet] [data-websheet-on\\:loaded],
.websheet--loaded[data-websheet] [data-websheet-on\\:loading] {
    display: none;
}

</style>`);

function websheet(dataset, options) {
    const datasetId = Object.keys(window._websheet.handlers).length;
    window._websheet.handlers[`dataset${datasetId}`] = {};

    function abort(message) {
        throw new Error(`[websheet:${dataset}] ${message}`)
    }

    if (!options.url || !options.sheet)
        abort("Missing url or sheet");

    const urlParts = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\//g.exec(options.url);
    if (!urlParts)
        abort("Invalid spreadsheet url")

    // Enable caching by default
    if (options.caching !== false) {
        options.caching = true;
    }
    
    // Define templates
    const templates = document.querySelectorAll(`[data-websheet-template]`);
    for (const template of templates) {
        const name = template.dataset.websheetTemplate;
        window._websheet.templates[name] = template;
    }

    // Render templates
    const renderables = document.querySelectorAll(`[data-websheet-render]`);
    for (const renderable of renderables) {
        const name = renderable.dataset.websheetRender;
        if (!window._websheet.templates[name]) {
            abort(`Template '${name}' not found`);
        }

        renderable.innerHTML = window._websheet.templates[name].innerHTML;
    }

    const query = options.query ? options.query.trim() : 'select *';
    const elements = document.querySelectorAll(`[data-websheet="${dataset}"]`);

    const params = {
        tqx: 'out:json;responseHandler:window._websheet.handlers.dataset'+datasetId,
        sheet: options.sheet,
        headers: 1,
        tq: query
    };

    let cachedVersionSig = null;
    let elementsHtmlBeforeCacheApplied = [];
    const encodedParams = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`);
    const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${urlParts[1]}/gviz/tq?${encodedParams.join('&')}`;

    // Define data handler
    window._websheet.handlers[`dataset${datasetId}`] = (data, cacheVersion = false) => {
        if (data.status === 'error') {
            abort(data.errors.map(error => error.detailed_message).join(', '));
        }

        // Map row values to columns
        const rows = data.table.rows.map(rawRow => {
            const row = {};
            for (const index in data.table.cols) {
                const col = data.table.cols[index];
                if (col.label === "") continue;
                let value = rawRow.c[index] ? rawRow.c[index].v || null : null;

                // Parse if it's a date or datetime
                if (value && (col.type === 'date' || col.type === 'datetime')) {
                    value = eval(`new ${value}`);
                }

                row[ col.label ] = {
                    type: col.type,
                    value,
                    formatted: rawRow.c[index] ? rawRow.c[index].f || null : null
                }
            }

            // Generate aliases
            if (options.aliases) {
                for (const alias of Object.keys(options.aliases)) {
                    const value = options.aliases[alias](row);
                    row[alias] = {
                        type: typeof value,
                        value,
                        formatted: null
                    }
                }
            }

            return row;
        });

        if (options.onLoaded && !cacheVersion) {
            options.onLoaded(rows);
        }

        if (options.caching) {
            if (cacheVersion) {
                cachedVersionSig = data.sig;
            } else if (data.sig !== cachedVersionSig) {
                localStorage.setItem(`websheet:${googleSheetUrl}`, JSON.stringify(data));
                
                // Restore elements before cache applied
                elementsHtmlBeforeCacheApplied.map(el => el.el.innerHTML = el.html);
            } else {
                return;
            }
        }

        if (cacheVersion)
            elementsHtmlBeforeCacheApplied = [];
        
        for (const el of elements) {
            if (cacheVersion)
                elementsHtmlBeforeCacheApplied.push({el, html: el.innerHTML})

            renderElement(options, el, rows);
        }
    }

    // If caching enabled and data stored display them
    if (options.caching && (json = localStorage.getItem(`websheet:${googleSheetUrl}`))) {
        let data;
        try {
            data = JSON.parse(json);
        } catch (error) {
            data = null;
        }

        if (data) window._websheet.handlers[`dataset${datasetId}`](data, true);
    }
    
    fetch(googleSheetUrl)
        .then(res => res.text())
        .then(data => eval(data))

    /**
     * Handler for each section
     * @param {*} options 
     * @param {*} el 
     * @param {*} data 
     */
    function renderElement(options, el, rows) {

        const commands = [
            {   tag: 'text',
                valueSource: 'column',
                handler: (block, attr, value) => {
                    if (value) block.innerText = value.formatted || value.value;
                }},

            {   tag: 'html',
                valueSource: 'column',
                handler: (block, attr, value) => {
                    if (value) block.innerHTML = value.value;
                }},
            
            {   tag: 'if',
                valueSource: 'column',
                handler: (block, attr, value) => {
                    if (!value || !value.value)
                        block.remove()
                }},

            {   tag: 'unless',
                valueSource: 'column',
                handler: (block, attr, value) => {
                    if (value && !!value.value)
                        block.remove()
                }},

            {   tag: /^data-websheet-bind:(.*)$/,
                valueSource: 'column',
                handler: (block, attr, value) => {
                    const targetAttr = attr.match(/^data-websheet-bind:(.*)$/)[1];
                    if (value) block.setAttribute(targetAttr, value.formatted || value.value);
                }},
        ]
        
        // Clone element for each row
        let elClone = el.cloneNode(true);
        el.innerHTML = '';
        // let lastClone = el;
        for (const row of rows) {
            const clone = elClone.cloneNode(true);

            // Parse commands
            for (const cmd of commands) {
                let blocks;
                if (cmd.tag instanceof RegExp) {
                    blocks = getAllTagMatchesAttribute(clone, cmd.tag);
                } else {
                    blocks = clone.querySelectorAll(`[data-websheet-${cmd.tag}]`);
                }

                for (const block of blocks) {
                    let attributes;
                    if (cmd.tag instanceof RegExp) {
                        attributes = block.getAttributeNames().filter(attr => attr.match(cmd.tag));
                    } else {
                        attributes = [`data-websheet-${cmd.tag}`];
                    }

                    for (const attribute of attributes) {
                        const attributeInDataset = 'websheet' + attribute.substr(14).split('-').map(part => `${part[0].toUpperCase()}${part.substr(1)}`).join('');
                        const rule = block.dataset[attributeInDataset].trim();
                        if (cmd.valueSource === 'column') {
                            if (row[rule]) {
                                cmd.handler(block, attribute, row[rule]);
                            } else {
                                abort(`Column or alias '${rule}' not found (used in data-websheet-${cmd.tag})`);
                            }
                        } else {
                            cmd.handler(block, attribute, rule);
                        }
                    }
                    
                }
            }
    
            el.appendChild(clone);
            // el.parentNode.insertBefore(clone, lastClone.nextSibling);
            clone.className = `${clone.className} websheet--loaded`;
            // lastClone = clone;
        }
    
        // el.remove();
    }

    function getAllTagMatchesAttribute(el, regEx) {
        return Array.prototype.slice.call(el.querySelectorAll('*')).filter(function (el) { 
            for (const attr of el.getAttributeNames()) {
                if (attr.match(regEx))
                    return true;
            }
            return false;
        });
    }

}

// function getAllTagMatches(regEx) {
//     return Array.prototype.slice.call(document.querySelectorAll('*')).filter(function (el) { 
//       return el.tagName.match(regEx);
//     });
//   }
//   getAllTagMatches(/^di/i); // Returns an array of all elements that begin with "di", eg "div"