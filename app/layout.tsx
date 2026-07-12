import React from "react";

export const metadata = {
  title: "HealNex Medi Bazar",
  description: "India's Trusted Medical Equipment Marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
