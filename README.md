# CBT Dashboard

Admin and Teacher web dashboard for the Computer-Based Test (CBT) application, built with Next.js 16 and Tailwind CSS v4.

## Features

### Admin Panel
- **Dashboard** — User statistics, recent activity logs, active users (last 24 hours)
- **User Management** — CRUD admin/teacher/student, batch import, toggle active/inactive
- **User Detail** — Full profile, role management, Super Admin protection
- **Exam Activity Monitoring** — Real-time exam status (not started, in progress, completed)
- **Block/Unblock Participants** — Block cheating students, generate unlock codes
- **Activity Logs** — Login history, exam start/finish, auto-finish events

### Teacher Panel
- **Dashboard** — Exam and question bank overview
- **Question Banks** — CRUD with globally unique names
- **Question Management** — Create/edit questions (Single Choice, Multiple Choice, Essay) with answer options
- **Exam Schedule** — Create/edit exams with compact 3-column layout, assign questions from banks, assign students, auto-reassign on category change
- **Question Bank Picker** — Inline question bank selection with search, warning badges for exams with 0 questions
- **Exam Results** — View results by exam, by class, by student
- **Essay Grading** — Manual essay grading, score finalization

### General
- **Authentication** — Login with role-based redirect (Admin → `/admin/dashboard`, Teacher → `/teacher/dashboard`)
- **Student Login Block** — Students are shown an error message directing them to use the mobile app
- **Super Admin Badge** — Visual identifier for the Super Admin account
- **Responsive Design** — Sidebar navigation, mobile-friendly
- **Toast Notifications** — Real-time action feedback

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16.0.1 (App Router) |
| React | v19.2.0 |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix UI primitives) |
| Icons | Lucide React |
| HTTP Client | Axios |
| Auth | JWT via cookies (js-cookie) |
| Notifications | react-hot-toast, sonner |

## Setup

### Prerequisites

- Node.js v18+
- npm
- CBT Backend API running at `http://localhost:3000`

### Installation

```bash
cd cbt-dashboard
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_HOST=http://localhost:3000/api
```

### Running the Application

```bash
# Development (port 3001)
npm run dev

# Production build
npm run build
npm run start
```

Dashboard runs at `http://localhost:3001`.

### Scripts

```bash
npm run dev      # Development server (port 3001)
npm run build    # Production build
npm run start    # Production server (port 3001)
npm run lint     # ESLint check
```

## Coding Standards

### Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| React Component | PascalCase | `UserDetailPage`, `ExamScheduleForm` |
| File Name (page) | `page.js` or `page.jsx` | `src/app/admin/dashboard/page.js` |
| File Name (component) | PascalCase | `AdminSidebar.jsx`, `ExamCard.jsx` |
| File Name (util/hook) | camelCase | `useAuth.js`, `request.jsx` |
| Function | camelCase | `handleSubmit`, `fetchExams` |
| Variable | camelCase | `examList`, `isLoading` |
| CSS Class | Tailwind utility | `className="flex items-center gap-2"` |
| Route Path | kebab-case | `/admin/all-teachers`, `/exam-schedule` |

### Code Style

- **App Router** — All pages under `src/app/` using Next.js App Router conventions
- **Client Components** — Use `"use client"` directive on pages that need interactivity
- **API Calls** — Use the shared Axios instance from `utils/request.jsx` which auto-attaches JWT from cookies
- **UI Components** — Use shadcn/ui components from `components/ui/` (40+ components available)
- **Auth Context** — Use `AuthContext` via `useAuth()` hook for authentication state
- **Error Handling** — Read `error?.response?.data?.error` from backend responses (backend uses `error` key)
- **Layouts** — Admin and Teacher have separate layout wrappers (`adminLayout.jsx`, `teacherLayout.jsx`) with sidebar + header

### Project Structure

```
cbt-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.js               # Root layout (AuthProvider + Toaster)
│   │   ├── page.js                  # Root → redirect to /login
│   │   ├── globals.css              # Global styles + Tailwind
│   │   ├── login/page.jsx           # Login page
│   │   ├── admin/
│   │   │   ├── adminLayout.jsx      # Admin layout wrapper
│   │   │   ├── components/          # Admin Header + Sidebar
│   │   │   ├── dashboard/           # Admin dashboard
│   │   │   ├── all-admins/          # Admin list
│   │   │   ├── all-teachers/        # Teacher list
│   │   │   ├── all-students/        # Student list
│   │   │   ├── add-user/            # Add user forms
│   │   │   ├── user-detail/[id]/    # User detail page
│   │   │   └── activity/            # Exam monitoring
│   │   └── teacher/
│   │       ├── teacherLayout.jsx    # Teacher layout wrapper
│   │       ├── components/          # Teacher Header + Sidebar
│   │       ├── dashboard/           # Teacher dashboard
│   │       ├── question-bank/       # Question bank pages
│   │       ├── manage-question-bank/ # Bank management
│   │       ├── add-question/        # Add question form
│   │       ├── edit-question/       # Edit question form
│   │       ├── exam-schedule/       # Exam scheduling
│   │       └── exam-results/        # Exam results + grading
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (40+)
│   │   ├── admin/                   # Admin-specific components
│   │   └── _shared/                 # Shared components
│   ├── contexts/
│   │   └── AuthContext.js           # Global auth context
│   ├── hooks/
│   │   ├── useAuth.js               # Auth hook
│   │   └── use-mobile.js            # Mobile detection hook
│   ├── utils/
│   │   ├── auth.js                  # Auth utilities
│   │   └── request.jsx              # Axios instance (auto-token from cookie)
│   └── lib/
│       ├── constants.js             # Shared constants (subjects, grades, majors, subject colors)
│       └── utils.js                 # cn() for Tailwind class merging
├── public/                          # Static assets
├── package.json
├── next.config.mjs
├── components.json                  # shadcn/ui configuration
├── postcss.config.mjs
└── eslint.config.mjs
```

## Page Routes

### Admin (`/admin/...`)

| Path | Description |
|------|-------------|
| `/admin/dashboard` | Main dashboard: stats + activity logs + active users |
| `/admin/all-admins` | All admin accounts |
| `/admin/all-teachers` | All teacher accounts |
| `/admin/all-students` | All student accounts |
| `/admin/add-user` | Add new user |
| `/admin/add-user/admin` | Add admin form |
| `/admin/add-user/teacher` | Add teacher form |
| `/admin/add-user/student` | Add student form |
| `/admin/user-detail/[id]` | User detail + edit + role management |
| `/admin/activity` | Exam activity monitoring |
| `/admin/activity/detail/[examId]` | Exam participant details |
| `/admin/activity/blocked` | Blocked participants list |

### Teacher (`/teacher/...`)

| Path | Description |
|------|-------------|
| `/teacher/dashboard` | Teacher dashboard |
| `/teacher/question-bank` | Question bank list |
| `/teacher/question-bank/[id]` | Bank detail + questions |
| `/teacher/manage-question-bank/[id]` | Manage question bank |
| `/teacher/add-question` | Add new question |
| `/teacher/edit-question/[id]` | Edit question |
| `/teacher/exam-schedule` | Exam schedule list |
| `/teacher/exam-schedule/add` | Create new exam (compact 3-column layout, step progress, live summary) |
| `/teacher/exam-schedule/add/select-bank` | Select question bank for exam |
| `/teacher/exam-schedule/edit/[id]` | Edit exam (compact 3-column layout, inline bank picker, auto-reassign) |
| `/teacher/exam-results` | Exam results overview |
| `/teacher/exam-results/by-class` | Results by class |
| `/teacher/exam-results/student-list` | Student list per exam |
| `/teacher/exam-results/student-list/detail` | Student result detail |
| `/teacher/exam-results/student-list/detail/essay` | Essay answer review + grading |

## Authentication Flow

1. User logs in via `/login` → `POST /api/auth/login`
2. JWT token stored in cookie via `js-cookie`
3. `AuthContext` decodes token and provides user state globally
4. Role-based redirect: Admin → `/admin/dashboard`, Teacher → `/teacher/dashboard`
5. Students receive an error message (must use mobile app)
6. Protected routes check role before rendering content
7. Axios instance (`request.jsx`) auto-attaches `Authorization: Bearer {token}` header

## Global Deadline

The dashboard displays `end_date` as the exam deadline. All students share the same deadline — there are no per-student deadlines. When creating an exam, the teacher sets `start_date` (when students can begin) and `end_date` (when all students must finish). The `duration_minutes` field is for informational display only.

## License

MIT
