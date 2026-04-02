import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import styles from './TeacherDashboard.module.css';

interface User {
  id: string;
}

interface CourseOption {
  id: string;
  title: string;
}

interface GradeCourseData {
  course: {
    id: string;
    title: string;
    lessons: Array<{ id: string; title: string }>;
  };
  students: Array<{
    student: { id: string; name: string | null; email: string };
    averageScore: number | null;
    risk: boolean;
    grades: Array<{ lessonId: string; lessonTitle: string; score: number | null }>;
  }>;
}

interface TeacherOverview {
  riskStudents: Array<{
    studentName: string;
    courseTitle: string;
    averageScore: number | null;
    recommendation?: string;
  }>;
}

export const TeacherStudents = () => {
  const [token] = useState(localStorage.getItem('token') || '');
  const [teacherId, setTeacherId] = useState('');
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [gradeData, setGradeData] = useState<GradeCourseData | null>(null);
  const [overview, setOverview] = useState<TeacherOverview | null>(null);
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const user = JSON.parse(raw) as User;
    setTeacherId(user.id);
  }, []);

  useEffect(() => {
    if (!teacherId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [coursesRes, overviewRes] = await Promise.all([
          fetch(`/api/courses?teacherId=${teacherId}&limit=100`),
          fetch(`/api/teacher/overview/${teacherId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const coursesData = await coursesRes.json();
        const overviewData = await overviewRes.json();
        const items = (coursesData.courses || []) as Array<{ id: string; title: string }>;
        setCourses(items.map((item) => ({ id: item.id, title: item.title })));
        setOverview(overviewData);
        if (items.length && !selectedCourseId) {
          setSelectedCourseId(items[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    load().catch((error) => console.error(error));
  }, [teacherId, token, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) return;
    fetch(`/api/grades/course/${selectedCourseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setGradeData(data))
      .catch((error) => console.error(error));
  }, [selectedCourseId, token]);

  const riskStudents = useMemo(() => {
    return (overview?.riskStudents || []).slice(0, 6);
  }, [overview]);

  const saveScore = async (studentId: string, lessonId: string) => {
    const key = `${studentId}:${lessonId}`;
    const rawValue = draftScores[key];
    if (!rawValue) return;
    const numeric = Number(rawValue);
    if (Number.isNaN(numeric)) return;

    const res = await fetch('/api/grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        studentId,
        lessonId,
        score: numeric,
      }),
    });
    if (res.ok) {
      const refresh = await fetch(`/api/grades/course/${selectedCourseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const refreshed = await refresh.json();
      setGradeData(refreshed);
    }
  };

  return (
    <div>
      <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Students & Grading</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
        <Card className={styles.riskCardContainer}>
          <CardBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertTriangle size={18} color="#f43f5e" />
              <h3 style={{ color: '#f43f5e' }}>Risk group (&lt; 50%)</h3>
            </div>
            {riskStudents.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No students in risk group yet.</p>
            ) : (
              riskStudents.map((student, index) => (
                <div key={`${student.studentName}-${index}`} className={styles.riskItem}>
                  <div>
                    <div className={styles.riskName}>{student.studentName}</div>
                    <div className={styles.riskReason}>
                      {student.courseTitle}
                      {student.recommendation ? ` • ${student.recommendation}` : ''}
                    </div>
                  </div>
                  <div className={styles.riskScore}>{student.averageScore ?? 0}%</div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="course-select" style={{ display: 'block', marginBottom: '0.4rem' }}>
                  Select course
                </label>
                <select
                  id="course-select"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: 460,
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-glass)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: 10,
                  }}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {!gradeData || !gradeData.students.length ? (
                <p style={{ color: 'var(--text-secondary)' }}>No enrolled students for this course yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Student</th>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Average</th>
                        {gradeData.course.lessons.map((lesson) => (
                          <th key={lesson.id} style={{ textAlign: 'left', padding: '0.5rem', minWidth: 220 }}>
                            {lesson.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {gradeData.students.map((row) => (
                        <tr key={row.student.id} style={{ borderTop: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '0.65rem 0.5rem' }}>{row.student.name || row.student.email}</td>
                          <td style={{ padding: '0.65rem 0.5rem', color: row.risk ? '#f43f5e' : 'var(--success)' }}>
                            {row.averageScore ?? '-'}
                          </td>
                          {row.grades.map((grade) => {
                            const key = `${row.student.id}:${grade.lessonId}`;
                            return (
                              <td key={grade.lessonId} style={{ padding: '0.65rem 0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={draftScores[key] ?? (grade.score ?? '')}
                                    onChange={(e) =>
                                      setDraftScores((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                      }))
                                    }
                                    style={{
                                      width: 80,
                                      background: 'var(--bg-surface)',
                                      border: '1px solid var(--border-glass)',
                                      borderRadius: 8,
                                      color: 'var(--text-primary)',
                                      padding: '0.35rem 0.45rem',
                                    }}
                                  />
                                  <Button size="sm" onClick={() => saveScore(row.student.id, grade.lessonId)} icon={<Save size={14} />}>
                                    Save
                                  </Button>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
