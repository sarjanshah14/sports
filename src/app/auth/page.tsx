'use client'

import { useState } from 'react'
import { login, signup } from './actions'

export default function AuthPage() {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    // const [message, setMessage] = useState<string | null>(null) // TODO: Handle errors

    return (
        <main className="flex-1 flex flex-col lg:flex-row h-screen max-h-screen overflow-hidden">
            {/* Left Panel: Visual/Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5 p-6 xl:p-8 flex-col justify-between overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Abstract blue tennis court overhead view"
                        className="w-full h-full object-cover opacity-90 mix-blend-overlay filter saturate-50 contrast-125"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuB77VjE6h8ys5rCtAzG8qMj9PfkyAvBwjAeNbdVOfk2X7cVS6Qec20q-s7HysS-mD2l8fHq-hCdjb5VnuCwXm8PLfqX9xrwPo1F-hYq1AZceFSTtBr7TIop47gpPi_tilokvs0hBDykp0MBQ6mnH9BvwCZAM4ZPlgeaIP4x72q-HDyDkDwsCi-oiBHOavWce3DL7D1g1tPBAQrw_briFdKDCGRSgsvCK1caN5PKNTDTxpohk7q5loRQBaW7DtCa1K6NC69dEpR4wwU"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/40 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                </div>

                {/* Logo Area */}
                <div className="relative z-10 flex items-center space-x-3 text-white">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30 shadow-lg">
                        <span className="material-icons text-white">emoji_events</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">TournamentMgr</span>
                </div>

                {/* Testimonial/Marketing Content */}
                <div className="relative z-10 max-w-lg mb-12">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl">
                        <div className="flex items-center space-x-1 mb-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <span key={i} className="material-icons text-yellow-400 text-sm">star</span>
                            ))}
                        </div>
                        <blockquote className="text-xl md:text-2xl font-medium text-white leading-relaxed mb-6">
                            "The most intuitive platform for managing leagues. It transformed how we organize our seasonal cups."
                        </blockquote>
                        <div className="flex items-center space-x-4">
                            <img
                                alt="Portrait of a smiling man"
                                className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtAhiwnofhV2eyGVoiZX9HFvV6DTKgCL08fWZpcGJL3NHV8ydnkNke45F36uy0lkZJuPpv_uOrtjWQlaxMsaxI_VBmZfRpfyJKZYhjQMndOqWyv1FLhsqd5vWlyyZM_4Wk06nGIh3tzl_lYAB5YV9ywy-JD71phP33cnfD41CrSY2xSLiqT_fDPop4YNIJW_XlFydPJYJwZerfzEDTEJuyS8aRv68eJwYPcoWX6zcRQrPImW8Fzj-nD2iVszAZdiJCF-5ObAgrSTY"
                            />
                            <div>
                                <div className="text-white font-semibold">David Chen</div>
                                <div className="text-white/70 text-sm">Director, Westside Leagues</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer links for left side */}
                <div className="relative z-10 flex space-x-6 text-sm text-white/60">
                    <a href="#" className="hover:text-white transition-colors">About Us</a>
                    <a href="#" className="hover:text-white transition-colors">Contact Support</a>
                </div>
            </div>

            {/* Right Panel: Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-background-light dark:bg-background-dark overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile Logo (Visible only on small screens) */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-12 h-12 bg-primary text-white rounded-lg flex items-center justify-center shadow-lg">
                            <span className="material-icons">emoji_events</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
                            {mode === 'signin' ? 'Welcome back' : 'Create an account'}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">
                            {mode === 'signin' ? 'Enter your details to access your dashboard.' : 'Start managing your tournaments today.'}
                        </p>
                    </div>

                    {/* Toggle */}
                    <div className="bg-slate-200/50 dark:bg-slate-800 p-1 rounded-xl flex mb-8 relative">
                        <button
                            onClick={() => setMode('signin')}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === 'signin'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode('signup')}
                            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === 'signup'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Form */}
                    <form action={mode === 'signin' ? login : signup} className="space-y-5">
                        {/* Email Input */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                            <div className="relative">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="name@company.com"
                                    className="block w-full px-4 py-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-primary/20 transition-shadow duration-200 form-input"
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                                    <span className="material-icons text-[20px]">mail_outline</span>
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                                {mode === 'signin' && (
                                    <a href="#" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">Forgot password?</a>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="block w-full px-4 py-3 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-primary/20 transition-shadow duration-200 form-input"
                                />
                                <button type="button" className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                                    <span className="material-icons text-[20px]">visibility_off</span>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md shadow-primary/20 text-sm font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform active:scale-[0.99]"
                        >
                            {mode === 'signin' ? 'Sign in to Dashboard' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider and Social Auth (Omitted for brevity as not strictly required by plan but nice to have) */}

                    {/* Bottom Help */}
                    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                            className="font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {mode === 'signin' ? 'Start your 14-day free trial' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </main>
    )
}
