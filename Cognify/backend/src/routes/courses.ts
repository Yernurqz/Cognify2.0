import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, authMiddleware, requireRole } from '../middleware/auth';

const router = Router();


// GET /api/courses — all courses (public, with pagination/search)
router.get('/', async (req, res: Response) => {
    console.log('Courses route called with query:', req.query);
    try {
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 5), 100);
        const search = String(req.query.search || '').trim();
        const teacherId = String(req.query.teacherId || '').trim();

        const offset = (page - 1) * limit;
        const where: any = {};
        if (teacherId) {
            where.teacherId = teacherId;
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { teacher: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        const [total, courses] = await Promise.all([
            prisma.course.count({ where }),
            prisma.course.findMany({
                where,
                include: {
                    teacher: { select: { id: true, name: true } },
                    lessons: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
                    _count: { select: { enrollments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
        ]);

        const response = {
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            courses: courses.map((c: any) => ({
                id: c.id,
                title: c.title,
                description: c.description,
                aiGenerated: c.aiGenerated,
                teacher_name: c.teacher.name || 'Unknown Teacher',
                teacherId: c.teacher.id,
                lessons: c.lessons,
                studentCount: c._count.enrollments,
                createdAt: c.createdAt,
            })),
        };

        res.json(response);
    } catch (error) {
        console.error('Fetch courses error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/courses/:id — course details
router.get('/:id', async (req, res: Response) => {
    try {
        const courseId = req.params.id as string;
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: { select: { id: true, name: true, email: true } },
                lessons: { orderBy: { order: 'asc' } },
                _count: { select: { enrollments: true } },
            },
        });

        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }

        res.json({ course });
    } catch (error) {
        console.error('Fetch course error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST /api/courses — create course (teacher only)
router.post('/', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, lessons, language, targetAudience, estimatedWeeks, learningGoals } = req.body;

        if (!title) {
            res.status(400).json({ error: 'Course title is required.' });
            return;
        }

        const course = await prisma.course.create({
            data: {
                title,
                description: description || null,
                language: String(language || 'en'),
                targetAudience: targetAudience || null,
                estimatedWeeks: typeof estimatedWeeks === 'number' ? estimatedWeeks : null,
                learningGoals: Array.isArray(learningGoals) ? JSON.stringify(learningGoals) : learningGoals || null,
                teacherId: req.user!.id,
                lessons: lessons?.length
                    ? {
                          create: lessons.map((l: { title: string; content?: string }, index: number) => ({
                              title: l.title,
                              content: l.content || null,
                              order: index,
                          })),
                      }
                    : undefined,
            },
            include: { lessons: true },
        });

        res.status(201).json({ course });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/courses/:id — update course (owner teacher only)
router.put('/:id', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.id as string;
        const existing = await prisma.course.findUnique({ where: { id: courseId } });
        if (!existing) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        if (existing.teacherId !== req.user!.id && req.user!.role !== 'ADMIN') {
            res.status(403).json({ error: 'You can only edit your own courses.' });
            return;
        }

        const { title, description } = req.body;
        const course = await prisma.course.update({
            where: { id: courseId },
            data: { title, description },
            include: { lessons: true },
        });

        res.json({ course });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/courses/:id — delete course (owner teacher only)
router.delete('/:id', authMiddleware, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.id as string;
        const existing = await prisma.course.findUnique({ where: { id: courseId } });
        if (!existing) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }
        if (existing.teacherId !== req.user!.id && req.user!.role !== 'ADMIN') {
            res.status(403).json({ error: 'You can only delete your own courses.' });
            return;
        }

        await prisma.course.delete({ where: { id: courseId } });
        res.json({ message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/courses/teacher/:teacherId — courses by teacher (pagination)
router.get('/teacher/:teacherId', async (req, res: Response) => {
    try {
        const teacherId = req.params.teacherId as string;
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 5), 100);
        const offset = (page - 1) * limit;

        const [total, courses] = await Promise.all([
            prisma.course.count({ where: { teacherId } }),
            prisma.course.findMany({
                where: { teacherId },
                include: {
                    lessons: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
                    _count: { select: { enrollments: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: offset,
                take: limit,
            }),
        ]);

        res.json({
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            courses,
        });
    } catch (error) {
        console.error('Fetch teacher courses error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
