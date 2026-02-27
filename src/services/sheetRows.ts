import type { BoxTariffWarehouseRow } from "#types/wbBoxTariffs.js";

export const COLUMN_ORDER: (keyof BoxTariffWarehouseRow)[] = [
    "geoName",
    "warehouseName",
    "boxStorageBase",
    "boxStorageLiter",
    "boxStorageCoefExpr",
    "boxDeliveryBase",
    "boxDeliveryLiter",
    "boxDeliveryCoefExpr",
    "boxDeliveryMarketplaceBase",
    "boxDeliveryMarketplaceLiter",
    "boxDeliveryMarketplaceCoefExpr",
];

export function parseCoefExpr(value: string): number {
    if (!value || value === "-") return 0;
    const n = parseFloat(value.replace(",", "."));
    return Number.isNaN(n) ? 0 : n;
}

export function buildSheetRows(list: BoxTariffWarehouseRow[]): (string | number)[][] {
    if (list.length === 0) return [];

    const sorted = [...list].sort(
        (a, b) =>
            parseCoefExpr(a.boxStorageCoefExpr) - parseCoefExpr(b.boxStorageCoefExpr)
    );
    const header = COLUMN_ORDER as (string | number)[];
    const rows = sorted.map((row) => COLUMN_ORDER.map((k) => row[k]));
    return [header, ...rows];
}
