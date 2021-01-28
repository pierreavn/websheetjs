export default class Cache {

    constructor(private enabled?: boolean) {
        // Enable caching by default
        if (this.enabled !== false) {
            this.enabled = true;
        }
    }

    /**
     * Fetch previously cached data
     * @param {string} googleSheetUrl 
     */
    fetchData = (googleSheetUrl: string): any => {
        if (!this.enabled) return null;

        try {
            const json = localStorage.getItem(`websheet:${googleSheetUrl}`)
            return JSON.parse(json);
        } catch (error) {
            return null;
        }
    }

    /**
     * Store data into cache
     * @param {string} googleSheetUrl 
     * @param {any} data 
     */
    setData = (googleSheetUrl: string, data: any): void => {
        if (!this.enabled) return;
        localStorage.setItem(`websheet:${googleSheetUrl}`, JSON.stringify(data));
    }

}
