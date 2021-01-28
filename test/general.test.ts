import websheet from '../src/index';

describe("general", () => {

    it("should fail without url", () => {
        expect(() => {
            (<any> websheet)('test', {
                sheet: 'foo'
            })
        }).toThrow("[websheet:test] Missing url or sheet");
    })

    it("should fail with invalid url", () => {
        expect(() => {
            (<any> websheet)('test', {
                url: 'foo',
                sheet: 'bar'
            })
        }).toThrow("[websheet:test] Invalid spreadsheet url");
    })

    it("should fail without sheet", () => {
        expect(() => {
            (<any> websheet)('test', {
                url: 'foo'
            })
        }).toThrow("[websheet:test] Missing url or sheet");
    })

    // TODO
    // it("should fail with not found spreadsheet url", async () => {
    //     expect(async () => {
    //         await (<any> websheet)('test', {
    //             url: 'https://docs.google.com/spreadsheets/d/invalid/edit#gid=0',
    //             sheet: 'foo'
    //         })
    //     }).toThrow("[websheet:test] An error occured while trying to fetch data: spreadsheet not found");
    // })

    it("should succeed with valid url and sheet", (done) => {
        (<any> websheet)('test', {
            url: 'https://docs.google.com/spreadsheets/d/valid_sig1/edit#gid=0',
            sheet: 'foo',
            onLoaded: data => {
                expect(Array.isArray(data)).toEqual(true);

                expect(data[0]['Display ?'].type).toEqual('boolean');
                expect(data[0]['Display ?'].value).toEqual(true);
                expect(data[0]['Display ?'].formatted).toEqual('TRUE');

                expect(data[0]['Product'].type).toEqual('string');
                expect(data[0]['Product'].value).toEqual('Baguette');
                expect(data[0]['Product'].formatted).toEqual(null);

                expect(data[0]['Price'].type).toEqual('number');
                expect(data[0]['Price'].value).toEqual(1);
                expect(data[0]['Price'].formatted).toEqual('1,00 €');

                expect(data[0]['Picture'].type).toEqual('string');
                expect(data[0]['Picture'].value).toEqual('https://www.boulangerielangelus.com/wp-content/uploads/2015/09/BAGUETTE-CAMPAGNE_ss-ombres-1024x683.png');
                expect(data[0]['Picture'].formatted).toEqual(null);
                
                done();
            }
        })
    })

})