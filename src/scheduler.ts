import env from "#config/env/env.js";
import { fetchBoxTariffs } from "#services/wbTariffs.js";
import { upsertBoxTariffsForDate } from "#services/boxTariffsStore.js";
import { syncAllSpreadsheets } from "#services/googleSheetsSync.js";

const log = (msg: string) => console.log(`[scheduler] ${msg}`);

async function runTariffsFetch(): Promise<void> {
    try {
        const result = await fetchBoxTariffs();
        if (!result.ok) {
            log(`Tariffs fetch failed: ${result.error}`);
            return;
        }
        if (result.data) {
            await upsertBoxTariffsForDate(result.data);
            log("Tariffs fetched and saved");
            runSheetsSync();
        }
    } catch (e) {
        log(`Tariffs fetch error: ${e instanceof Error ? e.message : String(e)}`);
    }
}

async function runSheetsSync(): Promise<void> {
    try {
        const { synced, failed, errors } = await syncAllSpreadsheets();
        if (errors.length) {
            log(`Sheets sync: ${synced} ok, ${failed} failed. ${errors.join("; ")}`);
        } else if (synced > 0) {
            log(`Sheets sync: ${synced} spreadsheet(s) updated`);
        }
    } catch (e) {
        log(`Sheets sync error: ${e instanceof Error ? e.message : String(e)}`);
    }
}

export function startScheduler(): void {
    runTariffsFetch();
    setInterval(runTariffsFetch, env.TARIFS_FETCH_INTERVAL_MS);
    log(`Tariffs fetch every ${env.TARIFS_FETCH_INTERVAL_MS}ms`);

    runSheetsSync();
    setInterval(runSheetsSync, env.SHEETS_SYNC_INTERVAL_MS);
    log(`Sheets sync every ${env.SHEETS_SYNC_INTERVAL_MS}ms`);
}
