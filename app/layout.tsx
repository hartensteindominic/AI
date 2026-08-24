import './globals.css';

export const metadata = {
  title: 'Voxel Vault - Custom 3D Voxel Asset Packs',
  description: 'Generate a coordinated pack of downloadable 3D voxel assets from one theme or reference image.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
