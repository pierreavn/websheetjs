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

describe("binding", () => {

    it("alphanumeric", (done) => {
        mockOnce(mockData);

        const section = $(`<div data-websheet="section">`)
            .append(`<a data-websheet-bind:hr3f="Link">`);
        $("body").append(section);

        (<any> websheet)('section', {
            url: 'https://docs.google.com/spreadsheets/d/once/edit#gid=0',
            sheet: 'foo',
            onLoaded: data => {
                const link = $($(`a`)[1]);
                expect(link.attr('hr3f')).toEqual('https://example.com/');
                done();
            }
        })
    })

    it("with dashes", (done) => {
        mockOnce(mockData);

        const section = $(`<div data-websheet="section">`)
            .append(`<a data-websheet-bind:hr3f-two="Link">`);
        $("body").append(section);

        (<any> websheet)('section', {
            url: 'https://docs.google.com/spreadsheets/d/once/edit#gid=0',
            sheet: 'foo',
            onLoaded: data => {
                const link = $($(`a`)[1]);
                expect(link.attr('hr3f-two')).toEqual('https://example.com/');
                done();
            }
        })
    })

})