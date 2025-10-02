import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'MyBazaar',
  description: 'Student Marketplace for Northern Cyprus',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-800">{children}</body>
    </html>
  )
}
