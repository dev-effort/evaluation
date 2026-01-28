import { LoginForm } from '@/components/auth/LoginForm';
import styles from './LoginPage.module.css';

export function LoginPage() {
  return (
    <div className={styles.container}>
      <LoginForm />
    </div>
  );
}
