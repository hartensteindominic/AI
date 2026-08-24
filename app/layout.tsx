import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voxel Vault - Custom 3D Voxel Asset Pack Generator',
  description: 'Turn one theme or reference image into a coordinated pack of 13 downloadable 3D voxel assets for $9.99.',
  openGraph: {
    title: 'One Idea. 13 Matching 3D Voxel Assets. $9.99.',
    description: 'Generate a custom voxel character, props, loot, environment pieces, and landmarks, then download the full 3D pack.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Custom 3D Voxel Asset Pack - $9.99',
    description: 'One theme in. Thirteen matching downloadable 3D voxel assets out.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
