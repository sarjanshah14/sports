import Link from "next/link"
import { Trophy, Calendar, Users, TrendingUp, CheckCircle, Edit, AlertTriangle, Plus, LogIn } from "lucide-react"

export default function DashboardPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
            {/* Welcome Header & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>System Online</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Good evening, Organizer
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg text-lg">
                        Here's what's happening. You have active tournaments running.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/join" className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium hover:border-primary/50 hover:text-primary dark:hover:text-primary hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                        <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Join Tournament
                    </Link>
                    <Link href="/tournaments/new" className="group flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 dark:bg-primary text-white rounded-xl font-medium shadow-xl shadow-slate-900/10 dark:shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300">
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Create Tournament
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Active Tournaments */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Trophy className="w-16 h-16 text-primary" />
                    </div>
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">Live Now</span>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">3</div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Tournaments</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-400">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <span>Regionals starting soon</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Matches Today */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar className="w-16 h-16 text-orange-500" />
                    </div>
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">Today</span>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">12</div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Matches Scheduled</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-4 h-4 text-orange-500" />
                            <span>Next match at 18:00</span>
                        </div>
                    </div>
                </div>

                {/* Card 3: Participants */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16 text-purple-500" />
                    </div>
                    <div className="flex flex-col justify-between h-full relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Users className="w-6 h-6" />
                            </div>
                            {/* Avatars omitted for simplicity */}
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1">1,240</div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Participants</div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-400">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 dark:text-green-400 font-medium">+45</span>
                            <span>new this week</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left Column: Recent Activity Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h2>
                        <Link href="#" className="text-sm text-primary hover:text-primary/80 font-medium">View all</Link>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-card border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                        {[
                            { icon: Users, color: "text-primary", bg: "bg-blue-50 dark:bg-blue-900/20", title: "New Team Registration", desc: '"The Thunderbolts" joined the Summer Cup 2024', time: "2m ago" },
                            { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", title: "Match Completed", desc: "Result confirmed: Red Hawks 2 - 1 Blue Whales", time: "15m ago" },
                            { icon: Edit, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", title: "Tournament Updated", desc: "Schedule changed for Pro League Qualifiers", time: "1h ago" },
                            { icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", title: "Payment Pending", desc: 'Team "Velocity" payment requires verification', time: "3h ago" },
                        ].map((item, i) => (
                            <div key={i} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                                <div className={`w-10 h-10 rounded-full ${item.bg} flex-shrink-0 flex items-center justify-center ${item.color}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{item.title}</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.desc}</p>
                                </div>
                                <span className="text-xs text-slate-400 whitespace-nowrap">{item.time}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Quick Calendar / Upcoming */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Calendar section simplified or omitted if not critical for setup */}
                    <div className="bg-gradient-to-br from-primary to-blue-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">Upgrade to Pro</h3>
                            <p className="text-blue-100 text-sm mb-4">Unlock advanced analytics and unlimited tournament brackets.</p>
                            <button className="bg-white text-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:bg-blue-50 transition-colors">View Plans</button>
                        </div>
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
