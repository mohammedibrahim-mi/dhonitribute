/**
 * Save a Blob as a file. Inside a Claude artifact viewer this goes through its `downloads`
 * capability; elsewhere it falls back to a normal <a download>.
 * Resolves to "saved" | "cancelled"; throws on failure.
 */
export async function saveBlob(filename: string, blob: Blob): Promise<"saved" | "cancelled"> {
  const host = (window as unknown as { claude?: { use: (n: string) => Promise<unknown> } }).claude;
  if (host?.use) {
    const dl = (await host.use("downloads").catch(() => null)) as
      | { save: (r: { filename: string; data: Blob }) => Promise<unknown> }
      | null;
    if (dl) {
      try {
        await dl.save({ filename, data: blob });
        return "saved";
      } catch (err) {
        if ((err as { code?: string })?.code === "declined") return "cancelled";
        throw err;
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "saved";
}
