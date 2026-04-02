import { BrowserRouter as Router, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherCourseCreate } from './pages/TeacherCourseCreate';
import { TeacherCourses } from './pages/TeacherCourses';
import { TeacherStudents } from './pages/TeacherStudents';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentCatalog } from './pages/StudentCatalog';
import { AdminDashboard } from './pages/AdminDashboard';
import { CourseView } from './pages/CourseView';
import { ProfilePage } from './pages/ProfilePage';
import { CertificateVerifyPage } from './pages/CertificateVerifyPage';

interface StoredUser {
  id: string;
  role: string;
}

function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function ProtectedRoute({ roles }: { roles: Array<'TEACHER' | 'STUDENT' | 'ADMIN'> }) {
  const user = getStoredUser();
  const token = localStorage.getItem('token');
  if (!user || !token) {
    return <Navigate to="/auth" replace />;
  }
  if (!roles.includes((user.role || '').toUpperCase() as 'TEACHER' | 'STUDENT' | 'ADMIN')) {
    return <Navigate to="/auth" replace />;
  }
  return <Outlet />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/course/:id" element={<CourseView />} />
        <Route path="/verify/:code" element={<CertificateVerifyPage />} />

        <Route element={<ProtectedRoute roles={['TEACHER', 'ADMIN']} />}>
          <Route
            path="/teacher"
            element={
              <DashboardLayout role="teacher">
                <Outlet />
              </DashboardLayout>
            }
          >
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="courses" element={<TeacherCourses />} />
            <Route path="create" element={<TeacherCourseCreate />} />
            <Route path="students" element={<TeacherStudents />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['STUDENT', 'ADMIN']} />}>
          <Route
            path="/student"
            element={
              <DashboardLayout role="student">
                <Outlet />
              </DashboardLayout>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="catalog" element={<StudentCatalog />} />
            <Route path="admin" element={<AdminDashboard />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
