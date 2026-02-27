/** Один склад из ответа API (тарифы коробов). По документации WB. */
export interface BoxTariffWarehouseRow {
    geoName: string;
    warehouseName: string;
    boxStorageBase: string;
    boxStorageLiter: string;
    boxStorageCoefExpr: string;
    boxDeliveryBase: string;
    boxDeliveryLiter: string;
    boxDeliveryCoefExpr: string;
    boxDeliveryMarketplaceBase: string;
    boxDeliveryMarketplaceLiter: string;
    boxDeliveryMarketplaceCoefExpr: string;
}

/** Блок data из ответа API тарифов коробов. */
export interface BoxTariffsApiData {
    dtNextBox: string;
    dtTillMax: string;
    warehouseList: BoxTariffWarehouseRow[];
}

/** Ответ API: корень с response.data. */
export interface BoxTariffsApiResponse {
    response: {
        data: BoxTariffsApiData;
    };
}
