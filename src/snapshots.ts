export class Snapshots {
    private versions: string[];
    private sections: {
        element: Element;
        versions: {[version: string]: string};
    }[];

    constructor(elements: Element[]) {
        this.versions = [];
        this.sections = elements.map(element => ({
            element,
            versions: {}
        }));
    }

    /**
     * Capture sections state and HTML, to be restored later
     * @param version 
     */
    capture(version: string) {
        for (const section of this.sections) {
            section.versions[version] = section.element.innerHTML;
        }

        if (!this.versions.includes(version))
            this.versions.push(version);
    }

    /**
     * Restore sections to a given version
     * @param version 
     */
    restore(version: string) {
        if (!this.versions.includes(version))
            throw new Error(`websheet versioning: version ${version} not found`);
            
        for (const section of this.sections) {
            section.element.innerHTML = section.versions[version];
        }
    }
}
