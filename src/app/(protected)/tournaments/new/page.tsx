'use client'

import Link from "next/link"
import { createTournament } from "@/app/tournaments/actions"
import { ArrowLeft, Edit, Calendar, MapPin, Trophy } from "lucide-react"

export default function CreateTournamentPage() {
    return (
        <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-2">
                    {/* Progress Bar omitted for simplicity */}
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white pt-4">General Information</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Let's start with the basics of your tournament.</p>
                </div>

                <div className="bg-surface-light dark:bg-surface-dark p-8 md:p-10 rounded-3xl shadow-card border border-slate-100 dark:border-slate-700/50">
                    <form action={createTournament} className="space-y-8">
                        <div className="space-y-2">
                            <label htmlFor="tournament-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Tournament Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="tournament-name"
                                    id="tournament-name"
                                    required
                                    placeholder="e.g. Summer Regional Championship 2024"
                                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 py-3.5 pl-4 pr-10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm sm:leading-6 shadow-sm bg-transparent"
                                />
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                    <Edit className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="sport" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Sport
                            </label>
                            <div className="relative">
                                <select
                                    id="sport"
                                    name="sport"
                                    required
                                    className="block w-full appearance-none rounded-xl border-slate-200 dark:border-slate-700 py-3.5 pl-11 pr-10 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm sm:leading-6 shadow-sm bg-transparent"
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select a sport</option>
                                    <option value="soccer">Soccer</option>
                                    <option value="basketball">Basketball</option>
                                    <option value="tennis">Tennis</option>
                                    <option value="volleyball">Volleyball</option>
                                    <option value="esports">Esports</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Trophy className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="start-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Start Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="start-date"
                                        id="start-date"
                                        className="block w-full rounded-xl border-slate-200 dark:border-slate-700 py-3.5 pl-4 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm sm:leading-6 shadow-sm bg-transparent"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="end-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    End Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        name="end-date"
                                        id="end-date"
                                        className="block w-full rounded-xl border-slate-200 dark:border-slate-700 py-3.5 pl-4 pr-3 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm sm:leading-6 shadow-sm bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="location" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Main Location / Venue
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="location"
                                    id="location"
                                    placeholder="Search for a venue or enter address"
                                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 py-3.5 pl-11 pr-10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm sm:leading-6 shadow-sm bg-transparent"
                                />
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">You can add multiple venues in later steps.</p>
                        </div>

                        <div className="pt-6 flex items-center justify-between gap-4">
                            <Link href="/dashboard" className="px-6 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="flex-1 sm:flex-none px-10 py-3.5 text-sm font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                Create Tournament
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
