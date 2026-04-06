import React, { useState } from 'react';
import { MenuIcon, BellIcon, SearchIcon, Home, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12">
          {/* Left side - Mobile menu and Home button */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 transition-all duration-200"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuIcon className="h-4 w-4" aria-hidden="true" />
            </button>

            {/* Home button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Home className="h-3 w-3" />
              <span className="text-xs font-medium">Home</span>
            </button>

          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-4">
             

            {/* Profile dropdown */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-2 p-1.5 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="h-6 w-6 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-medium text-gray-900">{user?.username}</div>
                  <div className="text-[10px] text-gray-500">{user?.email}</div>
                </div>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>

              {/* Profile menu dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <div className="text-xs font-medium text-gray-900">{user?.username}</div>
                    <div className="text-[10px] text-gray-500">{user?.email}</div>
                  </div>
                  <div className="py-0.5">

                    <button
                      onClick={() => navigate('/settings')}
                      className="flex items-center w-full px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <User className="h-3.5 w-3.5 mr-2 text-gray-400" />
                      Profile
                    </button>
                    {/* <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        // Navigate to settings page if exists
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      <Settings className="h-4 w-4 mr-3 text-gray-400" />
                      Settings
                    </button> */}
                  </div>
                  <div className="border-t border-gray-200 py-0.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors duration-150"
                    >
                      <LogOut className="h-3.5 w-3.5 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      <div className="lg:hidden border-t border-gray-200 px-4 py-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <SearchIcon className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="search"
            placeholder="Search..."
            className="block w-full pl-8 pr-2.5 py-1.5 border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showProfileMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowProfileMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;