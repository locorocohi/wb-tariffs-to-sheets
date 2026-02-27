import env from "#config/env/env.js";
import type { ApiResult } from "#types/api.js";
import type { BoxTariffsApiData, BoxTariffsApiResponse } from "#types/wbBoxTariffs.js";
import { todayDateStringMoscow } from "#utils/dateUtils.js";

/**
 * Запрос тарифов коробов WB. Требует WB_API_TOKEN в env.
 */
export async function fetchBoxTariffs(): Promise<ApiResult<BoxTariffsApiData>> {
    const token = env.WB_API_TOKEN?.trim();
    if (!token) {
        return { ok: false, error: "WB_API_TOKEN is not set" };
    }

    const dateStr = todayDateStringMoscow();
    const baseUrl = env.WB_BOX_TARIFTS_URL.replace(/\/?$/, "");
    const url = `${baseUrl}?date=${dateStr}`;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const text = await res.text();

        if (!res.ok) {
            return {
                ok: false,
                error: `WB API ${res.status}: ${text.slice(0, 200)}`,
            };
        }

        const json = JSON.parse(text) as BoxTariffsApiResponse;
        const data = json.response?.data;
        if (!data || !Array.isArray(data.warehouseList)) {
            return { ok: false, error: "Invalid API response: missing response.data.warehouseList" };
        }

        return { ok: true, data };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, error: `fetchBoxTariffs: ${message}` };
    }
}
