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
            {"id":"A", "label":"Display ?", "type":"boolean"}
        ],
        rows: [
            {"c": [{"v":true, "f":"TRUE"}]},
            {"c": [{"v":false, "f":"FALSE"}]}
        ]
    }
};

beforeEach(() => {
    document.body.innerHTML = '';
})

describe("conditions", () => {

    it("'if' formatter", (done) => {
        mockOnce(mockData);

        const section = $(`<div data-websheet="section">`)
            .append(`<div data-websheet-if="Display ?">`);
        $("body").append(section);

        (<any> websheet)('section', {
            url: 'https://docs.google.com/spreadsheets/d/once/edit#gid=0',
            sheet: 'foo',
            onLoaded: data => {
                const row1 = $($(`[data-websheet="section"]`)[1]);
                expect(row1.find('div').length).toEqual(1);

                const row2 = $($(`[data-websheet="section"]`)[2]);
                expect(row2.find('div').length).toEqual(0);

                done();
            }
        })
    })

    it("'unless' formatter", (done) => {
        mockOnce(mockData);

        const section = $(`<div data-websheet="section">`)
            .append(`<div data-websheet-unless="Display ?">`);
        $("body").append(section);

        (<any> websheet)('section', {
            url: 'https://docs.google.com/spreadsheets/d/once/edit#gid=0',
            sheet: 'foo',
            onLoaded: data => {
                const row1 = $($(`[data-websheet="section"]`)[1]);
                expect(row1.find('div').length).toEqual(0);

                const row2 = $($(`[data-websheet="section"]`)[2]);
                expect(row2.find('div').length).toEqual(1);

                done();
            }
        })
    })

})