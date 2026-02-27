/** Результат запроса с данными или ошибкой. Переиспользуемый тип для API-вызовов. */
export interface ApiResult<T> {
    ok: boolean;
    data?: T;
    error?: string;
}
