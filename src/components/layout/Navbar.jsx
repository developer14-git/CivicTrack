import { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  MapPin,
  Bell,
  Plus,
  Menu,
  X,
  ChevronDown,
  Wrench,
  HardDrive,
  Sparkles,
  HelpCircle,
  User,
} from 'lucide-react';
import { MOCK_CAMPUSES, CURRENT_SIMULATED_USER } from '../../data/mockIssues';
import HelpModal from '../common/HelpModal';

export default function Navbar({
  currentTab,
  onSelectTab,
  selectedCampus,
  onSelectCampus,
  onOpenReportModal,
  notifications = [],
  onOpenIssueDetail,
  myReportsCount = 0,
  isStaffMode = false,
  onToggleStaffMode,
  onOpenDataModal,
  onStartTour,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const notifRef = useRef(null);
  const moreToolsRef = useRef(null);

  // Close dropdowns on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
      if (moreToolsRef.current && !moreToolsRef.current.contains(event.target)) {
        setMoreToolsOpen(false);
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setMoreToolsOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const navLinks = [
    { id: 'overview', label: 'Home' },
    { id: 'map', label: 'Explore Map' },
    { id: 'issues', label: 'Browse Issues' },
    { id: 'my-reports', label: 'My Reports', badge: myReportsCount },
    { id: 'analytics', label: 'Accountability' },
  ];

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
    setMoreToolsOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#07251f] border-b border-[#0f3d33] shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Brand, Location Selector & Primary Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 min-w-0">
            {/* CivicTrack Logo */}
            <button
              type="button"
              onClick={() => handleNavClick('overview')}
              className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-1 text-left shrink-0 transition-opacity hover:opacity-95"
              aria-label="CivicTrack Home"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-5 h-5 text-emerald-300" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white shrink-0">
                Civic<span className="text-emerald-400">Track</span>
              </span>
            </button>

            {/* Action Area Selector (near the logo, compact, blends with dark teal nav) */}
            <div className="hidden xl:flex items-center gap-1.5 pl-3 border-l border-[#134237] text-xs text-slate-300 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <label htmlFor="area-select" className="sr-only">New Town Action Area</label>
              <select
                id="area-select"
                value={selectedCampus}
                onChange={(e) => onSelectCampus(e.target.value)}
                className="bg-[#0b2f27] hover:bg-[#0e382f] text-slate-200 hover:text-white border border-[#164b3f] hover:border-emerald-500/50 py-1 px-2.5 pr-7 font-medium rounded-lg cursor-pointer max-w-[150px] truncate focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 transition-colors"
              >
                {MOCK_CAMPUSES.map((area) => (
                  <option key={area} value={area} className="bg-slate-900 text-white">
                    {area === 'All Action Areas' ? 'New Town (All)' : area}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = currentTab === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                      isActive
                        ? 'bg-[#103e34] text-white font-semibold border border-emerald-500/40 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-[#0e372f] border border-transparent'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="whitespace-nowrap">{link.label}</span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-emerald-400 text-teal-950'
                            : 'bg-[#0d342c] text-emerald-300 border border-emerald-700/60'
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* More / Secondary Menu Dropdown */}
              <div className="relative ml-0.5" ref={moreToolsRef}>
                <button
                  type="button"
                  onClick={() => setMoreToolsOpen(!moreToolsOpen)}
                  className={`px-3 py-1.5 text-xs xl:text-sm font-medium rounded-lg transition-all flex items-center gap-1 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    moreToolsOpen
                      ? 'bg-[#103e34] text-white font-semibold border border-emerald-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-[#0e372f] border border-transparent'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={moreToolsOpen}
                >
                  <span className="whitespace-nowrap">More</span>
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-400/80" aria-hidden="true" />
                </button>

                {moreToolsOpen && (
                  <div
                    className="absolute left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                    role="menu"
                  >
                    {/* Persona Overview Header */}
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 rounded-t-lg mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                          <User className="w-4 h-4 text-emerald-800" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 truncate">
                            {CURRENT_SIMULATED_USER.name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            Resident &bull; Action Area II, New Town
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Community & Help
                    </div>

                    {/* Help & About */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsHelpOpen(true);
                        setMoreToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                      <span>Help & About CivicTrack</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Demo Controls
                    </div>

                    {/* Demo Staff Mode Toggle */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onToggleStaffMode?.();
                        setMoreToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-slate-500" />
                        <span>Demo Staff Mode</span>
                      </div>
                      {isStaffMode && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </button>

                    {/* Browser Storage & Backups */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onOpenDataModal?.();
                        setMoreToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                      <span>Browser Storage & Backups</span>
                    </button>

                    {/* Guided Tour */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onStartTour?.();
                        setMoreToolsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Start Guided Demo Tour</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Secondary Controls & Primary Action CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Staff Mode Active Pill */}
            {isStaffMode && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-600/50 rounded-lg whitespace-nowrap">
                <Wrench className="w-3 h-3 text-amber-400" aria-hidden="true" />
                <span>Staff Mode Active</span>
              </span>
            )}

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-lg transition-colors text-slate-300 hover:text-white hover:bg-[#0e372f] border border-transparent hover:border-[#184e43] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  notificationsOpen ? 'bg-[#103e34] text-white border-emerald-500/30' : ''
                }`}
                aria-label="Notifications"
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Recent Activity</span>
                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{notifications.length} items</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (n.issueId) {
                              onOpenIssueDetail(n.issueId);
                              setNotificationsOpen(false);
                            }
                          }}
                          className="py-2 px-1 text-xs cursor-pointer hover:bg-slate-50 rounded-lg transition-colors text-slate-700"
                        >
                          <p className="leading-snug font-medium text-slate-800">{n.text}</p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">{n.time}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 py-4 text-center">No recent activity.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Report CTA: Report a Problem on far right */}
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07251f] whitespace-nowrap shrink-0 cursor-pointer shadow-xs hover:shadow-sm"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="whitespace-nowrap">Report a Problem</span>
            </button>

            {/* Mobile Menu Button on narrow screens */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-[#0e372f] rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer on narrow screens */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#0f3d33] bg-[#07251f] px-4 pt-3 pb-5 space-y-3 text-left">
          {/* Action Area Selector for Mobile */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0b2f27] border border-[#164b3f] rounded-lg text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium text-slate-300">Action Area:</span>
            </div>
            <select
              value={selectedCampus}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="bg-[#0e382f] border border-[#1a5548] rounded-md px-2 py-1 text-xs font-medium text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {MOCK_CAMPUSES.map((area) => (
                <option key={area} value={area} className="bg-slate-900 text-white">
                  {area === 'All Action Areas' ? 'New Town (All Areas)' : area}
                </option>
              ))}
            </select>
          </div>
          {/* Persona Card */}
          <div className="px-3 py-2 bg-[#0b2f27] border border-[#164b3f] rounded-lg flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-900/60 border border-emerald-600/50 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {CURRENT_SIMULATED_USER.name}
              </div>
              <div className="text-[10px] text-slate-300 truncate">
                Resident &bull; Action Area II, New Town
              </div>
            </div>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#103e34] text-white font-semibold border border-emerald-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-[#0e372f]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-teal-950">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#0f3d33] space-y-1">
            <span className="px-3 text-[11px] font-semibold text-emerald-400/80 uppercase tracking-wider block mb-1">
              Secondary Controls
            </span>

            <button
              type="button"
              onClick={() => {
                setIsHelpOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#0e372f] rounded-lg"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>Help & About CivicTrack</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleStaffMode?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#0e372f] rounded-lg"
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-400" />
                <span>Demo Staff Mode</span>
              </div>
              {isStaffMode && (
                <span className="text-xs bg-amber-900/60 text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-600/40">
                  On
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenDataModal?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-[#0e372f] rounded-lg"
            >
              <HardDrive className="w-4 h-4 text-slate-400" />
              <span>Browser Storage & Backups</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onStartTour?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-300 bg-[#0e372f] hover:bg-[#124238] rounded-lg border border-emerald-600/30"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Start Demo Tour</span>
            </button>
          </div>
        </div>
      )}

      {/* Help & About Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </header>
  );
}
