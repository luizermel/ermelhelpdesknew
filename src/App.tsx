import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'

// Pages
import InventoryItemsPage from './pages/InventoryItems'
import InventoryLocationsPage from './pages/InventoryLocations'
import InventoryMovementsPage from './pages/InventoryMovements'
import MaterialRequestsPage from './pages/MaterialRequests'
import StockEntryPage from './pages/StockEntry'
import PublicConfirmationPage from './pages/PublicConfirmation'

import Login from './pages/Index'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Dashboard from './pages/Dashboard'
import TicketsList from './pages/TicketsList'
import NewTicket from './pages/NewTicket'
import TicketDetail from './pages/TicketDetail'
import AdminPanel from './pages/AdminPanel'
import Reports from './pages/Reports'
import Knowledge from './pages/Knowledge'
import Queue from './pages/Queue'
import QuickReplies from './pages/QuickReplies'
import Records from './pages/Records'
import Approvals from './pages/Approvals'
import Logs from './pages/Logs'
import SettingsPage from './pages/Settings'
import AssetDetail from './pages/AssetDetail'
import ITAssetsPage from './pages/ITAssets'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <Routes>
          {/* Public Authentication Routes */}
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/registro"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/recuperar-senha"
            element={
              <PublicOnlyRoute>
                <ForgotPassword />
              </PublicOnlyRoute>
            }
          />

          {/* Authenticated Application Routes wrapped in Global Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chamados" element={<TicketsList />} />
            <Route path="/chamados/novo" element={<NewTicket />} />
            <Route path="/novo-chamado" element={<NewTicket />} />
            <Route path="/chamados/:id" element={<TicketDetail />} />

            {/* Estoque e Ativos */}
            <Route path="/estoque/itens" element={<InventoryItemsPage />} />
            <Route path="/estoque/localizacoes" element={<InventoryLocationsPage />} />
            <Route path="/estoque/movimentacoes" element={<InventoryMovementsPage />} />
            <Route path="/estoque/requisicoes" element={<MaterialRequestsPage />} />

            {/* Atendimento */}
            <Route path="/conhecimento" element={<Knowledge />} />
            <Route path="/respostas-rapidas" element={<QuickReplies />} />
            <Route path="/aprovacoes" element={<Approvals />} />
            <Route path="/ativos-ti" element={<ITAssetsPage />} />

            {/* Ativo detalhe */}
            <Route path="/ativo/:id" element={<AssetDetail />} />

            {/* Operação — admin */}
            <Route
              path="/fila"
              element={
                <ProtectedRoute adminOnly>
                  <Queue />
                </ProtectedRoute>
              }
            />

            {/* Admin-only Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <ProtectedRoute adminOnly>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cadastros"
              element={
                <ProtectedRoute adminOnly>
                  <Records />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute adminOnly>
                  <Logs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuracoes"
              element={
                <ProtectedRoute adminOnly>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Public external confirmation */}
          <Route path="/confirmacao-publica/:token" element={<PublicConfirmationPage />} />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
