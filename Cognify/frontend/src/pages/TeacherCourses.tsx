import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import styles from './TeacherDashboard.module.css';

interface User {
  id: string;
}

interface TeacherCourse {
  id: string;
  title: string;
  description: string | null;
  aiGenerated: boolean;
  _count?: {
    enrollments: number;
  };
}

export const TeacherCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    const user = JSON.parse(storedUser) as User;
    fetch(`/api/courses?teacherId=${user.id}&limit=50`)
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []))
      .catch((err) => console.error('Courses fetch error:', err))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2rem' }}>My Courses</h1>
        <Button icon={<PlusCircle size={18} />} onClick={() => navigate('/teacher/create')}>
          Create Course
        </Button>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : courses.length === 0 ? (
        <Card>
          <CardBody style={{ textAlign: 'center', padding: '2.5rem' }}>
            <BookOpen size={42} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>You do not have courses yet.</p>
          </CardBody>
        </Card>
      ) : (
        <div className={styles.grid}>
          {courses.map((course) => (
            <Card key={course.id} interactive>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{course.title}</h3>
                  <span style={{ fontSize: '0.75rem', color: course.aiGenerated ? 'var(--success)' : 'var(--text-muted)' }}>
                    {course.aiGenerated ? 'AI' : 'Manual'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {course.description || 'No description'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Users size={16} />
                  <span>{course._count?.enrollments || 0} students</span>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <Button size="sm" onClick={() => navigate(`/course/${course.id}`)}>Open Course</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
