import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import CoursesPage from "./pages/CoursesPage";
import ModulePage from "./pages/ModulePage";
import TestPage from "./pages/TestPage";
import ResultsPage from "./pages/ResultsPage";
import Login from "./Login";
import Register from "./Register";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import AddCoursePage from "./pages/AddCoursePage";
import AddQuestionPage from "./pages/AddQuestionPage";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import TaskPage from "./pages/TaskPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import LessonPage from "./pages/LessonPage";
import AdminTaskPage from "./pages/AdminTaskPage";

export default function App() {

    return (
        <Routes>

            {/* PUBLIC */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* PRIVATE */}
            <Route element={<ProtectedRoute />}>

                <Route element={<Layout />}>

                    <Route path="/" element={<CoursesPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/modules/:courseId" element={<ModulePage />} />
                    <Route path="/test/:moduleId" element={<TestPage />} />
                    <Route path="/results" element={<ResultsPage />} />
                    <Route path="/tasks/:moduleId" element={<TaskPage />} />
                    <Route path="/task/:id" element={<TaskDetailPage />} />
                    <Route path="/lesson/:taskId" element={<LessonPage />} />
                    <Route path="/admin/tasks/:moduleId" element={<AdminTaskPage />} />

                    <Route path="/admin" element={
                        <AdminRoute><AdminPage /></AdminRoute>
                    } />

                    <Route path="/admin/users" element={
                        <AdminRoute><AdminUsers /></AdminRoute>
                    } />

                    <Route path="/admin/add-course" element={
                        <AdminRoute><AddCoursePage /></AdminRoute>
                    } />

                    <Route path="/admin/add-question" element={
                        <AdminRoute><AddQuestionPage /></AdminRoute>
                    } />

                </Route>

            </Route>

        </Routes>
    );
}