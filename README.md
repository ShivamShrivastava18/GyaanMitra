# GyaanMitra Quiz Platform

Link: https://gyaan-mitra-dta5fc.vercel.app

A comprehensive educational platform for teachers and students

## Overview

**GyaanMitra** ("Knowledge Friend" in Hindi) is an AI-powered educational platform designed to bridge the gap between teachers and students. The platform enables teachers to create customized quizzes, manage curriculum, and track student progress, while students can take quizzes, view their results, and manage their assignments.

---

## ✨ Features

### 👩‍🏫 For Teachers

- **Dashboard**: Comprehensive overview of classes, students, and curriculum
- **Quiz Generation**: AI-powered quiz creation from curriculum content
- **Curriculum Management**: Create, edit, and organize educational content
- **Student Management**: Add, remove, and monitor student progress
- **Multilingual Support**: Generate quizzes in multiple languages (Hindi, Marathi, Tamil, etc.)

### 👨‍🎓 For Students

- **Interactive Quizzes**: Take quizzes with immediate feedback and explanations
- **Progress Tracking**: View detailed results and performance analytics
- **Assignment Management**: Track and complete assigned work
- **Profile Management**: Update personal information and preferences

---

## 🛠 Tech Stack

- **Frontend**: [Next.js 14](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: Next.js API Routes, Firebase Cloud Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **AI Integration**: [Google Gemini API](https://deepmind.google/technologies/gemini/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/ShivamShrivastava18/gyaanmitra.git
cd gyaanmitra
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Firebase

- Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- Enable Authentication (Email/Password or others)
- Set up Firestore Database
- Enable Firebase Functions (if needed)
- Download your Firebase config and save it as `firebaseConfig.ts` inside the `lib/` directory

### 4. Create environment variables

Create a `.env.local` file and add:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run the development server

```bash
npm run dev
```

Now, open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Folder Structure

```
/app               # Next.js app directory (routes, pages)
/components        # Reusable UI components
/lib               # Utility functions, Firebase config, Gemini API helpers
/public            # Static assets
/styles            # Global styles
/firebase          # Firebase Functions (backend logic)
/types             # TypeScript interfaces and types
```

---

## 🧑‍🏫 Usage

### Teachers

- Log in and access the dashboard
- Upload curriculum or modules
- Generate quizzes in a selected language using Gemini AI
- Assign quizzes to students
- Monitor individual and class-wide performance

### Students

- Log in to view assigned quizzes
- Attempt quizzes and get feedback instantly
- View personal progress reports and performance graphs
- Manage profile and upcoming assignments

---

## 🔮 Future Scope

- ✅ Google Classroom Integration
- ✅ Adaptive quiz generation based on learning level
- ✅ Gamified experience with badges and leaderboards
- ✅ Offline quiz support (PWA)
- ✅ Voice-enabled quiz assistance (coming soon)

---


> Empowering educators. Enabling learners. One quiz at a time.
