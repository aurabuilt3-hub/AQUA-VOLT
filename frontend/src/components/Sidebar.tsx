import React from 'react';

export type MainNavDestination = 'facility' | 'agents' | 'governance' | 'twin' | 'audit';

interface SidebarProps {
  activeView: MainNavDestination;
  onSwitchView: (view: MainNavDestination) => void;
  onOpenCopilot: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSwitchView,
  onOpenCopilot,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'facility' as MainNavDestination,
      label: 'Overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: 'agents' as MainNavDestination,
      label: 'Agent Operations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'governance' as MainNavDestination,
      label: 'Governance & Approvals',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      id: 'twin' as MainNavDestination,
      label: 'Digital Twin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'audit' as MainNavDestination,
      label: 'Audit Trail',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  const handleNavClick = (id: MainNavDestination) => {
    onSwitchView(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#064452]/70 z-40 md:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar: Deep ocean teal matching reference image (#064452 / #084B5B) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 md:static md:z-0
          w-[260px] bg-[#074755] text-slate-100 flex flex-col justify-between shrink-0
          p-4 lg:p-5 border-r border-[#0B5A6B]
          transition-transform duration-300 ease-in-out overflow-y-auto relative
          ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div>
          {/* Brand Header: Exactly as in Reference Image */}
          <div className="flex items-center justify-between pb-5 mb-5 border-b border-[#0C586B]/60">
            <div className="flex items-center gap-3">
              <img
                src="/shrimp_logo.png"
                alt="AquaVolt Shrimp"
                className="w-9 h-9 object-contain drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="min-w-0">
                <div className="text-[17px] font-extrabold tracking-tight text-white leading-tight">
                  AquaVolt
                </div>
                <div className="text-[11px] text-[#A2E6DE] font-medium tracking-tight">
                  Aquaculture Intelligence
                </div>
              </div>
            </div>

            {/* Mobile close */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden text-slate-300 hover:text-white p-1 rounded-lg text-lg"
            >
              ✕
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-[#12B5A4] text-white font-bold shadow-[0_0_16px_rgba(18,181,164,0.35)] ring-1 ring-[#5EEAD4]/40'
                      : 'text-[#D0F2ED] hover:text-white hover:bg-[#0C586B]/70'
                  }`}
                >
                  <span className={`${isActive ? 'text-white' : 'text-[#8FE0D5]'} shrink-0`}>
                    {item.icon}
                  </span>
                  <span className="truncate tracking-wide text-[13px]">{item.label}</span>
                </button>
              );
            })}

            {/* AquaVolt Copilot in Navigation List */}
            <div className="pt-4 mt-2">
              <button
                type="button"
                onClick={() => {
                  onOpenCopilot();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#D0F2ED] hover:text-white hover:bg-[#0C586B]/70 transition text-left"
              >
                <span className="text-[#8FE0D5] shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </span>
                <span className="truncate tracking-wide text-[13px]">AquaVolt Copilot</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Bottom Section: Decorative Shrimp Illustration behind Facility Area */}
        <div className="mt-8 space-y-3 relative">
          {/* Large, attractive decorative shrimp illustration - translucent (10-18% opacity) behind facility area */}
          <div className="absolute -inset-x-4 -top-24 -bottom-2 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.18]">
            <img
              src="/decorative_shrimp_bg.svg"
              alt="Decorative Shrimp Backdrop"
              className="w-60 h-60 object-contain filter drop-shadow-md select-none"
              onError={(e) => {
                // Graceful fallback to existing watermark if needed
                (e.target as HTMLImageElement).src = '/sidebar_watermark.png';
              }}
            />
          </div>

          {/* Facility Status Card - Matching Reference Image */}
          <div className="relative z-10 bg-[#053641]/90 rounded-xl p-3 border border-[#0A5364] text-xs shadow-inner">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[#12B5A4] text-xs">📍</span>
                <span className="text-[11px] font-bold text-white tracking-tight">
                  Visakhapatnam Hatchery Unit 1
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#12B5A4] animate-pulse shadow-[0_0_8px_#12B5A4]" />
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#A2E6DE] font-mono font-medium px-0.5 pt-1 border-t border-[#094754]">
              <span title="Nominal Solar Array Rating">Nominal PV: 18.4 kWp</span>
              <span className="text-slate-500">|</span>
              <span title="Nominal Battery Storage Capacity">BESS: 100 kWh</span>
            </div>
          </div>

          {/* Honest Digital Twin Disclosure - Matching Reference Image */}
          <div className="relative z-10 bg-[#053641]/50 rounded-lg p-2 border border-[#0A5364]/60 text-[9px] text-[#8FE0D5] flex items-center gap-2">
            <span className="text-xs">⚡</span>
            <div>
              <div className="font-semibold text-white">Digital Twin · Simulated</div>
              <div className="text-[8.5px] text-[#8FE0D5]/80">No physical hardware connected</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
