import React from 'react'
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar'
import AppSidebar from '../components/AppSidebar'
import DesktopTopBar from '../components/DesktopTopBar'

export default function DesktopSidebarLayout({ children }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <DesktopTopBar />
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 32px',
          background: 'hsl(var(--background))'
        }}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
