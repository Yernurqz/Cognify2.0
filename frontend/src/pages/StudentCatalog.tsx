import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Layers, CheckCircle } from "lucide-react";
import { Card, CardBody, CardTitle, CardFooter } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

export const StudentCatalog = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingMap, setEnrollingMap] = useState<Record<number, boolean>>({});
  const [enrolledMap, setEnrolledMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/auth");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch all courses
    fetch("http://localhost:5000/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (data.courses) setCourses(data.courses);
      })
      .catch((err) => console.error("Error fetching available courses:", err));

    // Fetch already enrolled courses to mark them
    fetch(`http://localhost:5000/api/student/courses/${parsedUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.courses) {
          const map: Record<number, boolean> = {};
          data.courses.forEach((c: any) => (map[c.id] = true));
          setEnrolledMap(map);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const handleEnroll = async (courseId: number) => {
    if (!user) return;
    setEnrollingMap((prev) => ({ ...prev, [courseId]: true }));

    try {
      const res = await fetch("http://localhost:5000/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: user.id, course_id: courseId }),
      });

      if (res.ok) {
        setEnrolledMap((prev) => ({ ...prev, [courseId]: true }));
      } else {
        const data = await res.json();
        if (data.error === "Already enrolled.") {
          setEnrolledMap((prev) => ({ ...prev, [courseId]: true }));
        }
      }
    } catch (err) {
      console.error("Enrollment failed", err);
    } finally {
      setEnrollingMap((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (!user) return null;

  return (
    <div>
      <div
        className="flex justify-between items-center mb-6"
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            className="text-gradient"
            style={{ fontSize: "2rem", marginBottom: "0.25rem" }}
          >
            Course Catalog
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Discover new skills and add them to your learning journey.
          </p>
        </div>
        <div style={{ position: "relative", width: "300px" }}>
          <input
            type="text"
            placeholder="Search courses..."
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              borderRadius: "999px",
              border: "1px solid var(--border-glass)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
        </div>
      </div>

      {isLoading ? (
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          Loading catalog...
        </p>
      ) : courses.length === 0 ? (
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
          No courses available at the moment.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {courses.map((course) => (
            <Card key={course.id} interactive>
              <div
                style={{
                  width: "100%",
                  height: "140px",
                  background:
                    "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))",
                  borderBottom: "1px solid var(--border-glass)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--primary)",
                }}
              >
                <Layers size={48} />
              </div>
              <CardBody>
                <CardTitle>{course.title}</CardTitle>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <BookOpen size={14} /> {course.teacher}
                </div>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    marginTop: "1rem",
                    fontSize: "0.875rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {course.duration}
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  {course.tags &&
                    course.tags.map((tag: string, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                          background: "var(--bg-surface)",
                          borderRadius: "999px",
                          border: "1px solid var(--border-glass)",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </CardBody>
              <CardFooter>
                {enrolledMap[course.id] ? (
                  <Button
                    fullWidth
                    variant="secondary"
                    icon={<CheckCircle size={18} />}
                    disabled
                  >
                    Enrolled
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrollingMap[course.id]}
                  >
                    {enrollingMap[course.id] ? "Enrolling..." : "Enroll Now"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
