import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Brain, Award } from 'lucide-react';
import { Card, CardBody, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authFetch } from '../lib/api';
import styles from './StudentDashboard.module.css';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  xp?: number;
  streakDays?: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  teacher: {
    name: string | null;
  };
}

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    const parsedUser: User = JSON.parse(storedUser);
    setUser(parsedUser);

    authFetch(`/api/student/courses/${parsedUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.courses) setCourses(data.courses);
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  if (!user) return null;

  return (
    <div>
      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        {/* Welcome & AI Banner */}
        <Card className={styles.aiTutorCard}>
          <CardBody style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Brain className="text-secondary" />
                <span className="text-secondary font-semibold">AI Tutor Active</span>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Welcome back, {user.name}! Ready to continue your AI journey?
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '600px' }}>
                {courses.length > 0 
                  ? 'Your personalized learning paths are ready. Select a course to keep making progress.' 
                  : 'You have not enrolled in any courses yet. Check the Course Catalog to begin your learning.'}
              </p>
              <div style={{ marginTop: '0.7rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-secondary)' }}>XP: {user.xp || 0}</span>
                <span style={{ color: 'var(--text-secondary)' }}>Streak: {user.streakDays || 0} days</span>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <Button variant="primary" icon={<Sparkles size={18} />} onClick={() => navigate('/student/catalog')}>Browse Catalog</Button>
              </div>
            </div>
            <div style={{ opacity: 0.8 }} className="hidden md:block">
               {/* Decorative Element */}
               <Award size={120} style={{ color: 'var(--secondary)' }} />
            </div>
          </CardBody>
        </Card>

        {/* Enrolled Courses */}
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Your Learning Portfolio</h3>
          
          {isLoading ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading your dashboard...</p>
          ) : courses.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>You are not enrolled in any courses right now.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {courses.map(course => (
                <Card key={course.id} interactive>
                  <div className={styles.courseImage}>
                    <Brain size={48} />
                  </div>
                  <CardBody>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <span>Enrolled</span>
                      <span style={{ color: 'var(--primary)' }}>Just Started</span>
                    </div>
                    <CardTitle style={{ marginTop: '0.5rem' }}>{course.title}</CardTitle>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: '5%' }}></div>
                    </div>
                  </CardBody>
                  <CardFooter>
                    <Button fullWidth icon={<Play size={18} />} onClick={() => navigate(`/course/${course.id}`)}>Resume Learning</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
