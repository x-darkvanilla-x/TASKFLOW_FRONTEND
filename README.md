# Follow Up - Next.js Frontend

A high-performance, pixel-perfect, fully responsive web application built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS v4**. It features an interactive drag-and-drop Kanban board, comprehensive task management modals, theme toggle, subtask workflows, and real-time backend synchronization.

---

## 🛠️ Tech Stack & Core Libraries

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server & Client Components)
- **UI Library & React Version:** [React 19](https://react.dev/) with TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables and dark mode support
- **Drag & Drop:** [`@hello-pangea/dnd`](https://github.com/hello-pangea/dnd) (React 19 compatible dnd solution)
- **Iconography:** [Lucide React](https://lucide.dev/)
- **HTTP Requests:** [Axios](https://axios-http.com/) with request interceptors for JWT injection
- **State Management:** React Context API (`AuthContext` & `ThemeContext`) + LocalStorage persistence

---

## ✨ Features & User Experience

- 🎨 **Kanban Board & Drag-and-Drop:**
  - Drag tasks seamlessly between workflow columns (`Todo`, `In Progress`, `Done`).
  - Fluid visual feedback during drag operations using `@hello-pangea/dnd`.
- ✏️ **Advanced Task Modal Form:**
  - **Task Metadata:** Title, rich description, status, priority (`low`, `medium`, `high`), due date picker, custom color-coded assignees, and dynamic tag pills.
  - **Subtask Checklist:** Create, update, toggle completion, and delete nested subtasks complete with individual due dates and priorities.
  - **Resource Attachments:** Attach external URLs and reference links to tasks.
- 🔐 **Guest & User Authentication:**
  - One-click Guest Session initialization with randomized avatar name generator.
  - Full support for traditional email/password signup and login.
  - Persistent auth tokens with automatic login restoration on page refresh.
- 🌓 **Dark & Light Mode:**
  - Full theme switcher integrated into header & sidebar.
  - Synchronized across application pages and stored in `localStorage`.
- 🔍 **Real-Time Filtering & Search:**
  - Filter tasks dynamically by column status, priority levels, or keyword search across titles and descriptions.
- 📱 **Mobile & Responsive Layout:**
  - Collapsible responsive sidebar drawer with backdrop overlay for mobile viewports.
  - Clean responsive grid layout adaptation across Desktop, Tablet, and Mobile screens.
- 🔔 **Toast & Confirmation Dialogs:**
  - Non-blocking custom toast notifications for action confirmations and API feedback.
  - Confirmation modal for destructive actions like task deletion.

---

## 📁 Project Architecture & Structure

```text
frontend/
├── src/
│   ├── app/                        # Next.js App Router Pages
│   │   ├── auth/                   # Authentication Page (/auth)
│   │   ├── dashboard/              # Core Kanban Dashboard (/dashboard)
│   │   ├── tasks/                  # Task Details & List View (/tasks)
│   │   ├── profile/                # User Profile Page (/profile)
│   │   ├── globals.css             # Tailwind CSS v4 directives & theme tokens
│   │   ├── layout.tsx              # Root Layout wrapping Context Providers
│   │   └── page.tsx                # Entry redirect route
│   ├── components/                 # Reusable UI Components
│   │   ├── Header.tsx              # Top navigation bar with Search, Theme toggle & Profile
│   │   ├── Sidebar.tsx             # Collapsible Navigation drawer & guest info
│   │   ├── TaskBoard.tsx           # Drag & Drop Kanban board wrapper
│   │   ├── TaskCard.tsx            # Task Card display component with subtask progress bar
│   │   ├── TaskModal.tsx           # Modal wrapper for creating & editing tasks
│   │   ├── TaskFormContent.tsx     # Detailed Task Form (Subtasks, Attachments, Details)
│   │   ├── ConfirmDialog.tsx       # Reusable delete/action confirmation modal
│   │   └── Toast.tsx               # Custom animated alert notification component
│   ├── context/                    # React Context State Management
│   │   ├── AuthContext.tsx         # User authentication, token state & guest login handler
│   │   └── ThemeContext.tsx        # Dark/Light theme mode provider
│   └── services/                   # API Client Layer
│       ├── api.ts                  # Axios base client with Bearer token interceptor
│       ├── auth.service.ts         # Login, Register, Guest Auth endpoints client
│       ├── tasks.service.ts        # Task CRUD, filters, and stats API integration
│       └── members.service.ts      # Workspace members API integration
├── public/                         # Static public assets & icons
├── .env.local                      # Environment variables configuration
├── next.config.ts                  # Next.js configuration
├── tailwind.config.js              # Tailwind styling configuration
├── tsconfig.json                   # TypeScript compiler options
└── package.json                    # Frontend dependencies & npm scripts
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend REST API Base URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Backend API**: Running instance of the NestJS backend at `http://localhost:3001`

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Environment
```bash
cp .env.example .env.local # Or create .env.local directly with the snippet above
```

### Step 3: Run Development Server
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## 📜 Available NPM Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launches Next.js dev server with hot reloading on port 3000 |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Runs the compiled Next.js production server |
| `npm run lint` | Runs ESLint to check for code issues and syntax errors |

---

## 🎨 Design & Styling System

The application relies on **Tailwind CSS v4** configured with CSS custom properties for effortless theme swapping:

- **Light Mode:** Crisp white cards, neutral slate backgrounds (`#F8FAFC`), rich contrast text.
- **Dark Mode:** Deep dark canvas (`#0F172A`), dark slate cards (`#1E293B`), neon accent borders (`#38BDF8`).
- **Priority Indicator Colors:**
  - 🔴 **High:** Red (`#EF4444` / `bg-red-500/10 text-red-500`)
  - 🟡 **Medium:** Amber (`#F59E0B` / `bg-amber-500/10 text-amber-500`)
  - 🟢 **Low:** Emerald (`#10B981` / `bg-emerald-500/10 text-emerald-500`)

---

## 🔌 API Service Layer Architecture

All backend communications flow through `src/services/api.ts`, which configures an Axios instance with an **Interceptor**:

```typescript
// Automatically injects JWT Bearer token into headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

This ensures seamless authenticated requests across all services (`auth.service.ts`, `tasks.service.ts`, `members.service.ts`).
