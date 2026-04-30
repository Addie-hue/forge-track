import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { CosmicGlow } from './CosmicGlow';

export function AppShell() {
  return (
    <div className="flex h-screen bg-void overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative z-10 w-full md:w-[calc(100%-260px)]">
        <TopBar />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 relative hide-scrollbar">
          <CosmicGlow>
            <div className="w-full max-w-[1440px] mx-auto px-6 md:px-8 lg:px-12 py-8 min-h-full">
              <Outlet />
            </div>
          </CosmicGlow>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
