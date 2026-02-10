import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"

export default async function TournamentLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: { id: string }
}) {
    const supabase = createClient()
    const { data: tournament } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', params.id)
        .single()

    if (!tournament) {
        // notFound() 
        // Commented out notFound to allow development without DB data. 
        // In real app, this should be enabled.
        // For now, continue to render layout to show UI structure.
    }

    const tabs = [
        { name: 'Overview', href: `/tournaments/${params.id}` },
        { name: 'Fixtures', href: `/tournaments/${params.id}/fixtures` },
        { name: 'Standings', href: `/tournaments/${params.id}/standings` },
        { name: 'Participants', href: `/tournaments/${params.id}/participants` },
        { name: 'Bracket', href: `/tournaments/${params.id}/bracket` },
        { name: 'Settings', href: `/tournaments/${params.id}/settings` },
    ]

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header & Filters (Common for now, can be overridden by pages) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                        {tournament?.name || 'Tournament Name'}
                    </h1>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        <span>Status: {tournament?.status || 'Draft'}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Actions like Edit, etc. */}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                        >
                            {tab.name}
                        </Link>
                    ))}
                </nav>
            </div>

            {children}
        </div>
    )
}
