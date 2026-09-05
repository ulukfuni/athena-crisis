import type React from 'react';
import { Layout } from 'vocs';

export default function MdxWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
      <Layout>{children}</Layout>
    </>
  );
}
