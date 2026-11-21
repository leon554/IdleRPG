// Returns the first row of a query, or null when there are no rows.
// Use this instead of `const [row] = await …`: without noUncheckedIndexedAccess, TypeScript types
// `row` as always defined, so callers aren't forced to handle "not found".
export function firstOrNull<T>(rows: T[]): T | null {
    return rows.length > 0 ? rows[0] : null;
}
