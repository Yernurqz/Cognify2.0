import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import styles from './TeacherCourseCreate.module.css';

export const TeacherCourseCreate = () => {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [navigate]);

  const handleGenerate = async () => {
    if (!topic || !user) return;
    setIsGenerating(true);
    
    try {
      // Create a new course via our Express backend
      const response = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: user.id,
          title: topic,
          description: `An in-depth, auto-generated course focusing on ${topic}. Covers fundamentals, advanced topics, and practical exercises.`,
          tags: [topic.split(' ')[0], 'AI Generated']
        })
      });

      if (response.ok) {
        setIsDone(true);
      } else {
        console.error("Failed to create course");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!user) return null;

  if (isDone) {
    return (
      <div className={styles.container}>
        <Card className="animate-fade-in text-center p-8 border-success/30" style={{ borderColor: 'var(--success)' }}>
          <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
            <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Course Generated!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Your AI-generated course on "{topic}" is ready. We have created 8 modules, 4 quizzes, and 2 assignments.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={() => navigate('/teacher/dashboard')}>Review Course Content</Button>
              <Button variant="secondary" onClick={() => { setIsDone(false); setTopic(''); }}>Generate Another</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.5rem' }}>AI Course Generator</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Describe the topic and parameters, and let our AI assemble a comprehensive course structure for you.
        </p>
      </div>

      <div className={styles.glowBox}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Sparkles style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>What would you like to teach?</h3>
        </div>
        
        <textarea 
          className={styles.textarea}
          placeholder="E.g. A comprehensive guide to modern React development including hooks, state management, and performance optimization intended for intermediate developers..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isGenerating}
        />

        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Try these ideas:</span>
          <div className={styles.tags}>
            <span className={styles.tag} onClick={() => setTopic('Introduction to Natural Language Processing')}>NLP Basics</span>
            <span className={styles.tag} onClick={() => setTopic('Advanced CSS Animations and Micro-interactions')}>CSS Animations</span>
            <span className={styles.tag} onClick={() => setTopic('Financial Literacy for College Students')}>Financial Literacy</span>
          </div>
        </div>

        <Button 
          size="lg" 
          fullWidth 
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          icon={isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" size={18} />}
        >
          {isGenerating ? 'Analyzing and Generating Curriculum...' : 'Generate AI Course Structure'}
        </Button>
      </div>
    </div>
  );
};
