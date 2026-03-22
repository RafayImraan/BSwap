import "./globals.css";

export const metadata = {
  title: "BSwap",
  description: "Trustless atomic swaps between Bitcoin and Hedera"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
