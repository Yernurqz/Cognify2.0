import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2, Plus, Trash2, BookOpen, PenTool } from 'lucide-react';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import styles from './TeacherCourseCreate.module.css';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface NewLesson {
  title: string;
  content: string;
}

export const TeacherCourseCreate = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  // Tabs: 'ai' or 'manual'
  const [creationMode, setCreationMode] = useState<'ai' | 'manual'>('ai');
  
  // AI Generator state
  const [topic, setTopic] = useState('');
  const [templateKey, setTemplateKey] = useState<'bootcamp' | 'academic' | 'corporate' | 'exam'>('bootcamp');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [language, setLanguage] = useState<'en' | 'ru' | 'kk'>('en');
  const [targetAudience, setTargetAudience] = useState('');
  const [courseGoal, setCourseGoal] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Manual Creator state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualLessons, setManualLessons] = useState<NewLesson[]>([{ title: '', content: '' }]);
  const [isSaving, setIsSaving] = useState(false);

  // Success state
  const [isDone, setIsDone] = useState(false);
  const [generatedCourseId, setGeneratedCourseId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    setUser(JSON.parse(storedUser));
    return () => controller.abort();
  }, [navigate]);

  const handleGenerate = async () => {
    if (!topic || !user) return;
    setIsGenerating(true);
    const controller = new AbortController();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/generate-from-template', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, templateKey, level, language, targetAudience, courseGoal, durationWeeks }),
        signal: controller.signal
      });

      if (response.ok) {
        const data = await response.json();
        if (data.course && data.course.id) {
          setGeneratedCourseId(data.course.id);
        }
        setIsDone(true);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualSave = async () => {
    if (!manualTitle || !user) return;
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: manualTitle,
          description: manualDescription,
          lessons: manualLessons.filter(l => l.title.trim() !== '')
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.course && data.course.id) {
          setGeneratedCourseId(data.course.id);
        }
        setIsDone(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const addLesson = () => {
    setManualLessons([...manualLessons, { title: '', content: '' }]);
  };

  const updateLesson = (index: number, field: keyof NewLesson, value: string) => {
    const next = [...manualLessons];
    next[index][field] = value;
    setManualLessons(next);
  };

  const removeLesson = (index: number) => {
    if (manualLessons.length <= 1) return;
    setManualLessons(manualLessons.filter((_, i) => i !== index));
  };

  if (!user) return null;

  if (isDone) {
    return (
      <div className={styles.container}>
        <Card className="animate-fade-in text-center p-8 border-success/30" style={{ borderColor: 'var(--success)' }}>
          <CardBody style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
            <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Course Created!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Your course "{creationMode === 'ai' ? topic : manualTitle}" is now live and ready for students.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Button onClick={() => generatedCourseId ? navigate(`/course/${generatedCourseId}`) : navigate('/teacher/dashboard')}>View Course</Button>
              <Button variant="secondary" onClick={() => { setIsDone(false); setTopic(''); setManualTitle(''); setManualLessons([{ title: '', content: '' }]); }}>Create Another</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Create New Course</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Choose a creation method below to get started.</p>
        </div>
      </header>

      {/* Tabs Switcher */}
      <div className={styles.tabSwitcher}>
        <button 
          className={`${styles.tabBtn} ${creationMode === 'ai' ? styles.activeTab : ''}`}
          onClick={() => setCreationMode('ai')}
        >
          <Sparkles size={20} /> AI Wizard
        </button>
        <button 
          className={`${styles.tabBtn} ${creationMode === 'manual' ? styles.activeTab : ''}`}
          onClick={() => setCreationMode('manual')}
        >
          <PenTool size={20} /> Classic Creator
        </button>
      </div>

      <div className="animate-fade-in">
        {creationMode === 'ai' ? (
          <div className={styles.glowBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className={styles.iconCircle}><Sparkles size={20} /></div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Build with AI</h3>
            </div>
            
            <textarea 
              className={styles.textarea}
              placeholder="E.g. Advanced Artificial Intelligence in Modern Education..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />

            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Suggestions:</span>
              <div className={styles.tags}>
                <span className={styles.tag} onClick={() => setTopic('Modern Web Architecture')}>Web Arch</span>
                <span className={styles.tag} onClick={() => setTopic('Practical Cybersecurity for Small Business')}>Cybersecurity</span>
                <span className={styles.tag} onClick={() => setTopic('Foundations of UX/UI Design')}>UI/UX Design</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1rem' }}>
              <label>
                <div style={{ marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Template</div>
                <select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value as 'bootcamp' | 'academic' | 'corporate' | 'exam')}
                  className={styles.textarea}
                  style={{ minHeight: 44, height: 44, padding: '0 0.8rem' }}
                >
                  <option value="bootcamp">Bootcamp</option>
                  <option value="academic">Academic</option>
                  <option value="corporate">Corporate</option>
                  <option value="exam">Exam Prep</option>
                </select>
              </label>

              <label>
                <div style={{ marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Level</div>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                  className={styles.textarea}
                  style={{ minHeight: 44, height: 44, padding: '0 0.8rem' }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>

              <label>
                <div style={{ marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Language</div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'ru' | 'kk')}
                  className={styles.textarea}
                  style={{ minHeight: 44, height: 44, padding: '0 0.8rem' }}
                >
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                  <option value="kk">Kazakh</option>
                </select>
              </label>

              <Input
                label="Target Audience"
                placeholder="E.g. first-year university students"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />

              <Input
                label="Course Goal"
                placeholder="E.g. prepare students to design AI-assisted lessons"
                value={courseGoal}
                onChange={(e) => setCourseGoal(e.target.value)}
              />

              <label>
                <div style={{ marginBottom: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Duration (weeks)</div>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Number(e.target.value) || 4)}
                  className={styles.textarea}
                  style={{ minHeight: 44, height: 44, padding: '0 0.8rem' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ border: '1px solid var(--border-glass)', borderRadius: 12, padding: '0.8rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Structure</div>
                <strong>{templateKey}</strong>
              </div>
              <div style={{ border: '1px solid var(--border-glass)', borderRadius: 12, padding: '0.8rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Audience</div>
                <strong>{targetAudience || 'General learners'}</strong>
              </div>
              <div style={{ border: '1px solid var(--border-glass)', borderRadius: 12, padding: '0.8rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Duration</div>
                <strong>{durationWeeks} weeks</strong>
              </div>
            </div>

            <Button 
              size="lg" 
              fullWidth 
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              icon={isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            >
              {isGenerating ? 'Generating Curriculum...' : 'Generate Course Structure'}
            </Button>
          </div>
        ) : (
          <div className={styles.glowBox}>
            <div className={styles.manualForm}>
              <div className={styles.inputGroup}>
                <Input 
                  label="Course Title"
                  placeholder="E.g. Complete JavaScript Mastery"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Course Description</label>
                <textarea 
                  className={styles.textarea}
                  style={{ height: '100px', minHeight: '100px' }}
                  placeholder="Describe your course goals and target audience..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                />
              </div>

              <div className={styles.lessonsSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Lessons Structure</h4>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{manualLessons.length} lessons added</span>
                </div>

                {manualLessons.map((lesson, idx) => (
                  <div key={idx} className={styles.lessonEntry}>
                    <div className={styles.lessonHeader}>
                      <span className={styles.lessonIndex}>#{idx + 1}</span>
                      <button className={styles.removeBtn} onClick={() => removeLesson(idx)} disabled={manualLessons.length === 1}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <input 
                      className={styles.lessonInput}
                      placeholder="Lesson Title (e.g. Introduction to Variables)"
                      value={lesson.title}
                      onChange={(e) => updateLesson(idx, 'title', e.target.value)}
                    />
                    <textarea 
                      className={styles.lessonTextarea}
                      placeholder="Lesson content or description..."
                      value={lesson.content}
                      onChange={(e) => updateLesson(idx, 'content', e.target.value)}
                    />
                  </div>
                ))}

                <button className={styles.addLessonBtn} onClick={addLesson}>
                  <Plus size={18} /> Add New Lesson
                </button>
              </div>

              <div className={styles.formActions}>
                <Button 
                  size="lg" 
                  fullWidth 
                  onClick={handleManualSave}
                  disabled={isSaving || !manualTitle.trim()}
                  icon={isSaving ? <Loader2 className="animate-spin" /> : <BookOpen size={18} />}
                >
                  {isSaving ? 'Creating Course...' : 'Create Course Now'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

