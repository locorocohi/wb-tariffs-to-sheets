import knex from "#postgres/knex.js";
import env from "#config/env/env.js";

/**
 * Сохраняет в таблицу spreadsheets ID из env, которых ещё нет в БД (при первом/каждом старте).
 */
export async function ensureSpreadsheetsFromEnv(): Promise<void> {
    const ids = env.SPREADSHEET_IDS;
    if (ids.length === 0) return;
    await knex("spreadsheets")
        .insert(ids.map((spreadsheet_id) => ({ spreadsheet_id })))
        .onConflict("spreadsheet_id")
        .ignore();
}

/**
 * Возвращает список ID таблиц для синхронизации из БД.
 */
export async function getSpreadsheetIds(): Promise<string[]> {
    const rows = await knex("spreadsheets").select("spreadsheet_id").orderBy("spreadsheet_id");
    return rows.map((r) => r.spreadsheet_id);
}
