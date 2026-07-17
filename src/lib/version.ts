export type RemoteVersion = { build?: string; version: string };
export async function checkForUpdate(): Promise<RemoteVersion | null> {
  const response = await fetch(`${import.meta.env.BASE_URL}version.json`, { cache: "no-store" });
  if (!response.ok) throw new Error("No se pudo consultar la versión publicada.");
  const remote = await response.json() as RemoteVersion;
  return remote.version !== __APP_VERSION__ ? remote : null;
}
