import React from 'react';
import styles from './index.module.css';

interface LoginProps {
  username: string;
  password: string;
  error: string;
  isLoading: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const Login: React.FC<LoginProps> = ({
  username,
  password,
  error,
  isLoading,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}) => {
  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>Timesheet Login</h1>
        
        <form className={styles.form} onSubmit={onSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className={styles.input}
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className={styles.input}
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className={styles.demoCredentials}>
          <div className={styles.strong}>Demo Credentials:</div>
          <div className={styles.credentialLine}>Admin: admin / admin123</div>
          <div className={styles.credentialLine}>User: john / user123 or jane / user123</div>
        </div>
      </div>
    </div>
  );
};

export default Login;