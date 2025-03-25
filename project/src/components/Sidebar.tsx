import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../components/forms/AuthContext';

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ menuItems }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-56 bg-gray-800 text-gray-200 flex flex-col h-screen">
      {/* Compact Header */}
      <div className="p-3 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Station Essence</h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 p-2 rounded-md transition-all duration-200 ${
                    isActive ? 'bg-pink-600 text-white' : 'hover:bg-gray-700'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 p-2 rounded-md transition-all duration-200 ${
                  isActive ? 'bg-pink-600 text-white' : 'hover:bg-gray-700'
                }`
              }
            >
              <User className="h-4 w-4" />
              <span className="text-sm">Profil</span>
            </NavLink>
          </li>


        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-2 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 p-2 w-full rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;