import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voxel Vault - Voxel Max-Ready 3D Asset Pack Generator',
  description: 'Turn one theme or reference image into 13 matching downloadable voxel assets in VOX and GLTF formats for $9.99.',
  openGraph: {
    title: 'One Idea. 13 Voxel Max-Ready 3D Assets. $9.99.',
    description: 'Generate a matching voxel character, props, loot, environment pieces, and landmarks with VOX and GLTF downloads.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Voxel Max-Ready 3D Voxel Asset Pack - $9.99',
    description: 'One theme in. Thirteen matching VOX + GLTF assets out.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
