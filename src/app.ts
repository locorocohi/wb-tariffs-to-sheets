import { migrate } from "#postgres/knex.js";
import { startScheduler } from "#scheduler.js";
import { ensureSpreadsheetsFromEnv } from "#services/spreadsheetsStore.js";

async function main(): Promise<void> {
    try {
        await migrate.latest();
        await ensureSpreadsheetsFromEnv();
        console.log("Migrations done. Starting scheduler.");
        startScheduler();
    } catch (e) {
        console.error("Startup failed:", e instanceof Error ? e.message : String(e));
        process.exit(1);
    }
}

main();