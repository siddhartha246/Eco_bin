"use client"

import { useState, useEffect } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import 'leaflet/dist/leaflet.css'
import { Toaster } from 'react-hot-toast'
import { getAvailableRewards, getUserByEmail } from '@/utils/db/actions'
import { ClerkProvider, useUser } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

function AppContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(0)

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        if (user && user.primaryEmailAddress?.emailAddress) {
          const dbUser = await getUserByEmail(user.primaryEmailAddress.emailAddress)
          console.log('user from layout', dbUser);

          if (dbUser) {
            const availableRewards = await getAvailableRewards(dbUser.id) as any
            console.log('availableRewards from layout', availableRewards);
                        setTotalEarnings(availableRewards)
          }
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    fetchTotalEarnings()
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} totalEarnings={totalEarnings} />
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} />
        <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <AppContent>{children}</AppContent>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
