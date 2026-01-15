import { IoSearch, IoNotifications, IoChevronDown, IoChatbubbleEllipses, IoClose } from "react-icons/io5";
import { useState, useEffect } from "react";

const TopNavbar = () => {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Close mobile search when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setShowMobileSearch(false);
    }
  }, [isMobile]);

  return (
    <nav className="w-full h-16 bg-gradient-to-r from-[#6252fe] via-[#526bff] to-[#11bdff] px-4 md:px-6 flex items-center justify-between shadow-md relative">
      
      {/* Logo Section - Left Side */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-[#4c1d95] rounded-lg flex items-center justify-center">
          <IoChatbubbleEllipses className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <span className="text-white text-lg md:text-xl font-bold hidden sm:block">
          FlowChat
        </span>
      </div>

      {/* Desktop Search Bar - Always visible on desktop */}
      <div className="hidden md:block flex-1 max-w-xl mx-4 lg:mx-8">
        <div className="relative w-full">
          <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
          <input
            type="text"
            placeholder="Search conversations, people, files..."
            className="w-full h-10 pl-10 pr-4 bg-white/10 rounded-lg text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Mobile Search Overlay - Only when active */}
      {showMobileSearch && (
        <div className="md:hidden fixed inset-0 z-50 bg-gradient-to-r from-[#6252fe] via-[#526bff] to-[#11bdff] p-4 flex items-center">
          <div className="relative w-full">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white" />
            <input
              type="text"
              placeholder="Search conversations, people, files..."
              className="w-full h-12 pl-10 pr-16 bg-white/20 rounded-lg text-white placeholder:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all backdrop-blur-sm text-lg"
              autoFocus
            />
            <button 
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white font-medium px-3 py-1 rounded hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* User Section - Right Side */}
      <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
        {/* Mobile Search Toggle */}
        <button 
          className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setShowMobileSearch(true)}
        >
          <IoSearch className="w-5 h-5" />
        </button>

        {/* Notification Bell */}
        <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
          <IoNotifications className="w-5 h-5 md:w-6 md:h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">3</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white overflow-hidden flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
          </div>
          <span className="text-white font-medium hidden md:block text-sm lg:text-base">
            Sarah Chen
          </span>
          <IoChevronDown className="w-4 h-4 text-white hidden md:block" />
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;