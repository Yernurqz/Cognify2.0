import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, GraduationCap, BookOpen, Moon, Sun } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import styles from './AuthPage.module.css';
import { usePreferences } from '../context/PreferencesContext';

type Role = 'student' | 'teacher';
type Mode = 'login' | 'register';

export const AuthPage = () => {
  const navigate = useNavigate();
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences();
  const [role, setRole] = useState<Role>('student');
  const [mode, setMode] = useState<Mode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password, role: role.toUpperCase() };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      const userRole = (data.user.role || role).toLowerCase();
      navigate(userRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch (err) {
      console.error(err);
      setError('Server connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.blob + ' ' + styles.blob1}></div>
      <div className={styles.blob + ' ' + styles.blob2}></div>

      <Card className={styles.authCard}>
        <CardBody>
          <div className={styles.header}>
            <div className="flex justify-center mb-4 text-primary">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <BookOpen size={32} className="text-primary" style={{ color: 'var(--primary)' }} />
              </div>
            </div>
            <h1 className={`${styles.title} text-gradient`}>{t('auth.title', 'Cognify')}</h1>
            <p className={styles.subtitle}>
              {mode === 'login'
                ? t('auth.login.subtitle', 'Sign in to continue learning')
                : t('auth.register.subtitle', 'Create an account to start learning')}
            </p>
          </div>

          <div className={styles.prefBar}>
            <div className={styles.langSwitch}>
              <button
                type="button"
                className={`${styles.langBtn} ${language === 'ru' ? styles.langBtnActive : ''}`}
                onClick={() => setLanguage('ru')}
              >
                RU
              </button>
              <button
                type="button"
                className={`${styles.langBtn} ${language === 'en' ? styles.langBtnActive : ''}`}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className={`${styles.langBtn} ${language === 'kk' ? styles.langBtnActive : ''}`}
                onClick={() => setLanguage('kk')}
              >
                KZ
              </button>
            </div>
            <button type="button" className={styles.themeToggle} onClick={toggleTheme} aria-label={t('layout.theme', 'Theme')}>
              {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              <span>{theme === 'dark' ? t('layout.dark', 'Dark') : t('layout.light', 'Light')}</span>
            </button>
          </div>

          <div className={styles.roleToggle}>
            <button
              type="button"
              className={`${styles.roleBtn} ${role === 'student' ? styles.active : ''}`}
              onClick={() => setRole('student')}
            >
              <div className="flex items-center justify-center gap-2">
                <GraduationCap size={18} /> {t('auth.student', 'Student')}
              </div>
            </button>
            <button
              type="button"
              className={`${styles.roleBtn} ${role === 'teacher' ? styles.active : ''}`}
              onClick={() => setRole('teacher')}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={18} /> {t('auth.teacher', 'Teacher')}
              </div>
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 mb-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {mode === 'register' && (
              <Input
                label={t('auth.name', 'Full Name')}
                placeholder="John Doe"
                icon={<User size={18} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              label={t('auth.email', 'Email')}
              type="email"
              placeholder="name@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label={t('auth.password', 'Password')}
              type="password"
              placeholder="********"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" size="lg" fullWidth className="mt-2" disabled={isLoading}>
              {isLoading ? '...' : mode === 'login' ? t('auth.login', 'Sign In') : t('auth.register', 'Create Account')}
            </Button>
          </form>

          <div className={styles.footer}>
            {mode === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <button type="button" className={styles.link} onClick={() => { setMode('register'); setError(''); }}>
                  {t('auth.register', 'Create Account')}
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button type="button" className={styles.link} onClick={() => { setMode('login'); setError(''); }}>
                  {t('auth.login', 'Sign In')}
                </button>
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
