import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles } from "lucide-react";
import styles from "./StudentCatalog.module.css";
import { Card, CardBody, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { authFetch } from "../lib/api";

interface Course {
  id: string;
  title: string;
  description?: string;
  teacher_name?: string;
  teacherId?: string;
  lessons?: Array<{ id: string; title: string; order: number }>;
  studentCount?: number;
  tags?: string[];
  progress?: number;
  teacher?: {
    name: string;
  };
  aiGenerated?: boolean;
}

interface User {
  id: string;
  email?: string;
  role?: string;
}

export const StudentCatalog = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollingMap, setEnrollingMap] = useState<Record<string, boolean>>({});
  const [enrolledMap, setEnrolledMap] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);

  useEffect(() => {
    const controller = new AbortController();
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    const query = new URLSearchParams({
      page: String(page),
      limit: String(pageSize),
    });

    if (searchQuery.trim()) {
      query.set("search", searchQuery.trim());
    }

    setIsLoading(true);
    fetch(`/api/courses?${query.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.courses) setCourses(data.courses);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError")
          console.error("Error fetching courses:", err);
      })
      .finally(() => setIsLoading(false));

    authFetch(`/api/student/courses/${parsedUser.id}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.courses) {
          const map: Record<string, boolean> = {};
          data.courses.forEach((c: Course) => {
            if (c.id) map[c.id] = true;
          });
          setEnrolledMap(map);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });

    return () => controller.abort();
  }, [navigate, page, pageSize, searchQuery]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    setEnrollingMap((prev) => ({ ...prev, [courseId]: true }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ course_id: courseId }),
      });

      if (res.ok) {
        setEnrolledMap((prev) => ({ ...prev, [courseId]: true }));
      }
    } catch (err) {
      console.error("Enrollment failed", err);
    } finally {
      setEnrollingMap((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (!user) return null;

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={`text-gradient ${styles.pageTitle}`}>
            Explore Knowledge
          </h1>
          <p className={styles.pageMeta}>
            Personalized AI-powered learning paths just for you.
          </p>
        </div>
        <div className={styles.searchContainer}>
          <div className={styles.searchIcon}>
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.trendingSection}>
        <h3 className={styles.sectionLabel}>Trending Topics</h3>
        <div className={styles.trendingList}>
          {[
            "Quantum Computing",
            "Digital Art",
            "Business AI",
            "Psychology",
            "Web3",
          ].map((topic, i) => (
            <div key={i} className={styles.trendingChip}>
              <Sparkles size={14} className={styles.chipIcon} />
              {topic}
            </div>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className={styles.statusText}>Loading catalog...</p>
      ) : filteredCourses.length === 0 ? (
        <p className={styles.statusText}>No courses available at the moment.</p>
      ) : (
        <div className={styles.courseGrid}>
          {filteredCourses.map((course) => (
            <Card key={course.id} interactive className={styles.courseCard}>
              <CardBody>
                <div className={styles.cardHeader}>
                  <div className={styles.badge}>
                    {course.aiGenerated ? "AI Path" : "Classic Path"}
                  </div>
                  <h3 className={styles.courseTitle}>{course.title}</h3>
                </div>
                <p className={styles.courseDesc}>
                  {course.description ||
                    "Dive into this curated curriculum and master new horizons with Cognify AI."}
                </p>

                {enrolledMap[course.id] && (
                  <div className={styles.progressArea}>
                    <div className={styles.progressInfo}>
                      <span>
                        {course.progress === 100 ? "Completed" : "Progress"}
                      </span>
                      <span>{course.progress || 0}%</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${course.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardBody>
              <CardFooter className={styles.cardFooter}>
                <div className={styles.teacherInfo}>
                  <div className={styles.avatarMini}>
                    {course.teacher?.name?.[0] ||
                      course.teacher_name?.[0] ||
                      "T"}
                  </div>
                  <span>
                    {course.teacher?.name || course.teacher_name || "Teacher"}
                  </span>
                </div>
                {enrolledMap[course.id] ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingMap[course.id]}
                  >
                    {enrollingMap[course.id] ? "Enrolling..." : "Enroll"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && courses.length > 0 && (
        <div className={styles.paginationWrap}>
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            size="sm"
          >
            Previous
          </Button>
          <span className={styles.paginationInfo}>
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages}
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};
