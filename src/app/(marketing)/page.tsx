export const dynamic = 'force-static'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blox-black-blue to-blox-very-dark-blue">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-6xl font-bold text-blox-white text-center mb-6">
          BLOX BUDDY
        </h1>
        <p className="text-xl text-blox-off-white text-center mb-12">
          Placeholder - Your landing page will go here
        </p>
        <div className="text-center">
          <a href="/dashboard" className="inline-block px-8 py-4 bg-gradient-to-r from-blox-teal to-blox-teal-dark text-white rounded-lg font-semibold">
            Launch App →
          </a>
        </div>
      </div>
    </div>
  )
}