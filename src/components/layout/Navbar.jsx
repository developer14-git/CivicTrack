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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Brand, Location Selector & Primary Navigation
              CivicTrack logo → Home → Explore Map → Browse Issues → My Reports → Accountability → More */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-3 min-w-0">
            {/* CivicTrack Logo */}
            <button
              type="button"
              onClick={() => handleNavClick('overview')}
              className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-md p-1 text-left shrink-0"
              aria-label="CivicTrack Home"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-200" aria-hidden="true" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 shrink-0">
                Civic<span className="text-emerald-700">Track</span>
              </span>
            </button>

            {/* Action Area Selector (near the logo, compact, does not push navigation) */}
            <div className="hidden xl:flex items-center gap-1.5 pl-2.5 border-l border-slate-200 text-xs text-slate-600 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" aria-hidden="true" />
              <label htmlFor="area-select" className="sr-only">New Town Action Area</label>
              <select
                id="area-select"
                value={selectedCampus}
                onChange={(e) => onSelectCampus(e.target.value)}
                className="bg-transparent hover:text-slate-900 py-1 pr-3 font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600 rounded cursor-pointer max-w-[140px] truncate"
              >
                {MOCK_CAMPUSES.map((area) => (
                  <option key={area} value={area}>
                    {area === 'All Action Areas' ? 'New Town (All)' : area}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop Navigation Links on Left */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = currentTab === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleNavClick(link.id)}
                    className={`px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="whitespace-nowrap">{link.label}</span>
                    {link.badge !== undefined && link.badge > 0 && (
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-700'
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
                  className={`px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                    moreToolsOpen
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                  aria-haspopup="menu"
                  aria-expanded={moreToolsOpen}
                >
                  <span className="whitespace-nowrap">More</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                </button>

                {moreToolsOpen && (
                  <div
                    className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-50 text-left"
                    role="menu"
                  >
                    {/* Persona Overview Header */}
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 rounded-t-md mb-1">
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
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
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
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
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
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-md transition-colors"
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
                      className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Start Guided Demo Tour</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right: Compact Secondary Controls & Primary Action CTA */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto">
            {/* Staff Mode Active Pill */}
            {isStaffMode && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded whitespace-nowrap">
                <Wrench className="w-3 h-3 text-amber-700" aria-hidden="true" />
                <span>Staff Mode Active</span>
              </span>
            )}

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-1.5 rounded-md transition-colors text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                  notificationsOpen ? 'bg-slate-100 text-slate-900' : ''
                }`}
                aria-label="Notifications"
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-md p-3 z-50 text-left"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-800">Recent Activity</span>
                    <span className="text-[11px] text-slate-400">{notifications.length} items</span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
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
                          className="py-2 px-1 text-xs cursor-pointer hover:bg-slate-50 rounded transition-colors text-slate-700"
                        >
                          <p className="leading-snug">{n.text}</p>
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="whitespace-nowrap">Report a Problem</span>
            </button>

            {/* Mobile Menu Button on narrow screens */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer on narrow screens */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 text-left">
          {/* Action Area Selector for Mobile */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span className="font-medium">Action Area:</span>
            </div>
            <select
              value={selectedCampus}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              {MOCK_CAMPUSES.map((area) => (
                <option key={area} value={area}>
                  {area === 'All Action Areas' ? 'New Town (All Areas)' : area}
                </option>
              ))}
            </select>
          </div>
          {/* Persona Card */}
          <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2">
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

          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = currentTab === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && link.badge > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-1">
            <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Secondary Controls
            </span>

            <button
              type="button"
              onClick={() => {
                setIsHelpOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>Help & About CivicTrack</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleStaffMode?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-500" />
                <span>Demo Staff Mode</span>
              </div>
              {isStaffMode && (
                <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded">
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
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
            >
              <HardDrive className="w-4 h-4 text-slate-500" />
              <span>Browser Storage & Backups</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onStartTour?.();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 rounded-md"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
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
