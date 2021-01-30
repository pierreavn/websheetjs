import * as websheet from '../src/index';
import {mockOnce} from './_setup';
import * as $ from 'jquery';

const mockData = {
    reqId: "0",
    version: "0.6",
    sig: "1",
    status: "ok",
    table: {
        cols: [
            {"id":"A", "label":"Link", "type":"string"}
        ],
        rows: [
            {"c": [{"v": "https://example.com/"}]},
        ]
    }
};

beforeEach(() => {
    document.body.innerHTML = '';
})

describe("states", () => {

    it("'websheet--loaded' state", (done) => {
        mockOnce(mockData);

        const section = $(`<div data-websheet="section">`);
        $("body").append(section);

        (<any> websheet)('section', {
            url: 'https://docs.google.com/spreadsheets/d/once/edit#gid=0',
            sheet: 'foo',
            onLoaded: data => {
                const el = $($(`[data-websheet="section"]`)[1]);
                expect(el.hasClass('websheet--loaded')).toBe(true);
                done();
            }
        })
    })

    // TODO
    // it("'websheet--error' state", (done) => {
    //     mockOnce(mockData);

    //     const section = $(`<div data-websheet="section">`)
    //         .append($(`<div data-websheet-if="Invalid Column">`))
    //     $("body").append(section);

    //     try {
    //         (<any> websheet)('section', {
    //             url: 'https://docs.google.com/spreadsheets/d/once/edit#gid=0',
    //             sheet: 'foo'
    //         })
    //     } catch (error) {
    //         const el = $($(`[data-websheet="section"]`)[1]);
    //         expect(el.hasClass('websheet--error')).toBe(true);
    //         done();
    //     }
    // })

})