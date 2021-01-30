import Cache from './cache';
import { Snapshots } from './snapshots';
import style from './style';
import formatters from './formatters';

(<any> window)._websheet_handlers = {};

// Load Websheet Style
document.head.insertAdjacentHTML("beforeend", style);

type WebsheetOptions = {
    url: string;
    sheet: string;
    caching?: boolean;
    query?: string;
    onLoaded?: (data: any) => void;
    aliases?: {[key: string]: (row: any) => any};
}

class Websheet {
    private sections: HTMLElement[];
    private cache: Cache;
    private snapshots: Snapshots;
    private templates: {[name: string]: Element};
    private cachedVersionSig: any;
    private googleSheetUrl: string;

    constructor(
        private dataset: string,
        private options: WebsheetOptions
    ) {
        // Fetch websheet sections
        this.sections = [...document.querySelectorAll(`[data-websheet="${dataset}"]`)]
            .map(section => <HTMLElement> section);

        // Initialize snapshots & create initial one
        this.snapshots = new Snapshots(this.sections);
        this.snapshots.capture('initial');

        // Initialize cache
        this.cache = new Cache(this.options.caching);

        // Declare templates
        this.templates = {};
        const templates = document.querySelectorAll(`[data-websheet-template]`);
        for (const template of templates) {
            const name = (<HTMLElement> template).dataset.websheetTemplate;
            this.templates[name] = template;
        }

        // Render templates sections
        this.renderTemplates();

        // Recapture initial template with rendered templates
        this.snapshots.capture('initial');
    }

    /**
     * Abort current websheet execution,
     * render error elements and throw an error
     * @param {string} message to display in console
     */
    private abort = (message: string): void => {
        // Restore sections to initial state
        this.snapshots.restore('initial');

        // Display error elements
        for (const section of this.sections) {
            section.classList.remove('websheet--loaded');
            section.classList.add('websheet--error');
        }

        throw new Error(`[websheet:${this.dataset}] ${message}`);
    }

    /**
     * Start websheet execution process
     */
    exec() {
        if (!this.options.url || !this.options.sheet)
            this.abort("Missing url or sheet");

        const urlParts = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\//g.exec(this.options.url);
        if (!urlParts)
            this.abort("Invalid spreadsheet url");

        // Fetch data from Google Sheet URL
        this.fetchData(this.onDataReceived);

        // If caching enabled and data stored, display them
        const cachedData = this.cache.fetchData(this.googleSheetUrl);
        if (cachedData) this.onDataReceived(cachedData, true);
    }


    /**
     * Render registered templates
     */
    private renderTemplates(): void {
        const renderables = document.querySelectorAll(`[data-websheet-render]`);
        for (const renderable of renderables) {
            const name = (<HTMLElement> renderable).dataset.websheetRender;
            if (!this.templates[name]) {
                this.abort(`Template '${name}' not defined`);
            }

            renderable.innerHTML = this.templates[name].innerHTML;
        }
    }

    /**
     * Fetch spreadsheet data from Google API
     * @param callback triggered when data are loaded
     * @return {string} googleSheetUrl
     */
    private fetchData(callback: (data: any, cacheVersion: boolean) => void): void {
        const datasetId = Object.keys((<any> window)._websheet_handlers).length;
        const params = {
            tqx: 'out:json;responseHandler:window._websheet_handlers.dataset'+datasetId,
            sheet: this.options.sheet,
            headers: 1,
            tq: this.options.query ? this.options.query.trim() : 'select *'
        };
    
        const urlParts = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\//g.exec(this.options.url);
        const encodedParams = Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`);
        this.googleSheetUrl = `https://docs.google.com/spreadsheets/d/${urlParts[1]}/gviz/tq?${encodedParams.join('&')}`;
    
        // Define data handler
        (<any> window)._websheet_handlers[`dataset${datasetId}`] = callback;

        fetch(this.googleSheetUrl)
            .then(res => {
                if (res.status === 404) {
                    throw new Error('spreadsheet not found');
                } else if (res.status !== 200) {
                    throw new Error(`error ${res.status}`);
                } else {
                    return res.text();
                }
            })
            .then(data => eval(data))
            .catch(err => {
                this.abort(`An error occured while trying to fetch data: ${err.stack}`)
            })
    }

    private onDataReceived = (data: any, cacheVersion: boolean = false): void => {
        if (data.status === 'error') {
            this.abort(data.errors.map(error => error.detailed_message).join(', '));
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
            if (this.options.aliases) {
                for (const alias of Object.keys(this.options.aliases)) {
                    const value = this.options.aliases[alias](row);
                    row[alias] = {
                        type: typeof value,
                        value,
                        formatted: null
                    }
                }
            }

            return row;
        });

        if (this.options.caching) {
            if (cacheVersion) {
                this.cachedVersionSig = data.sig;
            } else if (data.sig !== this.cachedVersionSig) {
                this.cache.setData(this.googleSheetUrl, data);
                
                // Restore elements before cache applied
                if (this.snapshots.hasVersion('before_cache_applied')) {
                    this.snapshots.restore('before_cache_applied');
                }
            } else {
                return; // everything is ok
            }
        }

        if (cacheVersion)
            this.snapshots.capture('before_cache_applied');
        
        for (const section of this.sections) {
            this.renderSection(section, rows);
        }

        // Callback
        if (this.options.onLoaded && !cacheVersion) {
            this.options.onLoaded(rows);
        }
    }

    renderSection(section: HTMLElement, rows: any): void {
        const sectionClones = [];

        // Clone section for each row
        for (const row of rows) {
            const sectionClone = <HTMLElement> section.cloneNode(true);

            // Apply formatters
            for (const formatter of formatters) {
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
                            const attrValue = (<HTMLElement> element).dataset[attrInDataset].trim();

                            if (formatter.valueSource === 'column') {
                                if (row[attrValue]) {
                                    formatter.handler(<HTMLElement> element, attr, row[attrValue]);
                                } else {
                                    this.abort(`Column or alias '${attrValue}' not found (used in ${attr})`);
                                }
                            } else {
                                formatter.handler(<HTMLElement> element, attr, attrValue);
                            }
                        }
                    }
                }
            }

            sectionClone.className = `${sectionClone.className} websheet--loaded`;
            sectionClones.push(sectionClone);
        }

        // Hide section template and insert all clones
        section.style.display = 'none';
        for (let i = 0; i < sectionClones.length; i++) {
            const ref = (i === 0 ? section : sectionClones[i-1]);
            ref.parentNode.insertBefore(sectionClones[i], ref.nextSibling);
        }
    }
}

module.exports = (dataset: string, options: WebsheetOptions) => {
    (new Websheet(dataset, options)).exec();
}
