import { useAuth } from '@/hooks/useAuth';
import styles from './Header.module.css';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <h1>Developer Evaluation</h1>
      </div>
      <div className={styles.userInfo}>
        {user && (
          <>
            <span className={styles.email}>{user.email}</span>
            <button onClick={signOut} className={styles.logoutBtn}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}
