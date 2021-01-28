type TemplateFormatter = {
    attribute: RegExp;
    valueSource: 'column' | 'raw';
    handler: (block: HTMLElement, attribute: string, value: any) => void;
}

/**
 * Handlers to apply on sections elements
 */
const handlers: TemplateFormatter[] = [
    {   attribute: /^data-websheet-text$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (value) block.innerText = value.formatted || value.value;
        }},

    {   attribute: /^data-websheet-html$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (value) block.innerHTML = value.value;
        }},
    
    {   attribute: /^data-websheet-if$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (!value || !value.value)
                block.remove()
        }},

    {   attribute: /^data-websheet-unless$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            if (value && !!value.value)
                block.remove()
        }},

    {   attribute: /^data-websheet-bind:(.*)$/,
        valueSource: 'column',
        handler: (block, attr, value) => {
            const targetAttr = attr.match(/^data-websheet-bind:(.*)$/)[1];
            if (value) block.setAttribute(targetAttr, value.formatted || value.value);
        }},
];

export default handlers;