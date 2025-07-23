'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X, Home, Users, FileText, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react'

export function Header() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const navLinks = [
    { label: 'Dashboard', icon: <Home className="w-5 h-5 mr-2" />, href: '/' },
    { label: 'Properties', icon: <FileText className="w-5 h-5 mr-2" />, href: '/properties' },
    { label: 'Tenants', icon: <Users className="w-5 h-5 mr-2" />, href: '/tenants' },
    { label: 'Payments', icon: <DollarSign className="w-5 h-5 mr-2" />, href: '/payments' },
    { label: 'Late Tenants', icon: <AlertTriangle className="w-5 h-5 mr-2" />, href: '/late-tenants' },
    { label: 'Profit', icon: <TrendingUp className="w-5 h-5 mr-2" />, href: '/profit' },
  ]

  return (
    <>
      {/* Header Bar */}
      <header className="w-full bg-white shadow-sm border-b border-gray-200 flex items-center h-16 px-4 z-50 relative">
        <button
          className="text-gray-700 hover:text-primary-600 focus:outline-none mr-4"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-7 h-7" />
        </button>
        <span className="text-xl font-bold text-gray-900">Rental Management App</span>
      </header>

      {/* Sidebar Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${open ? 'visible' : 'invisible pointer-events-none'}`}
        style={{ background: open ? 'rgba(0,0,0,0.3)' : 'transparent' }}
        onClick={() => setOpen(false)}
      >
        <nav
          className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <span className="text-lg font-bold text-gray-900">Menu</span>
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