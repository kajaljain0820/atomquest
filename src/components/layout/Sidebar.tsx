'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Target, Users, Settings, LogOut, CheckSquare } from 'lucide-react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const role = session?.user?.role || 'EMPLOYEE';

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { name: 'My Goals', path: '/dashboard/goals', icon: Target, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { name: 'My Progress', path: '/dashboard/progress', icon: CheckSquare, roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { name: 'Team Review', path: '/dashboard/team', icon: Users, roles: ['MANAGER', 'ADMIN'] },
    { name: 'Reports', path: '/dashboard/reports', icon: LayoutDashboard, roles: ['MANAGER', 'ADMIN'] },
    { name: 'Cycle Config', path: '/dashboard/config', icon: Settings, roles: ['ADMIN'] },
    { name: 'Audit Logs', path: '/dashboard/audit', icon: CheckSquare, roles: ['ADMIN'] },
  ];

  const allowedNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        GoalForge
      </div>
      
      <nav className={styles.nav}>
        {allowedNavItems.map((item) => {
          const isActive = item.path === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname === item.path || pathname.startsWith(item.path + '/');
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {session?.user && (
        <div className={styles.userProfile}>
          <div className={styles.avatar}>
            {session.user.name?.charAt(0) || 'U'}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session.user.name}</span>
            <span className={styles.userRole}>{session.user.role}</span>
          </div>
        </div>
      )}

      <div style={{ padding: '0 1rem 1.5rem 1rem' }}>
        <button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/login' })}>
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
