'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, User, ShieldCheck } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Added password field for the UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'ADMIN'>('EMPLOYEE');

  const handleLogin = async (e?: React.FormEvent, selectedEmail?: string) => {
    if (e) e.preventDefault();
    const loginEmail = selectedEmail || email;
    
    if (!loginEmail) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        email: loginEmail,
        password: password,
        redirect: false,
      });

      if (res?.error) {
        // Map next-auth credentials signin error to custom user-friendly messages
        if (res.error === "CredentialsSignin") {
          setError('Invalid login credentials');
        } else {
          setError(res.error);
        }
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Left Side: Branding */}
      <div className={styles.leftSide}>
        <h1 className={styles.brandName}>GoalForge</h1>
        <p className={styles.tagline}>Align Goals. Track Progress. Drive Success.</p>
      </div>

      {/* Right Side: Login Panel */}
      <div className={styles.rightSide}>
        <div className={`animate-fade-in ${styles.loginCard}`}>
          {/* Role Tabs */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'EMPLOYEE' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('EMPLOYEE')}
            >
              <User size={18} />
              Employee
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'ADMIN' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('ADMIN')}
            >
              <ShieldCheck size={18} />
              Admin
            </button>
          </div>

          <div className={styles.header}>
            <h2 className={styles.title}>Welcome Back</h2>
            <p className={styles.subtitle}>Access your {activeTab === 'ADMIN' ? 'admin' : 'performance'} portal</p>
          </div>

          <form className={styles.form} onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder={activeTab === 'ADMIN' ? 'Admin Email' : 'Work Email'}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Password"
                />
              </div>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</div>}

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Entering...' : 'Enter Portal'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className={styles.footer}>
            <p>
              New to GoalForge? <a href="#" className={styles.link}>Request Access</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
