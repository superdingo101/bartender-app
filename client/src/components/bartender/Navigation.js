import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/bartender/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 md:space-x-8 overflow-x-auto">
            <Link 
              to="/bartender/orders" 
              className="text-gray-600 hover:text-purple-600 font-medium transition whitespace-nowrap"
            >
              Orders
            </Link>
            <Link 
              to="/bartender/events" 
              className="text-gray-600 hover:text-purple-600 font-medium transition whitespace-nowrap"
            >
              Events
            </Link>
            <Link 
              to="/bartender/drinks" 
              className="text-gray-600 hover:text-purple-600 font-medium transition whitespace-nowrap"
            >
              Drinks
            </Link>
            {user?.role === 'ADMIN' && (
              <Link 
                to="/admin" 
                className="text-gray-600 hover:text-purple-600 font-medium transition whitespace-nowrap"
              >
                👑 Admin
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <span className="text-xs md:text-sm text-gray-600 truncate max-w-[120px] md:max-w-none">
              {user?.name} <span className="text-purple-600 hidden sm:inline">({user?.role})</span>
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-xs md:text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;