import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import root from './root.ts';

const mappings = new Map([
  ['custom-game:audio', join(root, 'ui/Audio')],
  ['custom-game:asset-variants', join(root, 'art/Variants')],
  ['custom-game:images', join(root, 'hera/render/Images')],
] as const);

export default function createResolver({ forceRemoteAudio } = { forceRemoteAudio: false }): Plugin {
  return {
    enforce: 'pre',
    name: 'athena-crisis-resolver',
    resolveId: {
      filter: {
        id: /^custom-game:(audio|asset-variants|images)$/,
      },
      handler(id: string) {
        if (
          id === 'custom-game:audio' ||
          id === 'custom-game:asset-variants' ||
          id === 'custom-game:images'
        ) {
          const path = mappings.get(id);
          if (!path) {
            return null;
          }

          if (forceRemoteAudio && id === 'custom-game:audio') {
            return `${path}.tsx`;
          }

          const resolvedPath = `${path}.nkzw.tsx`;
          return existsSync(resolvedPath) ? resolvedPath : `${path}.tsx`;
        }
        return null;
      },
    },
  };
}
