import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { authFetch } from '../lib/api';
import styles from './CourseView.module.css';

interface Lesson {
  id: string;
  title: string;
  content: string | null;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  aiGenerated: boolean;
  teacher: {
    name: string | null;
    email: string;
  };
  lessons: Lesson[];
}

interface StoredUser {
  id: string;
  role: string;
}

interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  answer: string;
}

interface MediaAsset {
  id: string;
  kind: string;
  publicUrl: string;
  createdAt: string;
}

interface SubtitleTrack {
  id: string;
  mediaAssetId: string;
  language: string;
  vttContent: string;
  createdAt: string;
}

interface AdaptiveQuestion {
  prompt: string;
  options: string[];
  expected: string;
  weakLessons: string[];
}

export const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [marking, setMarking] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);
  const [certificateIssued, setCertificateIssued] = useState(false);
  const [certificateCode, setCertificateCode] = useState<string | null>(null);
  const [teacherAverage, setTeacherAverage] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [focusMode, setFocusMode] = useState(false);
  const [quizHint, setQuizHint] = useState<string | null>(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorReply, setTutorReply] = useState('');
  const [studentDraftAnswer, setStudentDraftAnswer] = useState('');
  const [chatText, setChatText] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    content: string;
    pinned: boolean;
    hidden?: boolean;
    user: { name?: string; nickname?: string; role?: string };
  }>>([]);
  const [issuingCertificate, setIssuingCertificate] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [generatingSubtitles, setGeneratingSubtitles] = useState(false);

  const [adaptiveQuestion, setAdaptiveQuestion] = useState<AdaptiveQuestion | null>(null);
  const [adaptiveAnswer, setAdaptiveAnswer] = useState('');
  const [adaptiveResult, setAdaptiveResult] = useState<string>('');

  const progressRef = useRef<HTMLDivElement | null>(null);

  const activeLesson = course?.lessons?.find((lesson) => lesson.id === activeLessonId) || null;
  const isTeacherOrAdmin = user?.role?.toUpperCase() === 'TEACHER' || user?.role?.toUpperCase() === 'ADMIN';
  const selectedTrack = subtitleTracks.find((track) => track.id === selectedTrackId) || subtitleTracks[0] || null;
  const latestVideo = mediaAssets.find((asset) => asset.kind === 'video') || null;

  const quizQuestions = useMemo<QuizQuestion[]>(() => {
    if (!course?.lessons?.length) return [];
    return course.lessons.slice(0, 5).map((lesson) => {
      const distractors = ['Machine Ethics', 'Quantum History', 'Advanced Farming'];
      const options = [lesson.title, ...distractors].sort(() => Math.random() - 0.5);
      return {
        id: lesson.id,
        prompt: `Which module belongs to course "${course.title}"?`,
        options,
        answer: lesson.title,
      };
    });
  }, [course]);

  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.width = `${progressPercent}%`;
    }
  }, [progressPercent]);

  useEffect(() => {
    setTranscript('');
    setTutorReply('');
  }, [activeLessonId]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser) as StoredUser);
    }
  }, []);

  const loadMediaAndSubtitles = async (courseId: string) => {
    const [mediaRes, subtitlesRes] = await Promise.all([
      authFetch(`/api/media/course/${courseId}`),
      authFetch(`/api/subtitles/course/${courseId}`),
    ]);

    if (mediaRes.ok) {
      const data = await mediaRes.json();
      const assets = (data.assets || []) as MediaAsset[];
      setMediaAssets(assets);
    }

    if (subtitlesRes.ok) {
      const data = await subtitlesRes.json();
      const tracks = (data.tracks || []) as SubtitleTrack[];
      setSubtitleTracks(tracks);
      if (tracks.length) {
        setSelectedTrackId(tracks[0].id);
      }
    }
  };

  useEffect(() => {
    const loadCourse = async () => {
      if (!id) return;
      try {
        const courseRes = await fetch(`/api/courses/${id}`);
        const courseData = await courseRes.json();
        if (!courseData.course) return;

        setCourse(courseData.course);
        if (courseData.course.lessons?.length > 0) {
          setActiveLessonId(courseData.course.lessons[0].id);
        }

        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser) as StoredUser;
          const progressRes = await authFetch(`/api/progress/student/${parsedUser.id}/course/${id}`);
          if (progressRes.ok) {
            const progressData = await progressRes.json();
            setCompletedIds(progressData.completedIds || []);
            setProgressPercent(progressData.progressPercent || 0);
          }

          const [assessmentRes, gradeRes] = await Promise.all([
            authFetch(`/api/assessments/student/${parsedUser.id}/course/${id}`),
            authFetch(`/api/grades/student/${parsedUser.id}/course/${id}`),
          ]);
          if (assessmentRes.ok) {
            const assessmentData = await assessmentRes.json();
            if (assessmentData.assessment) {
              setAssessmentScore(assessmentData.assessment.score);
              setCertificateIssued(Boolean(assessmentData.assessment.certificateIssued));
              setCertificateCode(assessmentData.assessment.certificateCode || null);
            }
          }
          if (gradeRes.ok) {
            const gradeData = await gradeRes.json();
            setTeacherAverage(gradeData.averageScore ?? null);
          }
        }

        await loadMediaAndSubtitles(id);
      } catch (err) {
        console.error('Error fetching course data', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCourse();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    authFetch(`/api/chat/course/${id}`)
      .then((res) => res.json())
      .then((data) => setChatMessages(data.messages || []))
      .catch((error) => console.error(error));
  }, [id]);

  const handleMarkCompleted = async (lessonId: string) => {
    if (!course || completedIds.includes(lessonId)) return;

    setMarking(true);
    try {
      const res = await authFetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setCompletedIds((prev) => {
        const next = [...prev, lessonId];
        setProgressPercent(Math.round((next.length / course.lessons.length) * 100));
        return next;
      });
      if (data.gamification) {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const parsed = JSON.parse(rawUser) as Record<string, unknown>;
          parsed.xp = data.gamification.xp;
          parsed.streakDays = data.gamification.streakDays;
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }
    } finally {
      setMarking(false);
    }
  };

  const loadAdaptiveQuestion = async () => {
    if (!id) return;
    const res = await authFetch(`/api/assessments/adaptive-question/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setAdaptiveQuestion(data.question || null);
    setAdaptiveResult('');
    setAdaptiveAnswer('');
  };

  const submitAdaptiveAnswer = async () => {
    if (!id || !adaptiveQuestion || !adaptiveAnswer) return;
    const res = await authFetch(`/api/assessments/adaptive-answer/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer: adaptiveAnswer,
        expected: adaptiveQuestion.expected,
        weakLessons: adaptiveQuestion.weakLessons,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setAdaptiveResult(data.correct ? 'Correct. Great progress.' : 'Incorrect. Keep practicing this weak topic.');
    await loadAdaptiveQuestion();
  };

  const submitQuiz = async () => {
    if (!course || !user) return;
    const answered = quizQuestions.filter((question) => answers[question.id]);
    if (!answered.length) return;

    const correct = answered.filter((question) => answers[question.id] === question.answer).length;
    const weakLessons = answered
      .filter((question) => answers[question.id] !== question.answer)
      .map((question) => question.answer);
    const score = Math.round((correct / quizQuestions.length) * 100);

    setAssessmentScore(score);
    setQuizHint(
      score < 50
        ? 'Adaptive mode is now ready. Train weak topics and retry.'
        : 'Great result. You can continue with advanced modules.'
    );

    const res = await authFetch('/api/assessments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id, score, weakLessons }),
    });

    if (res.ok) {
      const data = await res.json();
      setCertificateIssued(Boolean(data.assessment?.certificateIssued));
      setCertificateCode(data.assessment?.certificateCode || null);
      await loadAdaptiveQuestion();
    }
  };

  const askTutor = async (action: 'simplify' | 'example' | 'check_answer') => {
    if (!activeLesson) return;
    setTutorLoading(true);
    try {
      const res = await authFetch('/api/ai/tutor-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          lessonTitle: activeLesson.title,
          lessonContent: activeLesson.content,
          studentAnswer: studentDraftAnswer,
        }),
      });
      const data = await res.json();
      setTutorReply(data.result || 'No response');
    } finally {
      setTutorLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatText.trim() || !id) return;
    const res = await authFetch(`/api/chat/course/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: chatText.trim() }),
    });

    if (res.ok) {
      const data = await res.json();
      setChatMessages((prev) => [...prev, data.message]);
      setChatText('');
    }
  };

  const uploadCourseVideo = async () => {
    if (!id || !videoFile) return;
    setUploadingVideo(true);
    try {
      const form = new FormData();
      form.append('file', videoFile);
      const res = await authFetch(`/api/media/course/${id}/video`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        setVideoFile(null);
        await loadMediaAndSubtitles(id);
      }
    } finally {
      setUploadingVideo(false);
    }
  };

  const generateSubtitles = async () => {
    if (!latestVideo) return;
    setGeneratingSubtitles(true);
    try {
      const res = await authFetch(`/api/subtitles/generate/${latestVideo.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'ru' }),
      });
      if (res.ok && id) {
        await loadMediaAndSubtitles(id);
      }
    } finally {
      setGeneratingSubtitles(false);
    }
  };

  const issueCertificate = async () => {
    if (!id) return;
    setIssuingCertificate(true);
    try {
      const res = await authFetch(`/api/assessments/issue-on-completion/${id}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.certificate?.code) {
          setCertificateCode(data.certificate.code);
          setCertificateIssued(true);
        }
      }
    } finally {
      setIssuingCertificate(false);
    }
  };

  const speakLesson = () => {
    if (!activeLesson?.content || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(activeLesson.content);
    utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const makeTranscript = () => {
    if (!activeLesson?.content) return;
    const sentences = activeLesson.content
      .split(/[.!?]\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12);
    const lines = sentences.map((s, i) => {
      const min = String(Math.floor((i * 12) / 60)).padStart(2, '0');
      const sec = String((i * 12) % 60).padStart(2, '0');
      return `[${min}:${sec}] ${s}`;
    });
    setTranscript(lines.join('\n'));
  };

  const togglePinMessage = async (messageId: string) => {
    const res = await authFetch(`/api/chat/message/${messageId}/pin`, { method: 'POST' });
    if (res.ok && id) {
      const reload = await authFetch(`/api/chat/course/${id}`);
      if (reload.ok) {
        const data = await reload.json();
        setChatMessages(data.messages || []);
      }
    }
  };

  const hideMessage = async (messageId: string) => {
    const res = await authFetch(`/api/chat/message/${messageId}/moderate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hide: true }),
    });
    if (res.ok && id) {
      const reload = await authFetch(`/api/chat/course/${id}`);
      if (reload.ok) {
        const data = await reload.json();
        setChatMessages(data.messages || []);
      }
    }
  };

  const renderText = (text: string | null) => {
    if (!text) return null;
    return text.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>);
  };

  if (isLoading) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className="animate-spin text-primary" size={48} />
        <h2 className="mt-4 text-xl font-semibold">Loading course...</h2>
      </div>
    );
  }

  if (!course) {
    return (
      <div className={styles.loaderContainer}>
        <h2 className="text-2xl font-bold mb-4">Course not found.</h2>
        <Button onClick={() => navigate(-1)} icon={<ArrowLeft size={18} />}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.container} style={focusMode ? { gridTemplateColumns: '1fr' } : undefined}>
      {!focusMode && (
        <div className={styles.sidebar}>
          <div className={styles.lessonSummary}>
            <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </div>
          <h3 className={styles.lessonTitleHeading}>Course Content</h3>
          {course.lessons.map((lesson, index) => {
            const completed = completedIds.includes(lesson.id);
            return (
              <div key={lesson.id} className={styles.lessonItem}>
                <button
                  className={`${styles.lessonBtn} ${activeLessonId === lesson.id ? styles.active : ''}`}
                  onClick={() => setActiveLessonId(lesson.id)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-primary font-bold">MODULE {index + 1}</span>
                    <span className={styles.lessonTitle}>{lesson.title}</span>
                  </div>
                  <div className={styles.icon}>{completed ? <CheckCircle size={18} /> : <BookOpen size={18} />}</div>
                </button>
                {activeLessonId === lesson.id && !completed && user?.role?.toUpperCase() === 'STUDENT' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className={styles.markButton}
                    disabled={marking}
                    onClick={() => handleMarkCompleted(lesson.id)}
                  >
                    {marking ? 'Marking...' : 'Mark as Completed'}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.mainContent}>
        <div className={styles.contentCard}>
          <div className={styles.courseHeader}>
            <div className="flex gap-2 mb-2 text-primary font-bold text-sm">
              <span>By {course.teacher?.name || course.teacher?.email}</span>
              <span className="opacity-50">-</span>
              <span>{course.lessons.length} Modules</span>
            </div>
            <h1 className={styles.courseTitle}>{course.title}</h1>
            <p className={styles.courseDescription}>{course.description}</p>
            <div style={{ marginTop: '0.5rem' }}>
              <Button size="sm" variant="secondary" onClick={() => setFocusMode((prev) => !prev)}>
                {focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
              </Button>
            </div>

            <div className={styles.progressContainer}>
              <div className="text-sm font-semibold text-primary">Progress: {progressPercent}%</div>
              <div className={styles.progressBarOuter}>
                <div className={styles.progressBarInner} ref={progressRef}></div>
              </div>
            </div>
            {teacherAverage !== null && (
              <p style={{ marginTop: '0.5rem', color: teacherAverage < 50 ? '#f43f5e' : 'var(--success)' }}>
                Teacher grade average: {teacherAverage}%
              </p>
            )}
          </div>

          {latestVideo && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ marginBottom: '0.55rem' }}>Lesson Video</h3>
              <video controls src={latestVideo.publicUrl} style={{ width: '100%', borderRadius: 12, border: '1px solid var(--border-glass)' }}>
                {selectedTrack && (
                  <track
                    kind="subtitles"
                    srcLang={selectedTrack.language}
                    label={`Subtitles (${selectedTrack.language.toUpperCase()})`}
                    default
                    src={`data:text/vtt;charset=utf-8,${encodeURIComponent(selectedTrack.vttContent)}`}
                  />
                )}
              </video>
              {subtitleTracks.length > 0 && (
                <div style={{ marginTop: '0.55rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subtitles:</span>
                  <select
                    value={selectedTrackId || subtitleTracks[0].id}
                    onChange={(event) => setSelectedTrackId(event.target.value)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-glass)',
                      color: 'var(--text-primary)',
                      borderRadius: 8,
                      padding: '0.35rem 0.5rem',
                    }}
                  >
                    {subtitleTracks.map((track) => (
                      <option key={track.id} value={track.id}>
                        {track.language.toUpperCase()} ({new Date(track.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {isTeacherOrAdmin && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', border: '1px solid var(--border-glass)', borderRadius: 10 }}>
              <h3 style={{ marginBottom: '0.55rem' }}>Teacher Tools</h3>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] || null)} />
                <Button size="sm" onClick={uploadCourseVideo} disabled={!videoFile || uploadingVideo}>
                  {uploadingVideo ? 'Uploading...' : 'Upload video'}
                </Button>
                <Button size="sm" variant="secondary" onClick={generateSubtitles} disabled={!latestVideo || generatingSubtitles}>
                  {generatingSubtitles ? 'Generating...' : 'Generate subtitles (VTT)'}
                </Button>
              </div>
            </div>
          )}

          <div className={styles.lessonContentArea}>
            {activeLesson ? (
              <div className="animate-fade-in">
                <h2>{activeLesson.title}</h2>
                <div className={styles.lessonText}>{renderText(activeLesson.content)}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                  <Button size="sm" variant="secondary" onClick={speakLesson}>
                    Voice: Read Aloud
                  </Button>
                  <Button size="sm" variant="secondary" onClick={makeTranscript}>
                    Auto Transcript
                  </Button>
                </div>
                {transcript && (
                  <pre
                    style={{
                      marginTop: '0.6rem',
                      whiteSpace: 'pre-wrap',
                      background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 10,
                      padding: '0.6rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {transcript}
                  </pre>
                )}
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
                  <h3 style={{ marginBottom: '0.65rem' }}>AI Tutor</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Button size="sm" variant="secondary" onClick={() => askTutor('simplify')} disabled={tutorLoading}>
                      Explain simpler
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => askTutor('example')} disabled={tutorLoading}>
                      Give example
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => askTutor('check_answer')} disabled={tutorLoading}>
                      Check my answer
                    </Button>
                  </div>
                  <textarea
                    value={studentDraftAnswer}
                    onChange={(e) => setStudentDraftAnswer(e.target.value)}
                    placeholder="Write your answer draft for AI feedback..."
                    style={{
                      width: '100%',
                      minHeight: 88,
                      marginTop: '0.6rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      padding: '0.6rem',
                    }}
                  />
                  {tutorReply && <div style={{ marginTop: '0.55rem', color: 'var(--text-secondary)' }}>{tutorReply}</div>}
                </div>
              </div>
            ) : (
              <p>Select a lesson from the sidebar.</p>
            )}
          </div>

          {user?.role?.toUpperCase() === 'STUDENT' && progressPercent >= 100 && quizQuestions.length > 0 && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.75rem' }}>Final Test</h3>
              {quizQuestions.map((question, index) => (
                <div key={question.id} style={{ marginBottom: '0.9rem' }}>
                  <div style={{ marginBottom: '0.45rem' }}>
                    {index + 1}. {question.prompt}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
                        style={{
                          border: '1px solid var(--border-glass)',
                          background: answers[question.id] === option ? 'var(--primary)' : 'var(--bg-surface)',
                          color: answers[question.id] === option ? '#fff' : 'var(--text-primary)',
                          borderRadius: 8,
                          padding: '0.45rem 0.65rem',
                          cursor: 'pointer',
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <Button onClick={submitQuiz}>Submit Test</Button>
              {assessmentScore !== null && (
                <p style={{ marginTop: '0.75rem' }}>
                  Test score: <strong>{assessmentScore}%</strong>
                </p>
              )}
              {quizHint && <p style={{ marginTop: '0.4rem', color: 'var(--text-secondary)' }}>{quizHint}</p>}

              {adaptiveQuestion && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.8rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Adaptive Question</h4>
                  <p style={{ marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>{adaptiveQuestion.prompt}</p>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {adaptiveQuestion.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => setAdaptiveAnswer(option)}
                        style={{
                          border: '1px solid var(--border-glass)',
                          background: adaptiveAnswer === option ? 'var(--primary)' : 'var(--bg-surface)',
                          color: adaptiveAnswer === option ? '#fff' : 'var(--text-primary)',
                          borderRadius: 8,
                          padding: '0.4rem 0.6rem',
                          cursor: 'pointer',
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  <div style={{ marginTop: '0.55rem' }}>
                    <Button size="sm" variant="secondary" onClick={submitAdaptiveAnswer} disabled={!adaptiveAnswer}>
                      Check adaptive answer
                    </Button>
                  </div>
                  {adaptiveResult && <p style={{ marginTop: '0.45rem', color: 'var(--text-secondary)' }}>{adaptiveResult}</p>}
                </div>
              )}

              {certificateIssued && (
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)' }}>
                  <Award size={18} />
                  <span>
                    Certificate granted for this AI-generated course{certificateCode ? ` (code: ${certificateCode})` : ''}.
                  </span>
                </div>
              )}

              {certificateCode && (
                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Button size="sm" variant="secondary" onClick={() => window.open(`/api/assessments/certificate/${certificateCode}/pdf`, '_blank')}>
                    Download PDF Certificate
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => navigate(`/verify/${certificateCode}`)}>
                    Verify Certificate
                  </Button>
                </div>
              )}

              {!certificateIssued && progressPercent >= 100 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <Button onClick={issueCertificate} disabled={issuingCertificate}>
                    {issuingCertificate ? 'Issuing...' : 'Generate Certificate'}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
            <h3 style={{ marginBottom: '0.65rem' }}>Course Chat</h3>
            <div style={{ display: 'grid', gap: '0.5rem', maxHeight: 220, overflow: 'auto', marginBottom: '0.7rem' }}>
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    padding: '0.5rem 0.65rem',
                    borderRadius: 10,
                    background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {message.user?.nickname || message.user?.name || 'User'}{message.pinned ? ' - pinned' : ''}
                  </div>
                  <div>{message.content}</div>
                  {(user?.role?.toUpperCase() === 'TEACHER' || user?.role?.toUpperCase() === 'ADMIN') && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <Button size="sm" variant="secondary" onClick={() => togglePinMessage(message.id)}>
                        {message.pinned ? 'Unpin' : 'Pin'}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => hideMessage(message.id)}>
                        Hide
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Ask a question about this course..."
                style={{
                  flex: 1,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 10,
                  color: 'var(--text-primary)',
                  padding: '0.55rem 0.65rem',
                }}
              />
              <Button onClick={sendChat} size="sm">
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
