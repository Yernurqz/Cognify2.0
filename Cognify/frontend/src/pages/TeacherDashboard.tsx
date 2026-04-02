import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, TrendingUp, Users } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authFetch } from '../lib/api';
import styles from './TeacherDashboard.module.css';

interface User {
  id: string;
  name: string | null;
}

interface Course {
  id: string;
  title: string;
  _count?: {
    enrollments: number;
  };
}

interface Overview {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  riskCount: number;
  riskStudents: Array<{
    studentName: string;
    courseTitle: string;
    averageScore: number | null;
  }>;
}

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!raw || !token) {
      navigate('/auth');
      return;
    }
    const parsed = JSON.parse(raw) as User;
    setUser(parsed);

    Promise.all([
      authFetch(`/api/courses?teacherId=${parsed.id}&limit=20`),
      authFetch(`/api/teacher/overview/${parsed.id}`),
    ])
      .then(async ([coursesRes, overviewRes]) => {
        const coursesData = await coursesRes.json();
        const overviewData = await overviewRes.json();
        setCourses(coursesData.courses || []);
        setOverview(overviewData);
      })
      .catch((error) => console.error(error))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  if (!user) return null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.2rem' }}>
            Welcome back, {user.name || 'Teacher'}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Your teaching workspace is ready.</p>
        </div>
        <Button icon={<Sparkles size={18} />} onClick={() => navigate('/teacher/create')}>
          Create Course
        </Button>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCardFixed}>
          <CardBody>
            <div className={styles.statLabel}><Users size={20} /> Total Students</div>
            <div className={styles.statValue}>{overview?.totalStudents || 0}</div>
            <div className={styles.statChange}><TrendingUp size={14} /> Enrollments: {overview?.totalEnrollments || 0}</div>
          </CardBody>
        </Card>
        <Card className={styles.statCardFixed}>
          <CardBody>
            <div className={styles.statLabel}><BookOpen size={20} /> Active Courses</div>
            <div className={styles.statValue}>{overview?.totalCourses || courses.length}</div>
            <div className={styles.statChange}>AI + Manual</div>
          </CardBody>
        </Card>
        <Card className={styles.statCardFixed}>
          <CardBody>
            <div className={styles.statLabel}><Users size={20} /> Risk Group (&lt;50)</div>
            <div className={styles.statValue}>{overview?.riskCount || 0}</div>
            <div className={styles.statChange} style={{ color: '#f43f5e' }}>Needs attention</div>
          </CardBody>
        </Card>
      </div>

      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        <Card>
          <CardBody>
            <h3 style={{ marginBottom: '0.75rem' }}>Recent Courses</h3>
            {isLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
            ) : !courses.length ? (
              <p style={{ color: 'var(--text-secondary)' }}>No courses yet.</p>
            ) : (
              courses.slice(0, 5).map((course) => (
                <div key={course.id} style={{ padding: '0.45rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                  <strong>{course.title}</strong>
                </div>
              ))
            )}
            <div style={{ marginTop: '0.8rem' }}>
              <Button size="sm" variant="secondary" onClick={() => navigate('/teacher/courses')}>
                View all courses
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className={styles.riskCardContainer}>
          <CardBody>
            <h3 style={{ marginBottom: '0.75rem', color: '#f43f5e' }}>Students at Risk</h3>
            {!overview?.riskStudents?.length ? (
              <p style={{ color: 'var(--text-secondary)' }}>No risk students yet.</p>
            ) : (
              overview.riskStudents.slice(0, 5).map((item, index) => (
                <div key={`${item.studentName}-${index}`} className={styles.riskItem}>
                  <div>
                    <div className={styles.riskName}>{item.studentName}</div>
                    <div className={styles.riskReason}>{item.courseTitle}</div>
                  </div>
                  <div className={styles.riskScore}>{item.averageScore ?? 0}%</div>
                </div>
              ))
            )}
            <div style={{ marginTop: '0.8rem' }}>
              <Button size="sm" onClick={() => navigate('/teacher/students')}>Open grading</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
