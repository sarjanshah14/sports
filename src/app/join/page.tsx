export default function JoinPage() {
    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Join Tournament</h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Enter the unique code provided by your organizer.</p>
                </div>

                <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-card border border-slate-100 dark:border-slate-700">
                    <form className="space-y-6">
                        <div>
                            <label htmlFor="code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Tournament Code
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    id="code"
                                    name="code"
                                    placeholder="e.g. SUMMER-2024"
                                    className="block w-full rounded-xl border-slate-200 dark:border-slate-700 py-3.5 px-4 text-center text-2xl font-mono tracking-wider uppercase text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:scale-[0.99]"
                        >
                            Join Now
                        </button>
                    </form>
                </div>

                <div className="text-center">
                    <a href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                        Back to Home
                    </a>
                </div>
            </div>
        </div>
    )
}
