import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AssistantProvider } from './components/assistant/AssistantWidget'
import { ToastProvider } from './components/ui/Toast'
import AdminLayout from './pages/admin/AdminLayout'
import AgendaPage from './pages/admin/AgendaPage'
import ClientsPage from './pages/admin/ClientsPage'
import DashboardPage from './pages/admin/DashboardPage'
import ProfessionalsPage from './pages/admin/ProfessionalsPage'
import ServicesAdminPage from './pages/admin/ServicesAdminPage'
import SettingsPage from './pages/admin/SettingsPage'
import BookingPage from './pages/BookingPage'
import HomePage from './pages/HomePage'

function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, [pathname, hash])
  return null
}

/** Remonta el flujo si cambian los parámetros (p. ej. el asistente elige otro horario). */
function BookingRoute() {
  const { search } = useLocation()
  return <BookingPage key={search} />
}

function PublicShell() {
  return (
    <AssistantProvider>
      <Outlet />
    </AssistantProvider>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <ScrollToTop />
      <Routes>
        <Route element={<PublicShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/reservar" element={<BookingRoute />} />
        </Route>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="turnos" element={<AgendaPage />} />
          <Route path="clientes" element={<ClientsPage />} />
          <Route path="servicios" element={<ServicesAdminPage />} />
          <Route path="profesionales" element={<ProfessionalsPage />} />
          <Route path="configuracion" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  )
}
