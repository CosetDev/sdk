import stringify from "json-stable-stringify";

export function stableStringify(payload: any): string {
    return stringify(payload)!;
}
