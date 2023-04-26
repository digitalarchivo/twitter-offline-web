// Split array into chunks
export function chunkArray(arr: Array<any>, len: number): Array<Array<any>> {
    let chunks = [], i = 0, n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}