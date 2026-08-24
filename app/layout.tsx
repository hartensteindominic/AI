import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://voxelme-15.voxel-vault-5748.chatgpt.site"),
  title: "VoxelMe — Custom Voxel Portraits for $15",
  description: "Turn a favorite photo of you, your pet, or your favorite duo into a one-of-one custom voxel portrait for just $15.",
  openGraph: {
    title: "VoxelMe — Custom Voxel Portraits for $15",
    description: "Your favorite photo, reimagined in voxels. Custom-made for just $15.",
    type: "website",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "VoxelMe — Custom voxel portraits. Just $15." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "VoxelMe — Custom Voxel Portraits for $15",
    description: "Your favorite photo, reimagined in voxels. Custom-made for just $15.",
    images: ["/og.png"],
  },
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
