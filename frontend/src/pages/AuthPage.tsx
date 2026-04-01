import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, GraduationCap, BookOpen } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import styles from './AuthPage.module.css';

type Role = 'student' | 'teacher';
type Mode = 'login' | 'register';

export const AuthPage = () => {
  const navigate = useNavigate();
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
      const body = mode === 'login' 
        ? { email, password }
        : { name, email, password, role };

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect to appropriate dashboard based on the REAL role they registered/logged in as
        const userRole = data.user.role || role; 
        navigate(userRole === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Unable to connect to the server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Abstract background elements could go here */}
      
      <Card className={styles.authCard}>
        <CardBody>
          <div className={styles.header}>
            <div className="flex justify-center mb-4 text-primary">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <BookOpen size={32} className="text-primary" style={{color: 'var(--primary)'}}/>
              </div>
            </div>
            <h1 className={`${styles.title} text-gradient`}>AI Hub Learning</h1>
            <p className={styles.subtitle}>
              {mode === 'login' ? 'Welcome back! Please login to your account.' : 'Create an account to begin your journey.'}
            </p>
          </div>

          <div className={styles.roleToggle}>
            <button
              type="button"
              className={`${styles.roleBtn} ${role === 'student' ? styles.active : ''}`}
              onClick={() => setRole('student')}
            >
              <div className="flex items-center justify-center gap-2">
                <GraduationCap size={18} /> Student
              </div>
            </button>
            <button
              type="button"
              className={`${styles.roleBtn} ${role === 'teacher' ? styles.active : ''}`}
              onClick={() => setRole('teacher')}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={18} /> Teacher
              </div>
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            {error && <div className="p-3 mb-2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">{error}</div>}
            
            {mode === 'register' && (
              <Input
                label="Full Name"
                placeholder="John Doe"
                icon={<User size={18} />}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              icon={<Mail size={18} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
            {mode === 'login' && (
              <div className={styles.options}>
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input type="checkbox" className="rounded bg-black/20 border-border-glass" />
                  Remember me
                </label>
                <button type="button" className={styles.link}>Forgot Password?</button>
              </div>
            )}

            <Button type="submit" size="lg" fullWidth className="mt-2" disabled={isLoading}>
              {isLoading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </Button>
          </form>

          <div className={styles.footer}>
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button type="button" className={styles.link} onClick={() => { setMode('register'); setError(''); }}>
                  Sign up now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button type="button" className={styles.link} onClick={() => { setMode('login'); setError(''); }}>
                  Sign in
                </button>
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
