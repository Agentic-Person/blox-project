import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { Header } from '@/components/layout/Header/Header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-blox-black-blue">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}