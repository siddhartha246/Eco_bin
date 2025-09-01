'use client'
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Menu, Coins, Leaf, Search, Bell, User, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { createUser, getUnreadNotifications, markNotificationAsRead, getUserByEmail, getUserBalance } from "@/utils/db/actions"
import { useUser, UserButton, SignOutButton, SignInButton, SignUpButton } from '@clerk/nextjs'

interface HeaderProps {
  onMenuClick: () => void;
  totalEarnings: number;
}

interface Notification {
  id: number;
  userId: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export default function Header({ onMenuClick, totalEarnings }: HeaderProps) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isMobile = useMediaQuery("(max-width: 768px)")
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    const createUserIfNeeded = async () => {
      if (user && user.primaryEmailAddress?.emailAddress) {
        try {
          // First check if user exists
          const existingUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
          if (!existingUser) {
            await createUser(user.primaryEmailAddress.emailAddress, user.fullName || 'Anonymous User');
          }
        } catch (error) {
          console.error("Error creating user:", error);
          // If it's a duplicate key error, the user already exists, which is fine
          if (error.message && error.message.includes('duplicate key value')) {
            console.log("User already exists, skipping creation");
          }
        }
      }
    };

    createUserIfNeeded();
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user && user.primaryEmailAddress?.emailAddress) {
        const dbUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
        if (dbUser) {
          const unreadNotifications = await getUnreadNotifications(dbUser.id);
          setNotifications(unreadNotifications);
        }
      }
    };

    fetchNotifications();

    // Set up periodic checking for new notifications
    const notificationInterval = setInterval(fetchNotifications, 30000); // Check every 30 seconds

    return () => clearInterval(notificationInterval);
  }, [user]);

  useEffect(() => {
    const fetchUserBalance = async () => {
      if (user && user.primaryEmailAddress?.emailAddress) {
        const dbUser = await getUserByEmail(user.primaryEmailAddress.emailAddress);
        if (dbUser) {
          const userBalance = await getUserBalance(dbUser.id);
          setBalance(userBalance);
        }
      }
    };

    fetchUserBalance();

    // Add an event listener for balance updates
    const handleBalanceUpdate = (event: CustomEvent) => {
      setBalance(event.detail);
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate as EventListener);

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdate as EventListener);
    };
  }, [user]);

  const handleNotificationClick = async (notificationId: number) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== notificationId)
    );
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
            <Menu className="h-6 w-6" />
          </Button>
          <Link href="/" className="flex items-center">
            <Leaf className="h-6 w-6 md:h-8 md:w-8 text-green-500 mr-1 md:mr-2" />
            <div className="flex flex-col">
              <span className="font-bold text-base md:text-lg text-gray-800">Ecobin</span>
              <span className="text-[8px] md:text-[10px] text-gray-500 -mt-1">EcoFriendly</span>
            </div>
          </Link>
        </div>
        {!isMobile && (
          <div className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        )}
        <div className="flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2">
              <Search className="h-5 w-5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 relative">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{notification.type}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
            <Coins className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
            <span className="font-semibold text-sm md:text-base text-gray-800">
              {balance.toFixed(2)}
            </span>
          </div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center">
                  <User className="h-5 w-5 mr-1" />
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  {user.fullName || user.primaryEmailAddress?.emailAddress}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>
                  <SignOutButton>
                    <button className="w-full text-left">Sign Out</button>
                  </SignOutButton>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}