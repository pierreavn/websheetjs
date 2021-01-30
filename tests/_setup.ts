import {enableFetchMocks} from 'jest-fetch-mock';

enableFetchMocks();

const dataTable = {"cols":[{"id":"A","label":"Display ?","type":"boolean"},{"id":"B","label":"Product","type":"string"},{"id":"C","label":"Category","type":"string"},{"id":"D","label":"Price","type":"number","pattern":"#,##0.00\\ [$\u20AC-1]"},{"id":"E","label":"Discounted Price","type":"number","pattern":"#,##0.00\\ [$\u20AC-1]"},{"id":"F","label":"Discount End","type":"datetime","pattern":"dd/MM/yyyy HH:mm:ss"},{"id":"G","label":"Picture","type":"string"},{"id":"H","label":"","type":"string"},{"id":"I","label":"","type":"string"},{"id":"J","label":"","type":"string"},{"id":"K","label":"","type":"string"},{"id":"L","label":"","type":"string"},{"id":"M","label":"","type":"string"},{"id":"N","label":"","type":"string"},{"id":"O","label":"","type":"string"},{"id":"P","label":"","type":"string"},{"id":"Q","label":"","type":"string"},{"id":"R","label":"","type":"string"},{"id":"S","label":"","type":"string"},{"id":"T","label":"","type":"string"},{"id":"U","label":"","type":"string"},{"id":"V","label":"","type":"string"},{"id":"W","label":"","type":"string"}],"rows":[{"c":[{"v":true,"f":"TRUE"},{"v":"Baguette"},{"v":"Breads"},{"v":1.0,"f":"1,00 \u20AC"},null,null,{"v":"https://www.boulangerielangelus.com/wp-content/uploads/2015/09/BAGUETTE-CAMPAGNE_ss-ombres-1024x683.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Black Coffee"},{"v":"Drinks"},{"v":1.2,"f":"1,20 \u20AC"},null,null,{"v":"https://pngimg.com/uploads/mug_coffee/mug_coffee_PNG16844.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Croissant"},{"v":"Pastries"},{"v":0.8,"f":"0,80 \u20AC"},null,null,{"v":"https://pngimg.com/uploads/croissant/croissant_PNG46722.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Eclair"},{"v":"Pastries"},{"v":2.5,"f":"2,50 \u20AC"},null,null,{"v":"https://christian.fr/wp-content/uploads/2019/02/30.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":false,"f":"FALSE"},{"v":"Latte"},{"v":"Drinks"},{"v":1.5,"f":"1,50 \u20AC"},null,null,{"v":"https://www.pngkit.com/png/full/401-4016616_french-vanilla-cappuccino-cafe-latte-png.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Mille-Feuille"},{"v":"Pastries"},{"v":3.0,"f":"3,00 \u20AC"},{"v":2.8,"f":"2,80 \u20AC"},{"v":"Date(2050,0,16,0,0,0)","f":"16/01/2050 00:00:00"},{"v":"https://christian.fr/wp-content/uploads/2019/02/43.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Olive Bread"},{"v":"Breads"},{"v":3.0,"f":"3,00 \u20AC"},{"v":2.5,"f":"2,50 \u20AC"},{"v":"Date(2050,0,16,0,0,0)","f":"16/01/2050 00:00:00"},{"v":"https://www.boulangerielangelus.com/wp-content/uploads/2015/08/CAMUSETTE-OLIVES-01-1-1024x683.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Orange Juice"},{"v":"Drinks"},{"v":3.0,"f":"3,00 \u20AC"},null,null,{"v":"https://www.pngkit.com/png/full/65-651925_orange-juice-soft-drink-orange-juice-png.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Pain au chocolat"},{"v":"Pastries"},{"v":1.0,"f":"1,00 \u20AC"},null,null,{"v":"https://medias.bridor.com/media/sys_master/images/hee/h29/8801894793246.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Tea"},{"v":"Drinks"},{"v":1.2,"f":"1,20 \u20AC"},null,null,{"v":"https://cdn.pixabay.com/photo/2017/05/31/11/28/the-cup-2360104_960_720.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]},{"c":[{"v":true,"f":"TRUE"},{"v":"Whole Wheat Bread"},{"v":"Breads"},{"v":3.0,"f":"3,00 \u20AC"},null,null,{"v":"https://www.boulangerielangelus.com/wp-content/uploads/2015/09/PAIN-COMPLET-1024x873.png"},null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,{"v":null}]}],"parsedNumHeaders":1};

export function mockOnce(data: any) {
    fetchMock.mockOnce(async req => {
        const urlParts = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\/gviz\/tq\?(.*)$/g.exec(req.url);
        const sheetId = urlParts[1];
        const queryParams = {};
        for (const param of urlParts[2].split('&')) {
            const parts = param.split('=', 2);
            queryParams[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
        }

        const handler = queryParams['tqx'].split('responseHandler:', 2)[1];
        return `/*O_o*/
        ${handler}(${JSON.stringify(data)});`;
    })
}

fetchMock.mockIf(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\/gviz\/tq\?(.*)$/g, async req => {
    const urlParts = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([^/]*)\/gviz\/tq\?(.*)$/g.exec(req.url);
    const sheetId = urlParts[1];
    const queryParams = {};
    for (const param of urlParts[2].split('&')) {
        const parts = param.split('=', 2);
        queryParams[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    }

    let data = {};
    switch (sheetId) {
        case 'valid_sig1':
            data = {
                reqId: "0",
                version: "0.6",
                sig: "1",
                status: "ok",
                table: dataTable
            }
            break;

        case 'valid_sig2':
            data = {
                reqId: "0",
                version: "0.6",
                sig: "2",
                status: "ok",
                table: dataTable
            }
            break;

        case 'invalid':
            return {
                body: 'not found',
                status: 404
            }
    
        default:
            break;
    }

    const handler = queryParams['tqx'].split('responseHandler:', 2)[1];
    return `/*O_o*/
    ${handler}(${JSON.stringify(data)});`;
});
