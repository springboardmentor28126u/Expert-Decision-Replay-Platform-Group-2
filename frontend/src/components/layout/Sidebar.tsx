import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

export const Sidebar = () => {
  const { user } = useAuth();
  
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Decisions', href: '/decisions', icon: Briefcase }, // Placeholder for future feature
  ];

  // Add admin/manager only links
  if (user?.role?.name === 'Administrator' || user?.role?.name === 'Manager') {
    navItems.push({ name: 'Users', href: '/users', icon: Users });
  }

  // Admin only links
  if (user?.role?.name === 'Administrator') {
    navItems.push({ name: 'Roles & Permissions', href: '/roles', icon: ShieldCheck });
    navItems.push({ name: 'Settings', href: '/settings', icon: Settings });
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col border-r bg-card h-full">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-bold tracking-tight text-primary">EDR Platform</h1>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto py-4">
        <nav className="flex-1 space-y-1 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="ml-3 truncate">
            <p className="text-sm font-medium">{user?.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role?.name}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
