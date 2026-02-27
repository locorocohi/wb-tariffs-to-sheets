import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const optionalString = z.union([z.undefined(), z.literal(""), z.string()]);
const optionalPositiveInt = z.union([
    z.undefined(),
    z
        .string()
        .regex(/^[0-9]+$/)
        .transform((v) => parseInt(v, 10)),
]);

const envSchema = z.object({
    NODE_ENV: z.union([z.undefined(), z.enum(["development", "production"])]),
    POSTGRES_HOST: z.union([z.undefined(), z.string()]),
    POSTGRES_PORT: z
        .string()
        .regex(/^[0-9]+$/)
        .transform((value) => parseInt(value, 10)),
    POSTGRES_DB: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    APP_PORT: z.union([
        z.undefined(),
        z
            .string()
            .regex(/^[0-9]+$/)
            .transform((value) => parseInt(value, 10)),
    ]),
    WB_API_TOKEN: optionalString,
    WB_BOX_TARIFTS_URL: optionalString,
    GOOGLE_CREDENTIALS_PATH: optionalString,
    GOOGLE_SERVICE_ACCOUNT_JSON: optionalString,
    TARIFS_FETCH_INTERVAL_MS: optionalPositiveInt,
    SHEETS_SYNC_INTERVAL_MS: optionalPositiveInt,
    SPREADSHEET_IDS: optionalString,
});

const raw = {
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    NODE_ENV: process.env.NODE_ENV,
    APP_PORT: process.env.APP_PORT,
    WB_API_TOKEN: process.env.WB_API_TOKEN,
    WB_BOX_TARIFTS_URL: process.env.WB_BOX_TARIFTS_URL,
    GOOGLE_CREDENTIALS_PATH: process.env.GOOGLE_CREDENTIALS_PATH,
    GOOGLE_SERVICE_ACCOUNT_JSON: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    TARIFS_FETCH_INTERVAL_MS: process.env.TARIFS_FETCH_INTERVAL_MS,
    SHEETS_SYNC_INTERVAL_MS: process.env.SHEETS_SYNC_INTERVAL_MS,
    SPREADSHEET_IDS: process.env.SPREADSHEET_IDS,
};

const parsed = envSchema.parse(raw);

const env = {
    ...parsed,
    TARIFS_FETCH_INTERVAL_MS: parsed.TARIFS_FETCH_INTERVAL_MS ?? 3600000,
    SHEETS_SYNC_INTERVAL_MS: parsed.SHEETS_SYNC_INTERVAL_MS ?? 1800000,
    WB_BOX_TARIFTS_URL:
        (parsed.WB_BOX_TARIFTS_URL?.trim() || undefined) ??
        "https://common-api.wildberries.ru/api/v1/tariffs/box",
    SPREADSHEET_IDS: (parsed.SPREADSHEET_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
};

function warnIfMissing() {
    const prefix = "[env]";
    if (!env.WB_API_TOKEN?.trim()) {
        console.warn(`${prefix} WB_API_TOKEN не задан — запросы к API Wildberries не выполняются.`);
    }
    const hasGoogleCreds =
        (env.GOOGLE_CREDENTIALS_PATH?.trim()?.length ?? 0) > 0 ||
        (env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim()?.length ?? 0) > 0;
    if (!hasGoogleCreds) {
        console.warn(
            `${prefix} Не заданы GOOGLE_CREDENTIALS_PATH и GOOGLE_SERVICE_ACCOUNT_JSON — синхронизация с Google Sheets недоступна.`
        );
    }
    if (env.SPREADSHEET_IDS.length === 0) {
        console.warn(`${prefix} SPREADSHEET_IDS пуст — не заданы таблицы для экспорта тарифов.`);
    }
}
warnIfMissing();

export default env;
