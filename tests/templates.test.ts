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
            {"id":"A", "label":"FirstName", "type":"string"},
            {"id":"B", "label":"LastName", "type":"string"}
        ],
        rows: [
            {"c": [{"v": "Foo"}, {"v": "BAR"}]},
        ]
    }
};

beforeEach(() => {
    document.body.innerHTML = '';
})

describe("templates", () => {

    it("should work", (done) => {
        mockOnce(mockData);

        $("body").append(
            $(`<div data-websheet-template="firstname">`)
                .append(`<div data-websheet-html="FirstName">`)
        );

        $("body").append(
            $(`<div data-websheet-template="lastname">`)
                .append(`<div data-websheet-html="LastName">`)
        );

        const section = $(`<div data-websheet="section">`)
            .append(`<div data-websheet-render="lastname">`)
            .append(`<div>-</div>`)
            .append(`<div data-websheet-render="firstname">`);
        $("body").append(section);

        (<any> websheet)('section', {
            url: 'https://docs.google.com/spreadsheets/d/once/edit#gid=0',
            sheet: 'foo',
            onLoaded: data => {
                const el = $($(`[data-websheet="section"]`)[1]);
                expect(el.html()).toEqual(
                    `<div data-websheet-render="lastname"><div data-websheet-html="LastName">BAR</div></div><div>-</div><div data-websheet-render="firstname"><div data-websheet-html="FirstName">Foo</div></div>`
                );
                done();
            }
        })
    })

})