export default function RootPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-6xl font-bold text-center mb-6">
          BLOX BUDDY
        </h1>
        <p className="text-xl text-center mb-12">
          Free learning and community platform for young Roblox developers
        </p>
        <div className="text-center">
          <a 
            href="/dashboard" 
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold mr-4"
          >
            Launch App
          </a>
          <a 
            href="/about" 
            className="inline-block px-8 py-4 border border-white text-white rounded-lg font-semibold"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  )
}