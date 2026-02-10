import Link from "next/link"
import { Trophy, ArrowRight, CheckCircle } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-primary/30">
      {/* Navbar */}
      <nav className="border-b border-white/10 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">TourneyOS</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth" className="text-sm font-medium hover:text-white/80 transition-colors">Sign In</Link>
            <Link href="/auth" className="px-5 py-2.5 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-400 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
              v2.0 is now live
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
              The modern way to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">manage tournaments.</span>
            </h1>
            <p className="text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
              Effortlessly organize leagues, generate brackets, and track stats.
              Used by over 10,000 organizers worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth" className="px-8 py-4 bg-primary hover:bg-primary/90 rounded-xl text-lg font-bold transition-all hover:transform hover:-translate-y-1 shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                Start for free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/join" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-lg font-bold transition-all flex items-center justify-center">
                Join a Tournament
              </Link>
            </div>
          </div>
        </div>

        {/* Background Elements */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-primary/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* Features */}
      <div className="py-24 bg-slate-800/50 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Automated Brackets", desc: "Support for single elim, double elim, and round robin styles." },
              { title: "Real-time Updates", desc: "Participants get instant notifications when matches update." },
              { title: "Team Management", desc: "Handle registrations, rosters, and payments in one place." },
            ].map((f, i) => (
              <div key={i} className="space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <CheckCircle className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
