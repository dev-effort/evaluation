import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Summary', icon: 'chart' },
  { path: '/developers', label: 'Developers', icon: 'user' },
  { path: '/teams', label: 'Teams', icon: 'users' },
  { path: '/agent-hash', label: 'Agent Hash', icon: 'hash' },
];

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{getIcon(item.icon)}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function getIcon(icon: string): string {
  switch (icon) {
    case 'chart':
      return '\u2261';
    case 'user':
      return '\u263A';
    case 'users':
      return '\u2302';
    case 'hash':
      return '#';
    default:
      return '\u2022';
  }
}
