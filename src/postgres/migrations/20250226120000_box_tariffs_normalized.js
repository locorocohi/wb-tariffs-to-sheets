/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function up(knex) {
    await knex.schema.createTable("warehouses", (table) => {
        table.increments("id").primary();
        table.string("geo_name").notNullable();
        table.string("warehouse_name").notNullable();
        table.unique(["geo_name", "warehouse_name"]);
    });

    await knex.schema.createTable("box_tariffs_snapshots", (table) => {
        table.date("date").primary();
        table.string("dt_next_box");
        table.string("dt_till_max");
        table.timestamps(true, true);
    });

    await knex.schema.createTable("box_tariffs", (table) => {
        table.date("tariff_date").notNullable();
        table.integer("warehouse_id").unsigned().notNullable();
        table.foreign("warehouse_id").references("id").inTable("warehouses");
        table.string("box_storage_base");
        table.string("box_storage_liter");
        table.string("box_storage_coef_expr");
        table.string("box_delivery_base");
        table.string("box_delivery_liter");
        table.string("box_delivery_coef_expr");
        table.string("box_delivery_marketplace_base");
        table.string("box_delivery_marketplace_liter");
        table.string("box_delivery_marketplace_coef_expr");
        table.primary(["tariff_date", "warehouse_id"]);
        table.index("tariff_date");
    });
}

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
export async function down(knex) {
    await knex.schema.dropTableIfExists("box_tariffs");
    await knex.schema.dropTableIfExists("box_tariffs_snapshots");
    await knex.schema.dropTableIfExists("warehouses");
}
