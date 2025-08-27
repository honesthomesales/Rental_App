'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Home, Users, FileText, AlertTriangle, DollarSign, TrendingUp, FileCheck, Calendar } from 'lucide-react'

// Honest Home Sales Logo Component
function HonestHomeSalesLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 120 60" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* House roof with three gables */}
      <path 
        d="M10 20 L30 10 L50 20 L70 10 L90 20 L110 10 L110 25 L10 25 Z" 
        fill="#dc2626" 
        stroke="#991b1b" 
        strokeWidth="1"
      />
      
      {/* Chimney */}
      <rect x="55" y="5" width="8" height="15" fill="#374151" />
      
      {/* Windows under each gable */}
      <rect x="15" y="27" width="8" height="6" fill="#374151" />
      <rect x="55" y="27" width="8" height="6" fill="#374151" />
      <rect x="95" y="27" width="8" height="6" fill="#374151" />
      
      {/* Text "Honest Home Sales" */}
      <text 
        x="60" 
        y="50" 
        textAnchor="middle" 
        fill="#374151" 
        fontSize="8" 
        fontFamily="Arial, sans-serif" 
        fontWeight="bold"
      >
        Honest Home Sales
      </text>
    </svg>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Memoize navigation links to prevent unnecessary re-renders
  const navLinks = useMemo(() => [
    { label: 'Dashboard', icon: <Home className="w-5 h-5 mr-2" />, href: '/' },
    { label: 'Properties', icon: <FileText className="w-5 h-5 mr-2" />, href: '/properties' },
    { label: 'Tenants', icon: <Users className="w-5 h-5 mr-2" />, href: '/tenants' },
    { label: 'Leases', icon: <FileCheck className="w-5 h-5 mr-2" />, href: '/leases' },
    { label: 'Payments', icon: <DollarSign className="w-5 h-5 mr-2" />, href: '/payments' },
    { label: 'Rent Periods', icon: <Calendar className="w-5 h-5 mr-2" />, href: '/rent-periods' },
    { label: 'Late Tenants', icon: <AlertTriangle className="w-5 h-5 mr-2" />, href: '/late-tenants' },
    { label: 'Profit', icon: <TrendingUp className="w-5 h-5 mr-2" />, href: '/profit' },
  ], [])

  return (
    <>
      {/* Header Bar */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200 flex items-center h-16 px-4 z-50 sticky top-0">
        <button
          className="text-gray-700 hover:text-primary-600 focus:outline-none mr-4"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-7 h-7" />
        </button>
        <span className="text-xl font-bold text-gray-900">Rental Management App</span>
        <div className="ml-4 flex items-center">
          <HonestHomeSalesLogo className="w-8 h-8" />
        </div>
      </header>

      {/* Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-[9999] transition-all duration-300 ${open ? 'visible' : 'invisible pointer-events-none'}`}
        style={{ background: open ? 'rgba(0,0,0,0.3)' : 'transparent' }}
        onClick={() => setOpen(false)}
      >
        <nav
          className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 z-[10000] ${open ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-lg font-bold text-gray-900 mr-3">Menu</span>
              <HonestHomeSalesLogo className="w-6 h-6" />
            </div>
            <button
              className="text-gray-500 hover:text-primary-600 focus:outline-none"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <ul className="py-4">
            {navLinks.map(link => (
              <li key={link.href}>
                <button
                  className="w-full flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-700 text-base font-medium transition-colors"
                  onClick={() => { setOpen(false); router.push(link.href) }}
                >
                  {link.icon}
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
} 