'use client'
import { useState, useEffect } from 'react'
import { User, Mail, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import { getUserByEmail, createUser } from '@/utils/db/actions'

type UserSettings = {
  name: string
  email: string
  createdAt: string
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<{ id: number; email: string; name: string; createdAt: Date | string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded && user) {
      const fetchUserData = async () => {
        try {
          const dbUser = await getUserByEmail(user.primaryEmailAddress?.emailAddress || '')
          if (dbUser) {
            setUserData(dbUser)
            console.log('User data loaded from database:', dbUser)
          } else {
            // If user doesn't exist in DB, create them
            console.log('User not found in database, creating new user...')
            const displayName = user.fullName || user.firstName || user.username || 'Anonymous User'
            const newUser = await createUser(user.primaryEmailAddress?.emailAddress || '', displayName)
            if (newUser) {
              setUserData(newUser)
              console.log('New user created:', newUser)
            } else {
              console.error('Failed to create user in database')
              // Still show Clerk data as fallback
              setUserData({
                id: 0, // Placeholder ID for fallback
                name: displayName,
                email: user.primaryEmailAddress?.emailAddress || '',
                createdAt: new Date()
              })
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          console.error('This might be due to missing database columns. Using Clerk data as fallback.')

          // Fallback to Clerk data if database query fails
          const displayName = user.fullName || user.firstName || user.username || 'Anonymous User'
          setUserData({
            id: 0, // Placeholder ID for fallback
            name: displayName,
            email: user.primaryEmailAddress?.emailAddress || '',
            createdAt: new Date()
          })
        } finally {
          setLoading(false)
        }
      }
      fetchUserData()
    } else if (isLoaded && !user) {
      setLoading(false)
    }
  }, [isLoaded, user])

  if (loading) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center">Loading user data...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center">Please log in to view your settings.</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Account Settings</h1>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <div className="relative">
            <div className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
              {userData?.name || user?.fullName || 'Not available'}
            </div>
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
          <div className="relative">
            <div className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
              {userData?.email || user?.primaryEmailAddress?.emailAddress || 'Not available'}
            </div>
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>


        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
          <div className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900">
            {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Not available'}
          </div>
        </div>
      </div>
    </div>
  )
}