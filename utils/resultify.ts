export async function resultify<T, E=Error>(promise: Promise<T>) {
    try {
        const value = await promise;
        return {value, ok: true } as {value: T, ok: true};
    } catch (e) {
        return {e, ok: false } as {e: E, ok: false};
    }
}
