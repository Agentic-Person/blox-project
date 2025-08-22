import { Sidebar } from '@/components/layout/Sidebar/Sidebar'
import { Header } from '@/components/layout/Header/Header'
import { ResizableSidebar } from '@/components/layout/ResizableSidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-blox-black-blue">
      <ResizableSidebar
        children={<Sidebar />}
        mainContent={
          <div className="flex flex-col h-full">
            <Header />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        }
      />
    </div>
  )
}