import './globals.css';

export const metadata = {
  title: 'Voxel Vault — Turn Any Photo Into a 3D Voxel',
  description: 'Upload one photo and generate a downloadable custom voxel model.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
