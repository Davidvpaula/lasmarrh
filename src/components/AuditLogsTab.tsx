import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Search, Filter, Calendar, User, Activity } from 'lucide-react';

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  } | null;
}

export const AuditLogsTab = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    loadAuditLogs();
  }, [searchTerm, actionFilter, dateFilter]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      // Para demonstração, vamos criar alguns logs fictícios
      // Em produção, isso viria da tabela audit_logs
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          user_id: 'user-1',
          action: 'LOGIN',
          entity_type: 'auth',
          entity_id: null,
          old_values: null,
          new_values: { timestamp: new Date().toISOString() },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 Chrome/91.0',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          profiles: {
            full_name: 'Administrador Sistema',
            email: 'admin@rhpulse.com'
          }
        },
        {
          id: '2',
          user_id: 'user-1',
          action: 'UPDATE_SYSTEM_SETTINGS',
          entity_type: 'system_settings',
          entity_id: null,
          old_values: { maintenance_mode: false },
          new_values: { maintenance_mode: true },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 Chrome/91.0',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          profiles: {
            full_name: 'Administrador Sistema',
            email: 'admin@rhpulse.com'
          }
        },
        {
          id: '3',
          user_id: 'user-2',
          action: 'CREATE_USER',
          entity_type: 'profiles',
          entity_id: 'new-user-id',
          old_values: null,
          new_values: { full_name: 'Novo Admin', email: 'novoadmin@rhpulse.com', role: 'admin' },
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0 Firefox/89.0',
          created_at: new Date(Date.now() - 10800000).toISOString(),
          profiles: {
            full_name: 'David Veras de Paula',
            email: 'david@example.com'
          }
        },
        {
          id: '4',
          user_id: 'user-1',
          action: 'APPROVE_INTERVIEW',
          entity_type: 'stage_progress',
          entity_id: 'stage-id',
          old_values: { status: 'pending' },
          new_values: { status: 'approved' },
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 Chrome/91.0',
          created_at: new Date(Date.now() - 14400000).toISOString(),
          profiles: {
            full_name: 'Administrador Sistema',
            email: 'admin@rhpulse.com'
          }
        }
      ];

      // Aplicar filtros
      let filteredLogs = mockLogs;

      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (actionFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
      }

      if (dateFilter !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        
        switch (dateFilter) {
          case 'today':
            filterDate.setHours(0, 0, 0, 0);
            break;
          case 'week':
            filterDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            filterDate.setMonth(now.getMonth() - 1);
            break;
        }
        
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.created_at) >= filterDate
        );
      }

      setLogs(filteredLogs);
    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar logs de auditoria.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'default';
      case 'CREATE_USER':
        return 'default';
      case 'UPDATE_SYSTEM_SETTINGS':
        return 'secondary';
      case 'APPROVE_INTERVIEW':
        return 'default';
      case 'REJECT_INTERVIEW':
        return 'destructive';
      case 'TERMINATE_SESSION':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'LOGIN': 'Login',
      'LOGOUT': 'Logout',  
      'CREATE_USER': 'Criar Usuário',
      'UPDATE_SYSTEM_SETTINGS': 'Atualizar Configurações',
      'APPROVE_INTERVIEW': 'Aprovar Entrevista',
      'REJECT_INTERVIEW': 'Rejeitar Entrevista',
      'TERMINATE_SESSION': 'Terminar Sessão'
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="mb-4">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pesquisar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="CREATE_USER">Criar Usuário</SelectItem>
                  <SelectItem value="UPDATE_SYSTEM_SETTINGS">Atualizar Configurações</SelectItem>
                  <SelectItem value="APPROVE_INTERVIEW">Aprovar Entrevista</SelectItem>
                  <SelectItem value="REJECT_INTERVIEW">Rejeitar Entrevista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todo o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Logs de Auditoria</h3>
          <p className="text-sm text-muted-foreground">
            {logs.length} registros encontrados
          </p>
        </div>

        {logs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum log encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant={getActionColor(log.action) as any}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {log.entity_type}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {log.profiles?.full_name || 'Sistema'} 
                            ({log.profiles?.email || 'N/A'})
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>

                      {(log.old_values || log.new_values) && (
                        <div className="text-xs bg-muted p-2 rounded">
                          {log.old_values && (
                            <div>
                              <strong>Antes:</strong> {JSON.stringify(log.old_values, null, 2)}
                            </div>
                          )}
                          {log.new_values && (
                            <div>
                              <strong>Depois:</strong> {JSON.stringify(log.new_values, null, 2)}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        IP: {log.ip_address || 'N/A'} • 
                        User Agent: {log.user_agent?.substring(0, 50) || 'N/A'}...
                      </div>
                    </div>

                    <Activity className="h-5 w-5 text-muted-foreground ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};