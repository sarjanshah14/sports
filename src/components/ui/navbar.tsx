import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { Trophy, Bell, User } from "lucide-react"
// Using lucide-react as strictly typed replacement for material icons to allow easy React usage.
// Design used 'emoji_events', 'notifications'. 'person'.
// Trophy ~ emoji_events, Bell ~ notifications, User ~ person.

export function Navbar() {
    return (
        <nav className="w-full h-16 border-b border-slate-200/60 dark:border-slate-800 bg-surface-light/80 dark:bg-background-dark/80 sticky top-0 z-50 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
                            <Trophy className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">TourneyOS</span>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        <Link href="/dashboard" className="px-3 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
                            Dashboard
                        </Link>
                        <Link href="/tournaments" className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
                            Tournaments
                        </Link>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <ThemeToggle />

                    <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1"></div>

                    <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <span className="text-sm font-medium hidden sm:block">User</span>
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600 shadow-sm">
                            <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    )
}
