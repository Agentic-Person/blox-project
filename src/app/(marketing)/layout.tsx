export const dynamic = 'force-static'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blox-black-blue to-blox-very-dark-blue">
      {children}
    </div>
  )
}