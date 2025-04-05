import { db } from "@/lib/firebase"
import { doc, setDoc, collection, getDocs, query } from "firebase/firestore"
import type { Teacher, Student, Curriculum, Quiz } from "@/types"

// Mock data
const teachers: Teacher[] = [
  {
    id: "teacher1",
    name: "John Smith",
    email: "teacher@example.com",
    role: "teacher",
    profileImage: "/placeholder.svg?height=200&width=200",
    students: ["student1", "student2", "student3"],
    curriculums: ["curriculum1", "curriculum2"],
  },
  {
    id: "teacher2",
    name: "Jane Doe",
    email: "jane.doe@example.com",
    role: "teacher",
    profileImage: "/placeholder.svg?height=200&width=200",
    students: ["student4", "student5"],
    curriculums: ["curriculum3"],
  },
]

const students: Student[] = [
  {
    id: "student1",
    name: "Alice Johnson",
    email: "student@example.com",
    role: "student",
    profileImage: "/placeholder.svg?height=200&width=200",
    teacher: "teacher1",
    assignedQuizzes: ["quiz1", "quiz2"],
    completedQuizzes: {
      quiz1: {
        quizId: "quiz1",
        studentId: "student1",
        score: 4,
        totalQuestions: 5,
        answers: {
          q1: 0,
          q2: 1,
          q3: 2,
          q4: 3,
          q5: 1,
        },
        completedAt: new Date(),
      },
    },
  },
  {
    id: "student2",
    name: "Bob Williams",
    email: "bob.williams@example.com",
    role: "student",
    profileImage: "/placeholder.svg?height=200&width=200",
    teacher: "teacher1",
    assignedQuizzes: ["quiz1"],
    completedQuizzes: {},
  },
  {
    id: "student3",
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    role: "student",
    profileImage: "/placeholder.svg?height=200&width=200",
    teacher: "teacher1",
    assignedQuizzes: ["quiz2"],
    completedQuizzes: {},
  },
  {
    id: "student4",
    name: "Diana Miller",
    email: "diana.miller@example.com",
    role: "student",
    profileImage: "/placeholder.svg?height=200&width=200",
    teacher: "teacher2",
    assignedQuizzes: ["quiz3"],
    completedQuizzes: {},
  },
  {
    id: "student5",
    name: "Ethan Davis",
    email: "ethan.davis@example.com",
    role: "student",
    profileImage: "/placeholder.svg?height=200&width=200",
    teacher: "teacher2",
    assignedQuizzes: ["quiz3"],
    completedQuizzes: {},
  },
]

const curriculums: Curriculum[] = [
  {
    id: "curriculum1",
    teacherId: "teacher1",
    title: "Introduction to Computer Science",
    description: "A beginner's guide to computer science concepts",
    modules: [
      {
        id: "module1",
        title: "Programming Basics",
        description: "Introduction to programming concepts",
        topics: [
          {
            id: "topic1",
            title: "Variables and Data Types",
            description: "Understanding variables and different data types",
          },
          {
            id: "topic2",
            title: "Control Structures",
            description: "Loops and conditional statements",
          },
        ],
      },
      {
        id: "module2",
        title: "Data Structures",
        description: "Common data structures in programming",
        topics: [
          {
            id: "topic3",
            title: "Arrays and Lists",
            description: "Working with sequential data",
          },
          {
            id: "topic4",
            title: "Maps and Sets",
            description: "Key-value pairs and unique collections",
          },
        ],
      },
    ],
  },
  {
    id: "curriculum2",
    teacherId: "teacher1",
    title: "Web Development Fundamentals",
    description: "Learn the basics of web development",
    modules: [
      {
        id: "module3",
        title: "HTML & CSS",
        description: "Building blocks of web pages",
        topics: [
          {
            id: "topic5",
            title: "HTML Structure",
            description: "Creating the structure of web pages",
          },
          {
            id: "topic6",
            title: "CSS Styling",
            description: "Styling web pages with CSS",
          },
        ],
      },
      {
        id: "module4",
        title: "JavaScript Basics",
        description: "Introduction to JavaScript programming",
        topics: [
          {
            id: "topic7",
            title: "JavaScript Syntax",
            description: "Basic syntax and concepts",
          },
          {
            id: "topic8",
            title: "DOM Manipulation",
            description: "Interacting with the Document Object Model",
          },
        ],
      },
    ],
  },
  {
    id: "curriculum3",
    teacherId: "teacher2",
    title: "Mathematics for Computer Science",
    description: "Essential math concepts for computer science",
    modules: [
      {
        id: "module5",
        title: "Discrete Mathematics",
        description: "Mathematical structures for computer science",
        topics: [
          {
            id: "topic9",
            title: "Set Theory",
            description: "Understanding sets and operations",
          },
          {
            id: "topic10",
            title: "Graph Theory",
            description: "Graphs and their applications",
          },
        ],
      },
    ],
  },
]

const quizzes: Quiz[] = [
  {
    id: "quiz1",
    topicId: "topic1",
    title: "Variables and Data Types Quiz",
    description: "Test your knowledge of variables and data types",
    language: "English",
    questions: [
      {
        id: "q1",
        question: "Which of the following is not a primitive data type in JavaScript?",
        options: ["String", "Number", "Boolean", "Array"],
        correctAnswer: 3,
      },
      {
        id: "q2",
        question: "What is the result of typeof null in JavaScript?",
        options: ["null", "undefined", "object", "number"],
        correctAnswer: 2,
      },
      {
        id: "q3",
        question: "Which operator is used for strict equality comparison in JavaScript?",
        options: ["==", "===", "=", "!="],
        correctAnswer: 1,
      },
      {
        id: "q4",
        question: "What will be the output of console.log(10 + '20')?",
        options: ["30", "1020", "Error", "undefined"],
        correctAnswer: 1,
      },
      {
        id: "q5",
        question: "Which method is used to convert a string to an integer in JavaScript?",
        options: ["parseInt()", "parseFloat()", "toString()", "toFixed()"],
        correctAnswer: 0,
      },
    ],
    createdBy: "teacher1",
    assignedTo: ["student1", "student2"],
  },
  {
    id: "quiz2",
    topicId: "topic5",
    title: "HTML Structure Quiz",
    description: "Test your knowledge of HTML structure",
    language: "English",
    questions: [
      {
        id: "q6",
        question: "Which HTML tag is used to define an unordered list?",
        options: ["<ol>", "<ul>", "<li>", "<dl>"],
        correctAnswer: 1,
      },
      {
        id: "q7",
        question: "Which attribute is used to specify a unique identifier for an HTML element?",
        options: ["class", "name", "id", "src"],
        correctAnswer: 2,
      },
      {
        id: "q8",
        question: "Which HTML element is used to define the title of a document?",
        options: ["<meta>", "<head>", "<title>", "<header>"],
        correctAnswer: 2,
      },
      {
        id: "q9",
        question: "Which HTML tag is used to insert a line break?",
        options: ["<lb>", "<break>", "<br>", "<newline>"],
        correctAnswer: 2,
      },
      {
        id: "q10",
        question: "Which HTML element is used to define emphasized text?",
        options: ["<i>", "<em>", "<strong>", "<b>"],
        correctAnswer: 1,
      },
    ],
    createdBy: "teacher1",
    assignedTo: ["student1", "student3"],
  },
  {
    id: "quiz3",
    topicId: "topic9",
    title: "Set Theory Quiz",
    description: "Test your knowledge of set theory",
    language: "English",
    questions: [
      {
        id: "q11",
        question: "What is the symbol for the union of sets?",
        options: ["∩", "∪", "⊆", "⊂"],
        correctAnswer: 1,
      },
      {
        id: "q12",
        question: "What is the cardinality of the empty set?",
        options: ["0", "1", "Undefined", "Infinite"],
        correctAnswer: 0,
      },
      {
        id: "q13",
        question: "If A = {1, 2, 3} and B = {3, 4, 5}, what is A ∩ B?",
        options: ["{}", "{1, 2, 3, 4, 5}", "{3}", "{1, 2, 4, 5}"],
        correctAnswer: 2,
      },
      {
        id: "q14",
        question: "What is the power set of {a, b}?",
        options: ["{∅, {a}, {b}, {a, b}}", "{a, b}", "{∅, a, b, {a, b}}", "{a, b, {a, b}}"],
        correctAnswer: 0,
      },
      {
        id: "q15",
        question: "If A ⊆ B and B ⊆ A, then:",
        options: ["A = B", "A ≠ B", "A ∩ B = ∅", "A ∪ B = ∅"],
        correctAnswer: 0,
      },
    ],
    createdBy: "teacher2",
    assignedTo: ["student4", "student5"],
  },
]

// Seed function
export async function seedDatabase() {
  try {
    // Check if we already have users
    const usersQuery = query(collection(db, "users"))
    const usersSnapshot = await getDocs(usersQuery)

    if (!usersSnapshot.empty) {
      console.log("Database already has data, skipping seed")
      return { success: true }
    }

    // Add teachers
    for (const teacher of teachers) {
      await setDoc(doc(db, "users", teacher.id), teacher)
    }

    // Add students
    for (const student of students) {
      await setDoc(doc(db, "users", student.id), student)
    }

    // Add curriculums
    for (const curriculum of curriculums) {
      await setDoc(doc(db, "curriculums", curriculum.id), curriculum)
    }

    // Add quizzes
    for (const quiz of quizzes) {
      await setDoc(doc(db, "quizzes", quiz.id), quiz)
    }

    console.log("Database seeded successfully!")
    return { success: true }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, error }
  }
}

