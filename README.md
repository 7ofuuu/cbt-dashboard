# CBT Dashboard

Web-based admin and teacher dashboard for Computer-Based Test (CBT) system. Manage users, create exams, grade responses, and monitor exam activity in real-time.

**Built with:** Next.js 16 | React 19 | Tailwind CSS v4 | shadcn/ui | Axios

---

## Features

### Admin Panel
- **Dashboard** — Overview statistics, recent activity logs, active users (last 24 hours)
- **User Management** — CRUD admin/teacher/student, batch CSV import, activate/deactivate
- **User Detail View** — Full profile, role management, password reset
- **Super Admin Protection** — Special admin account cannot be deleted or downgraded
- **Exam Activity Monitoring** — Real-time participant status (not started, in progress, completed)
- **Block/Unblock Participants** — Block cheating students mid-exam, generate unlock codes
- **Activity Logs** — View login history, exam events (start/finish), auto-finish records
- **School Profile** — Update school name, logo, and contact information

### Teacher Panel
- **Dashboard** — Exam overview, question bank summary, quick-access stats
- **Question Banks** — Create, edit, delete banks with globally unique names
- **Question Management** — Create/edit questions in three types:
  - Single Choice (4 options, 1 correct)
  - Multiple Choice (multiple correct answers)
  - Essay (teacher grades manually)
- **Exam Schedule** — Create/edit/delete exams with clean 3-column layout
  - Assign questions from banks individually or in bulk
  - Assign students by grade level + major (auto or manual)
  - Enable/disable question randomization
  - Set global deadline and duration
- **Question Bank Picker** — Inline search, add banks to exams, warning badges
- **Exam Results** — View/filter results by exam, class, or student
- **Essay Grading** — Manual grading interface for essay questions, finalize scores

### Authentication & Authorization
- **Login Portal** — Role-based login with JWT cookie storage
- **Role-Based Redirect** — Auto-route to Admin Dashboard or Teacher Dashboard
- **Student Block** — Students shown error message directing to mobile app
- **Super Admin Badge** — Visual indicator for Super Admin accounts
- **Session Persistence** — JWT stored in secure HTTP-only cookies

### UI/UX
- **Responsive Design** — Mobile-friendly sidebar + main content layout
- **Dark/Light Mode** — Theme toggle (optional, via Tailwind)
- **Toast Notifications** — Real-time feedback for actions (success, error, warning)
- **Modal Dialogs** — Confirmation, forms, detailed views
- **Loading States** — Skeleton loaders and spinners
- **Error Boundaries** — Graceful error handling and user messages

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.0.1+ |
| Runtime | React | 19.2.0+ |
| Styling | Tailwind CSS | v4 |
| UI Library | shadcn/ui | Latest |
| Icons | Lucide React | Latest |
| HTTP Client | Axios | Latest |
| Auth | JWT (via js-cookie) | Latest |
| Notifications | sonner, react-hot-toast | Latest |
| Language | JavaScript (JSX) | ES2020+ |

---

## Prerequisites

- **Node.js** v18 or higher
- **npm** (comes with Node.js)
- **CBT Backend API** running at `http://localhost:3000`

---

## Installation & Setup

### 1. Clone Repository

```bash
cd cbt-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file in project root:

```env
NEXT_PUBLIC_HOST=http://localhost:3000/api/
NEXT_PUBLIC_HOST_NGROK=https://cbt-be.ngrok-free.app/api/
```

**Environment Variables Reference:**
- `NEXT_PUBLIC_HOST` — Backend API base URL for **local** access (must end with `/api/`)
- `NEXT_PUBLIC_HOST_NGROK` — Backend URL via ngrok static domain; used automatically when the dashboard is opened through an ngrok URL. Replace with your reserved domain. See [NGROK-FIREBASE-SETUP.md](../NGROK-FIREBASE-SETUP.md).

> **Deploy to Vercel:** the dashboard can be hosted on Vercel while the backend
> stays local + exposed via ngrok. Set both env vars above to your ngrok backend
> URL in the Vercel project. Full steps: [VERCEL-DEPLOY.md](./VERCEL-DEPLOY.md).

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Dashboard starts at `http://localhost:3001` with:
- Hot module reloading
- Fast refresh on file changes
- Development console logs

### Production Build

```bash
npm run build    # Compile Next.js app
npm run start    # Run production server on port 3001
```

---

## Useful Commands

```bash
npm run dev      # Development server (port 3001, auto-reload)
npm run build    # Production build
npm run start    # Production server (port 3001)
npm run lint     # ESLint check
```

---

## Project Structure

```
cbt-dashboard/
├── package.json
├── README.md                        # This file
├── next.config.mjs
├── components.json                  # shadcn/ui config
├── tailwind.config.js
├── postcss.config.mjs
├── eslint.config.mjs
│
├── public/                          # Static assets
│
├── src/
│   ├── middleware.js                # Next.js middleware (auth guards)
│   │
│   ├── app/                         # App Router (pages)
│   │   ├── layout.js                # Root layout
│   │   ├── page.js                  # Home page (redirects to login)
│   │   ├── providers.jsx            # Client context providers
│   │   ├── globals.css              # Global styles
│   │   │
│   │   ├── login/                   # Login page
│   │   │   └── page.jsx
│   │   │
│   │   ├── admin/                   # Admin routes
│   │   │   ├── layout.jsx           # Admin layout wrapper
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── activities/
│   │   │   ├── school-profile/
│   │   │   └── ...
│   │   │
│   │   └── teacher/                 # Teacher routes
│   │       ├── layout.jsx           # Teacher layout wrapper
│   │       ├── dashboard/
│   │       ├── question-banks/
│   │       ├── questions/
│   │       ├── exams/
│   │       ├── exam-results/
│   │       └── ...
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components (40+)
│   │   │   ├── button.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── form.jsx
│   │   │   ├── input.jsx
│   │   │   ├── table.jsx
│   │   │   └── ...
│   │   │
│   │   ├── _shared/                 # Shared components (auth, layout)
│   │   │   ├── Sidebar.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── TeacherSidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── ...
│   │   │
│   │   ├── admin/                   # Admin-specific components
│   │   │   ├── UserForm.jsx
│   │   │   ├── ExamActivityMonitor.jsx
│   │   │   └── ...
│   │   │
│   │   ├── teacher/                 # Teacher-specific components
│   │   │   ├── ExamForm.jsx
│   │   │   ├── QuestionForm.jsx
│   │   │   ├── ExamResultsTable.jsx
│   │   │   └── ...
│   │   │
│   │   └── examples/                # Demo/example components
│   │
│   ├── contexts/
│   │   └── AuthContext.js           # Auth state + JWT management
│   │
│   ├── hooks/
│   │   ├── useAuth.js               # Get current user + login/logout
│   │   ├── useSchoolProfile.js      # Fetch school info
│   │   └── use-mobile.js            # Mobile detection
│   │
│   ├── lib/
│   │   ├── constants.js             # Shared constants (subjects, grades, colors)
│   │   └── utils.js                 # Helper utilities
│   │
│   └── utils/
│       ├── auth.js                  # Auth helpers (decode JWT, etc.)
│       └── request.jsx              # Shared Axios instance with auth header
│
└── tests/                           # Test files
```

### Key Directories Explained

- **`app/`** — Next.js App Router pages and layouts
- **`components/ui/`** — shadcn/ui component library (pre-built, customizable)
- **`components/_shared/`** — Navigation, sidebars, common UI
- **`contexts/AuthContext.js`** — Global auth state (current user, login status)
- **`utils/request.jsx`** — Shared Axios instance that auto-attaches JWT to requests
- **`lib/constants.js`** — Subject names, grade levels, major options, color schemes

---

## Coding Standards

### Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Page File | `page.js` or `page.jsx` | `app/admin/dashboard/page.jsx` |
| Component File | PascalCase | `UserForm.jsx`, `AdminSidebar.jsx` |
| Hook/Utility | camelCase | `useAuth.js`, `request.jsx`, `auth.js` |
| Route Path | kebab-case | `/admin/exam-results`, `/teacher/question-banks` |
| Variable | camelCase | `userData`, `isLoading`, `handleSubmit` |
| Constant | UPPER_SNAKE or PascalCase | `API_BASE_URL`, `Colors.PRIMARY` |

### Component Patterns

- **Client Components** — Use `"use client"` directive for interactive components (forms, buttons, modals)
- **Server Components** — Default; fetch data on server, pass as props
- **Hooks with useSearchParams** — Wrap in `Suspense` to avoid CSR bailout in production builds
- **Error Handling** — Use `error?.response?.data?.error` for backend error messages

### Authentication Flow

1. User logs in with username/password
2. Backend returns JWT token
3. Token stored in cookie via `js-cookie`
4. `AuthContext` decodes JWT and exposes `user` state
5. Shared Axios instance (`request.jsx`) auto-attaches token to all requests
6. Protected routes check `useAuth()` hook and redirect if not authenticated

### API Integration

- Use shared `request.jsx` Axios instance for all API calls
- All endpoints prepend `NEXT_PUBLIC_HOST` automatically
- Error format: `error.response.data.error` (from backend `{ error: "message" }`)
- Success responses vary per endpoint; check API docs

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
