import { google } from "googleapis";
import type { GoogleAuth } from "google-auth-library";
import { readFile } from "fs/promises";
import env from "#config/env/env.js";
import type { BoxTariffWarehouseRow } from "#types/wbBoxTariffs.js";
import { getLatestBoxTariffs } from "./boxTariffsStore.js";
import { getSpreadsheetIds } from "./spreadsheetsStore.js";
import { buildSheetRows } from "./sheetRows.js";

const SHEET_NAME = "stocks_coefs";

let authClientPromise: Promise<GoogleAuth> | null = null;

async function getAuthClient(): Promise<GoogleAuth> {
    if (authClientPromise) return authClientPromise;
    let credentials: object;
    if (env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()) {
        credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON) as object;
    } else if (env.GOOGLE_CREDENTIALS_PATH?.trim()) {
        const raw = await readFile(env.GOOGLE_CREDENTIALS_PATH, "utf-8");
        credentials = JSON.parse(raw) as object;
    } else {
        throw new Error("Set GOOGLE_CREDENTIALS_PATH or GOOGLE_SERVICE_ACCOUNT_JSON");
    }
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    authClientPromise = Promise.resolve(auth);
    return auth;
}

export async function syncSpreadsheet(
    spreadsheetId: string,
    list: BoxTariffWarehouseRow[]
): Promise<{ ok: boolean; error?: string }> {
    try {
        const auth = await getAuthClient();
        const sheets = google.sheets({ version: "v4", auth });

        const { data: spreadsheet } = await sheets.spreadsheets.get({
            spreadsheetId,
        });
        const sheet = spreadsheet.sheets?.find(
            (s) => s.properties?.title === SHEET_NAME
        );
        if (!sheet) {
            return { ok: false, error: `Sheet "${SHEET_NAME}" not found` };
        }
        const rows = buildSheetRows(list);
        if (rows.length === 0) {
            return { ok: true };
        }
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `${SHEET_NAME}!A:ZZ`,
        });
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${SHEET_NAME}!A1`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: rows },
        });
        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: message };
    }
}

export async function syncAllSpreadsheets(): Promise<{
    synced: number;
    failed: number;
    errors: string[];
}> {
    const list = await getLatestBoxTariffs();
    if (!list || list.length === 0) {
        return { synced: 0, failed: 0, errors: ["No box tariffs data in DB"] };
    }
    const ids = await getSpreadsheetIds();
    const errors: string[] = [];
    let synced = 0;
    for (const id of ids) {
        const result = await syncSpreadsheet(id, list);
        if (result.ok) synced++;
        else errors.push(`${id}: ${result.error}`);
    }
    return { synced, failed: ids.length - synced, errors };
}
