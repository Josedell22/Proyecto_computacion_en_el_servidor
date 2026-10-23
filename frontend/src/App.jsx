import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import Subjects from "./pages/Subjects.jsx";
import Requests from "./pages/Requests.jsx";
import Tutors from "./pages/Tutors.jsx";
import TutorDetail from "./pages/TutorDetail.jsx";
import Availability from "./pages/Availability.jsx";
import Sessions from "./pages/Sessions.jsx";
import History from "./pages/History.jsx";
import Publications from "./pages/Publications.jsx";
import PublicationForm from "./pages/PublicationForm.jsx";
import PublicationDetail from "./pages/PublicationDetail.jsx";
import Admin from "./pages/Admin.jsx";

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page">Cargando...</div>;
  if (user) return <Navigate to="/panel" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Guest>
            <Login />
          </Guest>
        }
      />
      <Route
        path="/registro"
        element={
          <Guest>
            <Register />
          </Guest>
        }
      />
      <Route
        element={
          <Private>
            <Layout />
          </Private>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/panel" element={<Dashboard />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/materias" element={<Subjects />} />
        <Route path="/solicitudes" element={<Requests />} />
        <Route path="/asesores" element={<Tutors />} />
        <Route path="/asesores/:id" element={<TutorDetail />} />
        <Route path="/disponibilidad" element={<Availability />} />
        <Route path="/sesiones" element={<Sessions />} />
        <Route path="/historial" element={<History />} />
        <Route path="/publicaciones" element={<Publications />} />
        <Route path="/publicaciones/nueva" element={<PublicationForm />} />
        <Route path="/publicaciones/:id" element={<PublicationDetail />} />
        <Route path="/publicaciones/:id/editar" element={<PublicationForm />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
