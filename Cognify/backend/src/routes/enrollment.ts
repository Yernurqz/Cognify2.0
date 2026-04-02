import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, authMiddleware, requireSelfOrRole } from '../middleware/auth';

const router = Router();

// POST /api/enroll — enroll student in a course
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const { course_id } = req.body;

        if (!course_id) {
            res.status(400).json({ error: 'course_id is required.' });
            return;
        }

        const course = await prisma.course.findUnique({ where: { id: course_id } });
        if (!course) {
            res.status(404).json({ error: 'Course not found.' });
            return;
        }

        const existing = await prisma.enrollment.findUnique({
            where: { studentId_courseId: { studentId, courseId: course_id } },
        });
        if (existing) {
            res.status(409).json({ error: 'Already enrolled.' });
            return;
        }

        const enrollment = await prisma.enrollment.create({
            data: { studentId, courseId: course_id },
        });

        res.status(201).json({ enrollment });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/student/courses/:studentId — get student's enrolled courses (pagination)
router.get('/courses/:studentId', authMiddleware, requireSelfOrRole('studentId', 'TEACHER', 'ADMIN'), async (req, res: Response) => {
    try {
        const studentId = req.params.studentId as string;
        const page = Math.max(Number(req.query.page || 1), 1);
        const limit = Math.min(Math.max(Number(req.query.limit || 20), 5), 100);
        const offset = (page - 1) * limit;

        const [total, enrollments] = await Promise.all([
            prisma.enrollment.count({ where: { studentId } }),
            prisma.enrollment.findMany({
                where: { studentId },
                include: {
                    course: {
                        include: {
                            teacher: { select: { id: true, name: true, email: true } },
                            lessons: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } },
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
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
            courses: enrollments.map((e: any) => ({
                id: e.course.id,
                title: e.course.title,
                description: e.course.description,
                teacher_name: e.course.teacher.name || e.course.teacher.email,
                lessons: e.course.lessons,
                enrolledAt: e.enrolledAt,
            })),
        });
    } catch (error) {
        console.error('Fetch student courses error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// DELETE /api/enroll/:courseId — unenroll
router.delete('/:courseId', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.id;
        const courseId = req.params.courseId as string;

        await prisma.enrollment.delete({
            where: { studentId_courseId: { studentId, courseId } },
        });

        res.json({ message: 'Successfully unenrolled.' });
    } catch (error) {
        console.error('Unenroll error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

export default router;
