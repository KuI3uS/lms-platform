import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./Layout";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";

const LandingPage = lazy(() => import("./components/LandingPage"));
const Login = lazy(() => import("./Login"));
const Register = lazy(() => import("./Register"));
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const ResetPassword = lazy(() => import("./ResetPassword"));
const TutoringBookingPage = lazy(() => import("./pages/TutoringBookingPage"));

const CoursesPage = lazy(() => import("./pages/CoursesPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ModulePage = lazy(() => import("./pages/ModulePage"));
const LessonListPage = lazy(() => import("./pages/LessonListPage"));
const LessonPage = lazy(() => import("./pages/LessonPage/LessonPage.jsx"));
const TestPage = lazy(() => import("./pages/TestPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));

const AdminPage = lazy(() => import("./pages/AdminPage"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AddCoursePage = lazy(() => import("./pages/AddCoursePage"));
const AddQuestionPage = lazy(() => import("./pages/AddQuestionPage"));
const AdminTutoringPage = lazy(() => import("./pages/AdminTutoringPage"));
const AdminLessonPage = lazy(() => import("./pages/AdminLessonPage/AdminLessonPage.jsx"));
const AdminSubmissionsPage = lazy(() => import("./pages/AdminSubmissionsPage"));

function PageLoader() {
    return (
        <div className="flex min-h-[45vh] items-center justify-center bg-slate-950 text-white">
            <div
                role="status"
                aria-label="Ładowanie strony"
                className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"
            />
        </div>
    );
}

export default function App() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/tutoring-booking" element={<TutoringBookingPage />} />

                <Route element={<ProtectedRoute />}>
                    <Route element={<Layout />}>
                        <Route path="/courses" element={<CoursesPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/modules/:courseId" element={<ModulePage />} />
                        <Route path="/lessons/:moduleId" element={<LessonListPage />} />
                        <Route path="/lesson/:lessonId" element={<LessonPage />} />
                        <Route path="/test/:moduleId" element={<TestPage />} />
                        <Route path="/results" element={<ResultsPage />} />

                        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                        <Route path="/admin/add-course" element={<AdminRoute><AddCoursePage /></AdminRoute>} />
                        <Route path="/admin/courses/:courseId/edit" element={<AdminRoute><AddCoursePage /></AdminRoute>} />
                        <Route path="/admin/add-question" element={<AdminRoute><AddQuestionPage /></AdminRoute>} />
                        <Route path="/admin/tutoring" element={<AdminRoute><AdminTutoringPage /></AdminRoute>} />
                        <Route path="/admin/lessons/:moduleId" element={<AdminRoute><AdminLessonPage /></AdminRoute>} />
                        <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissionsPage /></AdminRoute>} />

                        <Route path="*" element={
                            <div className="p-10 text-white">404 - Strona nie istnieje</div>
                        } />
                    </Route>
                </Route>
            </Routes>
        </Suspense>
    );
}
