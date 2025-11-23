import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layouts/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b">
          <div className="flex h-16 items-center px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Usuario</span>
            </div>
          </div>
        </div>
        <div className="p-8">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
