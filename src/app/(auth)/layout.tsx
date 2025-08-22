export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blox-black-blue to-blox-very-dark-blue flex items-center justify-center">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}