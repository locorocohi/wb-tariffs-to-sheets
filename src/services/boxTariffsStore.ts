import knex from "#postgres/knex.js";
import type { BoxTariffsApiData, BoxTariffWarehouseRow } from "#types/wbBoxTariffs.js";
import { todayDateStringMoscow } from "#utils/dateUtils.js";

const BOX_TARIFF_ROW_SELECT = [
    "w.geo_name",
    "w.warehouse_name",
    "t.box_storage_base",
    "t.box_storage_liter",
    "t.box_storage_coef_expr",
    "t.box_delivery_base",
    "t.box_delivery_liter",
    "t.box_delivery_coef_expr",
    "t.box_delivery_marketplace_base",
    "t.box_delivery_marketplace_liter",
    "t.box_delivery_marketplace_coef_expr",
] as const;

type BoxTariffDbRow = {
    geo_name: string;
    warehouse_name: string;
    box_storage_base: string;
    box_storage_liter: string;
    box_storage_coef_expr: string;
    box_delivery_base: string;
    box_delivery_liter: string;
    box_delivery_coef_expr: string;
    box_delivery_marketplace_base: string;
    box_delivery_marketplace_liter: string;
    box_delivery_marketplace_coef_expr: string;
};

type BoxTariffInsertRow = {
    tariff_date: string;
    warehouse_id: number;
    box_storage_base: string;
    box_storage_liter: string;
    box_storage_coef_expr: string;
    box_delivery_base: string;
    box_delivery_liter: string;
    box_delivery_coef_expr: string;
    box_delivery_marketplace_base: string;
    box_delivery_marketplace_liter: string;
    box_delivery_marketplace_coef_expr: string;
};

const key = (geo: string, name: string) => `${geo}\0${name}`;

async function getOrCreateWarehouseIds(
    pairs: Array<{ geoName: string; warehouseName: string }>
): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (pairs.length === 0) return map;

    const pairRows = pairs.map((p) => [p.geoName, p.warehouseName]);
    const existing = await knex("warehouses")
        .select("id", "geo_name", "warehouse_name")
        .whereIn(["geo_name", "warehouse_name"], pairRows);

    for (const r of existing) map.set(key(r.geo_name, r.warehouse_name), r.id);

    const toInsert = pairs.filter((p) => !map.has(key(p.geoName, p.warehouseName)));
    if (toInsert.length > 0) {
        const inserted = await knex("warehouses")
            .insert(toInsert.map((p) => ({ geo_name: p.geoName, warehouse_name: p.warehouseName })))
            .onConflict(["geo_name", "warehouse_name"])
            .merge(["geo_name", "warehouse_name"])
            .returning(["id", "geo_name", "warehouse_name"]);

        for (const r of inserted) map.set(key(r.geo_name, r.warehouse_name), r.id);
    }
    return map;
}

function toWarehouseRow(row: BoxTariffDbRow): BoxTariffWarehouseRow {
    return {
        geoName: row.geo_name,
        warehouseName: row.warehouse_name,
        boxStorageBase: row.box_storage_base,
        boxStorageLiter: row.box_storage_liter,
        boxStorageCoefExpr: row.box_storage_coef_expr,
        boxDeliveryBase: row.box_delivery_base,
        boxDeliveryLiter: row.box_delivery_liter,
        boxDeliveryCoefExpr: row.box_delivery_coef_expr,
        boxDeliveryMarketplaceBase: row.box_delivery_marketplace_base,
        boxDeliveryMarketplaceLiter: row.box_delivery_marketplace_liter,
        boxDeliveryMarketplaceCoefExpr: row.box_delivery_marketplace_coef_expr,
    };
}

export async function upsertBoxTariffsForDate(
    data: BoxTariffsApiData,
    date?: string
): Promise<void> {
    const dateStr = date ?? todayDateStringMoscow();

    await knex("box_tariffs_snapshots")
        .insert({
            date: dateStr,
            dt_next_box: data.dtNextBox,
            dt_till_max: data.dtTillMax,
            updated_at: knex.fn.now(),
        })
        .onConflict("date")
        .merge(["dt_next_box", "dt_till_max", "updated_at"]);

    await knex("box_tariffs").where("tariff_date", dateStr).del();

    if (data.warehouseList.length > 0) {
        const warehouseIds = await getOrCreateWarehouseIds(
            data.warehouseList.map((w) => ({ geoName: w.geoName, warehouseName: w.warehouseName }))
        );
        const rows: BoxTariffInsertRow[] = [];

        for (const w of data.warehouseList) {
            const id = warehouseIds.get(key(w.geoName, w.warehouseName));
            if (id === undefined) continue;
            rows.push({
                tariff_date: dateStr,
                warehouse_id: id,
                box_storage_base: w.boxStorageBase,
                box_storage_liter: w.boxStorageLiter,
                box_storage_coef_expr: w.boxStorageCoefExpr,
                box_delivery_base: w.boxDeliveryBase,
                box_delivery_liter: w.boxDeliveryLiter,
                box_delivery_coef_expr: w.boxDeliveryCoefExpr,
                box_delivery_marketplace_base: w.boxDeliveryMarketplaceBase,
                box_delivery_marketplace_liter: w.boxDeliveryMarketplaceLiter,
                box_delivery_marketplace_coef_expr: w.boxDeliveryMarketplaceCoefExpr,
            });
        }

        if (rows.length > 0) {
            await knex("box_tariffs").insert(rows);
        }
    }
}

async function getBoxTariffsForDate(tariffDate: string): Promise<BoxTariffDbRow[]> {
    const rows = await knex("box_tariffs as t")
        .join("warehouses as w", "t.warehouse_id", "w.id")
        .where("t.tariff_date", tariffDate)
        .select(...BOX_TARIFF_ROW_SELECT);
    return rows as BoxTariffDbRow[];
}

export async function getLatestBoxTariffs(): Promise<BoxTariffWarehouseRow[] | null> {
    const today = todayDateStringMoscow();
    let rows = await getBoxTariffsForDate(today);
    if (rows.length === 0) {
        const latest = await knex("box_tariffs")
            .select("tariff_date")
            .orderBy("tariff_date", "desc")
            .first();
        if (!latest) return null;
        rows = await getBoxTariffsForDate(latest.tariff_date);
    }
    return rows.map((r) => toWarehouseRow(r));
}

export { todayDateStringMoscow };
