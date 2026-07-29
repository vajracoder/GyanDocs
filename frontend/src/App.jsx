import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from './components/layout/Navbar.jsx'
import Footer from './components/layout/Footer.jsx'

export default function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isPdfRoute = location.pathname.endsWith('/pdf')

  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Outlet />
      </main>
      {!isPdfRoute && <Footer />}
    </div>
  )
}
