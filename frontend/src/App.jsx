import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Loader from './components/Loader'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import { usePageTracking } from './hooks/useAnalytics'
import api from './api/client'
import { setCurrency } from './utils/format'

// --- Lazy-loaded pages (code-splitting; each becomes its own chunk) ---
const Home           = lazy(() => import('./pages/Home'))
const Shop           = lazy(() => import('./pages/Shop'))
const Categories     = lazy(() => import('./pages/Categories'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Cart           = lazy(() => import('./pages/Cart'))
const Checkout       = lazy(() => import('./pages/Checkout'))
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'))
const About          = lazy(() => import('./pages/About'))
const Contact        = lazy(() => import('./pages/Contact'))
const FAQ            = lazy(() => import('./pages/FAQ'))
const Login          = lazy(() => import('./pages/Login'))
const Register       = lazy(() => import('./pages/Register'))
const AdminRegister  = lazy(() => import('./pages/AdminRegister'))
const Account        = lazy(() => import('./pages/account/Account'))
const NotFound       = lazy(() => import('./pages/NotFound'))

// Admin
const AdminLayout    = lazy(() => import('./pages/admin/AdminLayout'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminProducts  = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders    = lazy(() => import('./pages/admin/AdminOrders'))
const AdminCustomers = lazy(() => import('./pages/admin/AdminCustomers'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))

export default function App() {
  usePageTracking()
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  // Load store settings (currency etc.) once.
  useEffect(() => {
    api.get('/settings').then((r) => setCurrency(r.data.currency)).catch(() => {})
  }, [])

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:reference" element={<OrderConfirmation />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin-register" element={<AdminRegister />} />

          {/* Authenticated account area (tabs handled inside) */}
          <Route path="/account/*" element={
            <ProtectedRoute><Account /></ProtectedRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={
              <ProtectedRoute perm="products:read"><AdminProducts /></ProtectedRoute>
            } />
            <Route path="orders" element={
              <ProtectedRoute perm="orders"><AdminOrders /></ProtectedRoute>
            } />
            <Route path="customers" element={
              <ProtectedRoute perm="customers"><AdminCustomers /></ProtectedRoute>
            } />
            <Route path="analytics" element={
              <ProtectedRoute perm="analytics"><AdminAnalytics /></ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {!isAdmin && <Footer />}
    </>
  )
}
