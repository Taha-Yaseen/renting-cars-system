import type { LucideIcon } from 'lucide-react'
import { Car, LayoutDashboard, Users, FileText } from 'lucide-react'

export interface NavItem {
  id: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'cars', icon: Car },
  { id: 'clients', icon: Users },
  { id: 'rentals', icon: FileText },
]
