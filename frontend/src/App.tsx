import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherCourseCreate } from './pages/TeacherCourseCreate';
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentCatalog } from './pages/StudentCatalog';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher/*" element={
          <DashboardLayout role="teacher">
            <Routes>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="create" element={<TeacherCourseCreate />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        } />

        {/* Student Routes */}
        <Route path="/student/*" element={
          <DashboardLayout role="student">
            <Routes>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="catalog" element={<StudentCatalog />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        } />

        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
