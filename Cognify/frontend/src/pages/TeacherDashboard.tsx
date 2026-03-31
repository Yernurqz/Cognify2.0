import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, BookOpen, Star, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardBody, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import styles from './TeacherDashboard.module.css';

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    fetch(`http://localhost:5000/api/teacher/courses/${parsedUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.courses) {
          setCourses(data.courses);
        }
      })
      .catch(err => console.error("Error fetching courses:", err))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  if (!user) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Welcome back, {user.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Here's an overview of your courses and students today.</p>
        </div>
        <Button icon={<Sparkles size={18} />} onClick={() => navigate('/teacher/create')}>
          Create Course
        </Button>
      </div>

      <div className={styles.statsGrid}>
        <Card>
          <CardBody className={styles.statCard}>
            <div style={{ color: 'var(--text-secondary)' }}><Users className="inline-block mr-2" size={20} /> Total Students</div>
            <div className={styles.statValue}>1,248</div>
            <div style={{ color: 'var(--success)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              <TrendingUp size={14} className="inline mr-1" /> +12% this month
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={styles.statCard}>
            <div style={{ color: 'var(--text-secondary)' }}><BookOpen className="inline-block mr-2" size={20} /> Active Courses</div>
            <div className={styles.statValue}>{courses.length}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className={styles.statCard}>
            <div style={{ color: 'var(--text-secondary)' }}><Star className="inline-block mr-2" size={20} /> Avg. Rating</div>
            <div className={styles.statValue}>4.8</div>
          </CardBody>
        </Card>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2rem' }}>Recent Courses</h2>
      
      {isLoading ? (
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading courses...</p>
      ) : courses.length === 0 ? (
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          You haven't created any courses yet. Click "Create Course" to get started!
        </p>
      ) : (
        <div className={styles.grid}>
          {courses.map((course) => (
            <Card key={course.id} interactive>
              <div className={styles.courseImage}>
                <BookOpen size={48} />
              </div>
              <CardBody>
                <CardTitle>{course.title}</CardTitle>
                <div className={styles.aiBadge}>
                  <Sparkles size={12} /> AI Assisted Grading
                </div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.875rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {course.description}
                </p>
              </CardBody>
              <CardFooter style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {course.tags && course.tags.length > 0 ? course.tags.join(', ') : 'No tags'}
                </span>
                <Button size="sm" variant="secondary">Manage</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
