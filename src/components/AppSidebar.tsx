import { NavLink, useLocation, useNavigate } from "react-router-dom"
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
  FolderOpen,
  Play,
  Wrench
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
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"

export function AppSidebar() {
  const { state } = useSidebar()
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname
  const collapsed = state === "collapsed"

  // Determinar se está no contexto admin ou professional
  const isAdminContext = currentPath.includes('/admin') || currentPath === '/dashboard/admin'

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent"

  const checkStageAccess = async (stageNumber: number) => {
    try {
      const { data: application } = await supabase
        .from('applications')
        .select('id')
        .eq('doctor_id', profile.user_id)
        .single();

      if (application) {
        const { data: stage } = await supabase
          .from('stage_progress')
          .select('status')
          .eq('application_id', application.id)
          .eq('stage_number', stageNumber)
          .single();

        return stage?.status !== 'locked';
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleNavigation = async (e: React.MouseEvent, url: string, title: string) => {
    // Verificar acesso apenas para Documentos (stage 3) e Treinamento (stage 4)
    if ((url === '/documents' || url === '/training/professional') && !isAdminContext) {
      e.preventDefault();
      
      const stageNumber = url === '/documents' ? 3 : 4;
      const hasAccess = await checkStageAccess(stageNumber);
      
      if (!hasAccess) {
        toast({
          title: "Acesso Restrito",
          description: "Falta a liberação do Administrador para continuar para as próximas etapas.",
          variant: "destructive",
        });
        navigate('/interview');
        return;
      } else {
        navigate(url);
      }
    }
  };

  const doctorItems = [
    { title: "Dashboard Profissional", url: "/dashboard/professional", icon: User },
    { title: "Entrevista", url: "/interview", icon: Calendar },
    { title: "Documentos", url: "/documents", icon: FileText },
    { title: "Treinamento", url: "/training/professional", icon: GraduationCap },
    { title: "Ferramentas de trabalho", url: "/work-tools", icon: Wrench },
    { title: "Meu Perfil", url: "/profile", icon: User },
  ]

  const adminItems = [
    { title: "Início", url: "/dashboard/admin", icon: Home },
    { title: "Candidatos", url: "/admin/applications", icon: Users },
    { title: "Entrevista", url: "/admin/interviews", icon: MessageSquare },
    { title: "Formulário", url: "/admin/forms", icon: FolderOpen },
    { title: "Treinamento", url: "/admin/training", icon: GraduationCap },
    { title: "Uploads", url: "/admin/uploads", icon: Upload },
    { title: "Configurações", url: "/admin/settings", icon: Settings },
    { title: "Sistema Tester", url: "/admin/system-tester", icon: Play },
  ]

  const items = isAdminContext ? adminItems : doctorItems

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  }

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} hidden lg:flex transition-all duration-300`}
      collapsible="icon"
    >

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
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                      onClick={(e) => handleNavigation(e, item.url, item.title)}
                    >
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