# CBT Dashboard - SMAN 1 Parigi

A modern, responsive Computer-Based Test (CBT) dashboard application for SMAN 1 Parigi, built with Next.js 16 and Tailwind CSS.

## 🎯 Features

### Admin Dashboard
- **User Management**: View and manage all system users
- **Activity Monitoring**: Track student activities in real-time
- **Status Tracking**: Monitor test progress with status indicators (On Progress, Submitted, Blocked)
- **Responsive Layout**: Fully responsive design with sidebar navigation

### Authentication
- Secure login system with password visibility toggle
- Role-based access control (Admin, Guru/Teacher)
- Protected routes and layouts

### UI Components
- Modern card-based interface
- Interactive tables with hover effects
- Reusable component library using shadcn/ui
- Custom color scheme with primary navy blue theme

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: JavaScript/JSX

## 📁 Project Structure

```
cbt-dashboard/
├── src/
│   ├── app/
│   │   ├── admin/                # Admin route
│   │   │   ├── components/       # Admin-specific components
│   │   │   │   ├── header.jsx    # Admin header
│   │   │   │   └── sidebar.jsx   # Admin sidebar
│   │   │   ├── dashboard/        # Admin dashboard page
│   │   │   │   └── page.jsx
│   │   │   └── adminLayout.jsx   # Admin layout wrapper
│   │   ├── guru/                 # Teacher route
│   │   │   ├── components/       # Teacher-specific components
│   │   │   │   ├── header.jsx    # Teacher header
│   │   │   │   └── sidebar.jsx   # Teacher sidebar
│   │   │   ├── dashboard/        # Teacher dashboard page
│   │   │   │   └── page.jsx
│   │   │   └── guruLayout.jsx    # Teacher layout wrapper
│   │   ├── login/                # Login page
│   │   │   └── page.jsx
│   │   ├── favicon.ico           # Site favicon
│   │   ├── globals.css           # Global styles & theme
│   │   ├── layout.js             # Root layout
│   │   └── page.js               # Home page
│   ├── components/
│   │   └── ui/                   # shadcn/ui component library
│   │       ├── button.jsx
│   │       ├── card.jsx
│   │       ├── input.jsx
│   │       ├── table.jsx
│   │       └── ... (40+ components)
│   ├── hooks/                    # Custom React hooks
│   │   └── use-mobile.js
│   └── lib/                      # Utility functions
│       └── utils.js
├── public/                       # Static assets (SVGs, images)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .gitignore
├── components.json               # shadcn/ui configuration
├── eslint.config.mjs             # ESLint configuration
├── jsconfig.json                 # JavaScript configuration
├── next.config.mjs               # Next.js configuration
├── package.json                  # Project dependencies
├── postcss.config.mjs            # PostCSS configuration
└── README.md                     # Project documentation
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/7ofuuu/cbt-dashboard.git
   cd cbt-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. **Install icon dependencies**
   ```bash
   npm install lucide-react
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)


## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint
```

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/icons/)
