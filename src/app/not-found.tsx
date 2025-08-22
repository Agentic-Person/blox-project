import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-blox-black-blue flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blox-teal mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-blox-white mb-6">Page Not Found</h2>
        <p className="text-blox-off-white mb-8">
          The page you're looking for doesn't exist.
        </p>
        <Link 
          href="/"
          className="btn-primary inline-block"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  )
}