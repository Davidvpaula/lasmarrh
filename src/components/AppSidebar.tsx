import { NavLink, useLocation } from "react-router-dom"
import { 
  Home, 
  User, 
  FileText, 
  GraduationCap, 
  Settings, 
  LogOut,
  Users,
  Shield,
  Calendar,
  Upload,
  MessageSquare,
  FolderOpen
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  // Determinar se está no contexto admin ou professional
  const isAdminContext = currentPath.includes('/admin') || currentPath === '/dashboard/admin'

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"

  const doctorItems = [
    { title: "Dashboard Profissional", url: "/dashboard/professional", icon: User },
    { title: "Entrevista", url: "/interview", icon: Calendar },
    { title: "Documentos", url: "/documents", icon: FileText },
    { title: "Treinamento", url: "/training", icon: GraduationCap },
    { title: "Meu Perfil", url: "/profile", icon: User },
  ]

  const adminItems = [
    { title: "Início", url: "/", icon: Home },
    { title: "Candidatos", url: "/admin/applications", icon: Users },
    { title: "Entrevista", url: "/admin/interviews", icon: MessageSquare },
    { title: "Formulário", url: "/admin/forms", icon: FolderOpen },
    { title: "Treinamento", url: "/admin/training", icon: GraduationCap },
    { title: "Uploads", url: "/admin/uploads", icon: Upload },
    { title: "Configurações", url: "/admin/settings", icon: Settings },
  ]

  const items = isAdminContext ? adminItems : doctorItems

  const handleSignOut = () => {
    window.location.href = '/';
  }

  return (
    <Sidebar
      className={collapsed ? "w-14" : "w-64"}
      collapsible="icon"
    >
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground">
            {isAdminContext ? 'Administração' : 'Navegação'}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-3 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center text-left hover:bg-accent"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    {!collapsed && <span>Sair</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}