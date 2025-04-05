import { seedDatabase } from "@/scripts/seed-database"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  addDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore"
import { db } from "./firebase"
import type { User, Teacher, Student, Curriculum, Quiz, QuizResult } from "@/types"

export async function seedInitialData() {
  try {
    const result = await seedDatabase()
    return { success: true, message: "Database seeded successfully!" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, message: "Failed to seed database", error }
  }
}

// User related functions
export async function getUser(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))
    return userDoc.exists() ? (userDoc.data() as User) : null
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersQuery = query(collection(db, "users"), where("email", "==", email))
    const usersSnapshot = await getDocs(usersQuery)

    if (usersSnapshot.empty) {
      return null
    }

    return { ...usersSnapshot.docs[0].data(), id: usersSnapshot.docs[0].id } as User
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

export async function createUser(user: Omit<User, "id">): Promise<User> {
  try {
    // Check if user with this email already exists
    const existingUser = await getUserByEmail(user.email)
    if (existingUser) {
      throw new Error("User with this email already exists")
    }

    const userRef = doc(collection(db, "users"))
    const newUser = {
      ...user,
      id: userRef.id,
      profileImage: `/placeholder.svg?height=200&width=200&text=${user.name.charAt(0)}`,
    }

    await setDoc(userRef, newUser)

    return newUser as User
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function createTeacher(teacher: Omit<Teacher, "id" | "students" | "curriculums">): Promise<Teacher> {
  try {
    const newTeacher = await createUser({
      ...teacher,
      role: "teacher",
    })

    // Add teacher-specific fields
    await updateDoc(doc(db, "users", newTeacher.id), {
      students: [],
      curriculums: [],
    })

    return {
      ...newTeacher,
      role: "teacher",
      students: [],
      curriculums: [],
    } as Teacher
  } catch (error) {
    console.error("Error creating teacher:", error)
    throw error
  }
}

export async function createStudent(
  student: Omit<Student, "id" | "assignedQuizzes" | "completedQuizzes">,
): Promise<Student> {
  try {
    const newStudent = await createUser({
      ...student,
      role: "student",
    })

    // Add student-specific fields
    await updateDoc(doc(db, "users", newStudent.id), {
      assignedQuizzes: [],
      completedQuizzes: {},
    })

    // Update teacher's students array
    const teacherRef = doc(db, "users", student.teacher)
    const teacherDoc = await getDoc(teacherRef)
    if (teacherDoc.exists()) {
      const teacher = teacherDoc.data() as Teacher
      await updateDoc(teacherRef, {
        students: [...(teacher.students || []), newStudent.id],
      })
    }

    return {
      ...newStudent,
      role: "student",
      assignedQuizzes: [],
      completedQuizzes: {},
    } as Student
  } catch (error) {
    console.error("Error creating student:", error)
    throw error
  }
}

export async function getTeacher(teacherId: string): Promise<Teacher | null> {
  try {
    const teacherDoc = await getDoc(doc(db, "users", teacherId))
    return teacherDoc.exists() && teacherDoc.data().role === "teacher"
      ? ({ ...teacherDoc.data(), id: teacherDoc.id } as Teacher)
      : null
  } catch (error) {
    console.error("Error getting teacher:", error)
    return null
  }
}

export async function getStudent(studentId: string): Promise<Student | null> {
  try {
    const studentDoc = await getDoc(doc(db, "users", studentId))
    return studentDoc.exists() && studentDoc.data().role === "student"
      ? ({ ...studentDoc.data(), id: studentDoc.id } as Student)
      : null
  } catch (error) {
    console.error("Error getting student:", error)
    return null
  }
}

export async function getTeacherStudents(teacherId: string): Promise<Student[]> {
  try {
    const studentsQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
      where("teacher", "==", teacherId),
    )
    const studentsSnapshot = await getDocs(studentsQuery)
    return studentsSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Student)
  } catch (error) {
    console.error("Error getting teacher students:", error)
    return []
  }
}

export async function getAllTeachers(): Promise<Teacher[]> {
  try {
    const teachersQuery = query(collection(db, "users"), where("role", "==", "teacher"))
    const teachersSnapshot = await getDocs(teachersQuery)
    return teachersSnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as Teacher)
  } catch (error) {
    console.error("Error getting all teachers:", error)
    return []
  }
}

// Curriculum related functions
export async function getTeacherCurriculums(teacherId: string): Promise<Curriculum[]> {
  try {
    const curriculumsQuery = query(collection(db, "curriculums"), where("teacherId", "==", teacherId))
    const curriculumsSnapshot = await getDocs(curriculumsQuery)
    return curriculumsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Curriculum,
    )
  } catch (error) {
    console.error("Error getting teacher curriculums:", error)
    return []
  }
}

export async function getCurriculum(curriculumId: string): Promise<Curriculum | null> {
  try {
    const curriculumDoc = await getDoc(doc(db, "curriculums", curriculumId))
    return curriculumDoc.exists()
      ? ({
          id: curriculumDoc.id,
          ...curriculumDoc.data(),
        } as Curriculum)
      : null
  } catch (error) {
    console.error("Error getting curriculum:", error)
    return null
  }
}

export async function createCurriculum(curriculum: Omit<Curriculum, "id">): Promise<string> {
  try {
    const curriculumRef = await addDoc(collection(db, "curriculums"), {
      ...curriculum,
      createdAt: serverTimestamp(),
    })

    // Update teacher's curriculums array
    const teacherRef = doc(db, "users", curriculum.teacherId)
    const teacherDoc = await getDoc(teacherRef)
    if (teacherDoc.exists()) {
      const teacher = teacherDoc.data() as Teacher
      await updateDoc(teacherRef, {
        curriculums: [...(teacher.curriculums || []), curriculumRef.id],
      })
    }

    return curriculumRef.id
  } catch (error) {
    console.error("Error creating curriculum:", error)
    throw error
  }
}

export async function updateCurriculum(curriculumId: string, updates: Partial<Curriculum>): Promise<void> {
  try {
    await updateDoc(doc(db, "curriculums", curriculumId), updates)
  } catch (error) {
    console.error("Error updating curriculum:", error)
    throw error
  }
}

// Quiz related functions
export async function createQuiz(quiz: Omit<Quiz, "id">): Promise<string> {
  try {
    const quizRef = await addDoc(collection(db, "quizzes"), {
      ...quiz,
      createdAt: serverTimestamp(),
    })

    // Update assigned students
    for (const studentId of quiz.assignedTo) {
      const studentRef = doc(db, "users", studentId)
      const studentDoc = await getDoc(studentRef)
      if (studentDoc.exists()) {
        const student = studentDoc.data() as Student
        await updateDoc(studentRef, {
          assignedQuizzes: arrayUnion(quizRef.id),
        })
      }
    }

    return quizRef.id
  } catch (error) {
    console.error("Error creating quiz:", error)
    throw error
  }
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
  try {
    const quizDoc = await getDoc(doc(db, "quizzes", quizId))
    return quizDoc.exists()
      ? ({
          id: quizDoc.id,
          ...quizDoc.data(),
        } as Quiz)
      : null
  } catch (error) {
    console.error("Error getting quiz:", error)
    return null
  }
}

export async function getStudentQuizzes(studentId: string): Promise<Quiz[]> {
  try {
    const studentDoc = await getDoc(doc(db, "users", studentId))
    if (!studentDoc.exists()) return []

    const student = studentDoc.data() as Student
    const quizzes: Quiz[] = []

    if (!student.assignedQuizzes || student.assignedQuizzes.length === 0) return []

    // Use Promise.all to fetch all quizzes in parallel
    const quizPromises = student.assignedQuizzes.map((quizId) => getQuiz(quizId))
    const fetchedQuizzes = await Promise.all(quizPromises)

    // Filter out any null results
    return fetchedQuizzes.filter((quiz) => quiz !== null) as Quiz[]
  } catch (error) {
    console.error("Error getting student quizzes:", error)
    return []
  }
}

export async function getTeacherQuizzes(teacherId: string): Promise<Quiz[]> {
  try {
    const quizzesQuery = query(collection(db, "quizzes"), where("createdBy", "==", teacherId))
    const quizzesSnapshot = await getDocs(quizzesQuery)
    return quizzesSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Quiz,
    )
  } catch (error) {
    console.error("Error getting teacher quizzes:", error)
    return []
  }
}

// Quiz results related functions
export async function submitQuizResult(result: Omit<QuizResult, "completedAt">): Promise<void> {
  try {
    // Add the result to the results collection
    const resultRef = await addDoc(collection(db, "results"), {
      ...result,
      completedAt: serverTimestamp(),
    })

    // Update student's completed quizzes
    const studentRef = doc(db, "users", result.studentId)
    const studentDoc = await getDoc(studentRef)
    if (studentDoc.exists()) {
      const student = studentDoc.data() as Student

      // Create the completedQuizzes object if it doesn't exist
      const completedQuizzes = student.completedQuizzes || {}

      // Add the new quiz result
      completedQuizzes[result.quizId] = {
        quizId: result.quizId,
        studentId: result.studentId,
        score: result.score,
        totalQuestions: result.totalQuestions,
        answers: result.answers,
        completedAt: new Date(),
      }

      // Update the student document
      await updateDoc(studentRef, {
        completedQuizzes: completedQuizzes,
      })
    }
  } catch (error) {
    console.error("Error submitting quiz result:", error)
    throw error
  }
}

export async function getStudentResults(studentId: string): Promise<QuizResult[]> {
  try {
    const resultsQuery = query(collection(db, "results"), where("studentId", "==", studentId))
    const resultsSnapshot = await getDocs(resultsQuery)
    return resultsSnapshot.docs.map((doc) => doc.data() as QuizResult)
  } catch (error) {
    console.error("Error getting student results:", error)
    return []
  }
}

export async function getQuizResults(quizId: string): Promise<QuizResult[]> {
  try {
    const resultsQuery = query(collection(db, "results"), where("quizId", "==", quizId))
    const resultsSnapshot = await getDocs(resultsQuery)
    return resultsSnapshot.docs.map((doc) => doc.data() as QuizResult)
  } catch (error) {
    console.error("Error getting quiz results:", error)
    return []
  }
}

