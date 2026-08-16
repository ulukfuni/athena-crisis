const getEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  if (
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env?.[key]
  ) {
    return (import.meta as unknown as { env?: Record<string, string> }).env?.[key];
  }
  return undefined;
};

export const AssetDomain =
  getEnv('ASSET_DOMAIN') ?? getEnv('VITE_ASSET_DOMAIN') ?? '';
export const AssetVersion =
  getEnv('ASSET_VERSION') ?? getEnv('VITE_ASSET_VERSION') ?? 'v20';

export const getAssetUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  if (!AssetDomain) {
    return `/${AssetVersion}/${cleanPath}`;
  }
  return `${AssetDomain}/${AssetVersion}/${cleanPath}`;
};

