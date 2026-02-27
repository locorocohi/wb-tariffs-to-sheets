/**
 * Текущая дата по Москве в формате YYYY-MM-DD.
 */
export function todayDateStringMoscow(): string {
    const now = new Date();
    const moscow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
    const y = moscow.getFullYear();
    const m = String(moscow.getMonth() + 1).padStart(2, "0");
    const d = String(moscow.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}
