import { Router, Response } from 'express';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

function buildFallbackCourse(topic: string, templateKey?: string, level?: string, language = 'en', audience?: string, durationWeeks?: number, goal?: string) {
    const safeTopic = topic.trim() || 'AI Course';
    const safeLevel = level || 'intermediate';
    const templateLabel = templateKey ? `${templateKey} track` : 'guided track';

    return {
        title: `${safeTopic} Fundamentals`,
        description: `A locally generated ${templateLabel} course for ${safeLevel} learners.`,
        language,
        targetAudience: audience || `${safeLevel} learners`,
        estimatedWeeks: durationWeeks || 4,
        learningGoals: [
            `Understand the foundations of ${safeTopic}`,
            `Apply ${safeTopic} concepts in practical tasks`,
            `Complete a final review aligned with ${goal || 'course mastery'}`,
        ],
        lessons: [
            {
                title: `Introduction to ${safeTopic}`,
                content: `Overview, goals, and practical context for ${safeTopic}.`,
            },
            {
                title: `${safeTopic} Core Concepts`,
                content: `Key concepts, terminology, and examples for ${safeTopic}.`,
            },
            {
                title: `${safeTopic} Applied Practice`,
                content: `Hands-on exercises and short scenarios for ${safeTopic}.`,
            },
            {
                title: `${safeTopic} Review and Assessment`,
                content: `A recap with discussion prompts and assessment preparation.`,
            },
        ],
    };
}

function buildTutorFallback(action: string, lessonTitle: string, lessonContent: string, studentAnswer: string) {
    const snippet = lessonContent.slice(0, 180).trim();
    if (action === 'simplify') {
        return `In simple terms, "${lessonTitle}" means: ${snippet}. Focus on the main idea first, then connect it to one practical example.`;
    }
    if (action === 'example') {
        return `Example 1: apply "${lessonTitle}" in a classroom workflow. Example 2: use it in a short project or quiz activity.`;
    }
    if (action === 'check_answer') {
        return studentAnswer
            ? `Your answer is a solid start. Make it stronger by adding one concrete example and one short conclusion tied to "${lessonTitle}".`
            : `Write a short answer first, then I can help improve it with structure and examples.`;
    }
    return `Here is a helpful summary for "${lessonTitle}": ${snippet}`;
}

async function generateJsonWithGemini(prompt: string): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is missing in server environment variables.');
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
            },
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(`Gemini API Error: ${JSON.stringify(data)}`);
    }

    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    if (text.startsWith('```json')) {
        text = text.replace(/```json\n/, '').replace(/```\n?$/, '');
    } else if (text.startsWith('```')) {
        text = text.replace(/```\n/, '').replace(/```\n?$/, '');
    }
    return JSON.parse(text);
}

router.post('/generate-course', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { topic } = req.body;
        const teacherId = req.user!.id;

        if (!topic) {
            res.status(400).json({ error: 'Topic is required.' });
            return;
        }

        const prompt = `
You are an expert curriculum designer.
Generate strict JSON:
{
  "title": "Course title",
  "description": "2-3 sentence description",
  "lessons": [{"title":"Module title","content":"Detailed lesson content"}]
}
Topic: "${topic}"
Generate 4-6 lessons.
`;

        let parsedContent;
        try {
            parsedContent = await generateJsonWithGemini(prompt);
        } catch (error) {
            if (process.env.NODE_ENV === 'production') throw error;
            parsedContent = buildFallbackCourse(topic);
        }
        const course = await prisma.course.create({
            data: {
                title: parsedContent.title,
                description: parsedContent.description,
                aiGenerated: true,
                teacherId,
                lessons: {
                    create: parsedContent.lessons.map((lesson: any, index: number) => ({
                        title: lesson.title,
                        content: lesson.content,
                        order: index,
                    })),
                },
            },
            include: { lessons: true },
        });

        res.status(201).json({ course });
    } catch (error) {
        console.error('AI Course Generation Error:', error);
        res.status(500).json({ error: 'Internal server error during AI generation.' });
    }
});

router.post('/generate-from-template', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user!.id;
        const templateKey = String(req.body?.templateKey || '').trim();
        const topic = String(req.body?.topic || '').trim();
        const level = String(req.body?.level || 'intermediate').trim();
        const language = String(req.body?.language || 'en').trim();
        const targetAudience = String(req.body?.targetAudience || '').trim();
        const courseGoal = String(req.body?.courseGoal || '').trim();
        const durationWeeks = Math.max(1, Number(req.body?.durationWeeks || 4));

        if (!templateKey || !topic) {
            res.status(400).json({ error: 'templateKey and topic are required.' });
            return;
        }

        const templateHints: Record<string, string> = {
            bootcamp: 'Intensive practical bootcamp with projects and checkpoints.',
            academic: 'Academic structure with theory, references, and assessments.',
            corporate: 'Corporate upskilling with concise modules and practical tasks.',
            exam: 'Exam-prep style with progressive drills and revision blocks.',
        };
        const templateHint = templateHints[templateKey] || 'Balanced modern online course structure.';

        const prompt = `
You are building a course by template.
Template: ${templateKey} (${templateHint})
Topic: ${topic}
Level: ${level}
Language: ${language}
Target audience: ${targetAudience || 'general learners'}
Course goal: ${courseGoal || 'practical mastery'}
Duration: ${durationWeeks} weeks
Return strict JSON:
{
  "title":"...",
  "description":"...",
  "language":"...",
  "targetAudience":"...",
  "estimatedWeeks":4,
  "learningGoals":["...","...","..."],
  "lessons":[{"title":"...","content":"..."}]
}
Generate 5-8 lessons with clear progression.
`;
        let parsedContent;
        try {
            parsedContent = await generateJsonWithGemini(prompt);
        } catch (error) {
            if (process.env.NODE_ENV === 'production') throw error;
            parsedContent = buildFallbackCourse(topic, templateKey, level, language, targetAudience, durationWeeks, courseGoal);
        }

        const course = await prisma.course.create({
            data: {
                title: parsedContent.title,
                description: parsedContent.description,
                aiGenerated: true,
                templateKey,
                language: String(parsedContent.language || language || 'en'),
                targetAudience: parsedContent.targetAudience || targetAudience || null,
                estimatedWeeks: Number(parsedContent.estimatedWeeks || durationWeeks || 4),
                learningGoals: JSON.stringify(
                    Array.isArray(parsedContent.learningGoals)
                        ? parsedContent.learningGoals
                        : buildFallbackCourse(topic, templateKey, level, language, targetAudience, durationWeeks, courseGoal).learningGoals
                ),
                teacherId,
                lessons: {
                    create: parsedContent.lessons.map((lesson: any, index: number) => ({
                        title: lesson.title,
                        content: lesson.content,
                        order: index,
                    })),
                },
            },
            include: { lessons: true },
        });

        res.status(201).json({ course });
    } catch (error) {
        console.error('AI Template Generation Error:', error);
        res.status(500).json({ error: 'Internal server error during template generation.' });
    }
});

router.post('/tutor-assist', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const action = String(req.body?.action || '');
        const lessonTitle = String(req.body?.lessonTitle || '');
        const lessonContent = String(req.body?.lessonContent || '');
        const studentAnswer = String(req.body?.studentAnswer || '');

        if (!action || !lessonContent) {
            res.status(400).json({ error: 'action and lessonContent are required.' });
            return;
        }

        let instruction = '';
        if (action === 'simplify') {
            instruction = 'Explain this lesson in simpler terms, short and clear.';
        } else if (action === 'example') {
            instruction = 'Give 2 practical examples based on this lesson.';
        } else if (action === 'check_answer') {
            instruction = `Check this student answer and give constructive feedback. Student answer: "${studentAnswer}"`;
        } else {
            instruction = 'Provide helpful tutoring explanation.';
        }

        const prompt = `
You are a patient AI tutor.
Lesson title: ${lessonTitle}
Lesson content:
${lessonContent}

Task: ${instruction}
Return strict JSON:
{"result":"helpful response text"}
`;
        try {
            const json = await generateJsonWithGemini(prompt);
            res.json({ result: json.result || '' });
        } catch (error) {
            if (process.env.NODE_ENV === 'production') throw error;
            res.json({ result: buildTutorFallback(action, lessonTitle, lessonContent, studentAnswer) });
        }
    } catch (error) {
        console.error('AI Tutor error:', error);
        res.status(500).json({ error: 'Internal server error during tutor assist.' });
    }
});

export default router;
