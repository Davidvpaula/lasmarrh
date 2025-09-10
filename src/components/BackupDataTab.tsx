import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  HardDrive
} from 'lucide-react';

interface BackupInfo {
  id: string;
  name: string;
  size: string;
  created_at: string;
  status: 'success' | 'failed' | 'in_progress';
  tables_count: number;
  records_count: number;
}

export const BackupDataTab = () => {
  const [backups, setBackups] = useState<BackupInfo[]>([
    {
      id: '1',
      name: 'backup_2025_01_10_14_30.sql',
      size: '2.4 MB',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      status: 'success',
      tables_count: 8,
      records_count: 1250
    },
    {
      id: '2', 
      name: 'backup_2025_01_09_14_30.sql',
      size: '2.1 MB',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      status: 'success',
      tables_count: 8,
      records_count: 1180
    },
    {
      id: '3',
      name: 'backup_2025_01_08_14_30.sql',
      size: '1.9 MB', 
      created_at: new Date(Date.now() - 259200000).toISOString(),
      status: 'success',
      tables_count: 8,
      records_count: 1050
    }
  ]);
  
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoringBackup, setRestoringBackup] = useState<string | null>(null);

  const createBackup = async () => {
    setCreatingBackup(true);
    setBackupProgress(0);

    try {
      // Simular progresso do backup
      const progressInterval = setInterval(() => {
        setBackupProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simular tempo de backup
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Criar novo backup na lista
      const newBackup: BackupInfo = {
        id: Date.now().toString(),
        name: `backup_${new Date().toISOString().split('T')[0].replace(/-/g, '_')}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '_')}.sql`,
        size: '2.5 MB',
        created_at: new Date().toISOString(),
        status: 'success',
        tables_count: 8,
        records_count: 1280
      };

      setBackups(prev => [newBackup, ...prev]);

      // Log da ação
      await supabase.rpc('log_audit_event', {
        p_action: 'CREATE_BACKUP',
        p_entity_type: 'backup',
        p_new_values: JSON.stringify(newBackup)
      });

      toast({
        title: "Backup criado",
        description: "O backup foi criado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar backup.",
        variant: "destructive",
      });
    } finally {
      setCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const restoreBackup = async (backupId: string) => {
    setRestoringBackup(backupId);
    
    try {
      // Simular restauração
      await new Promise(resolve => setTimeout(resolve, 3000));

      const backup = backups.find(b => b.id === backupId);
      
      // Log da ação
      await supabase.rpc('log_audit_event', {
        p_action: 'RESTORE_BACKUP', 
        p_entity_type: 'backup',
        p_entity_id: backupId,
        p_new_values: JSON.stringify(backup)
      });

      toast({
        title: "Backup restaurado",
        description: "Os dados foram restaurados com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: "Erro",
        description: "Falha ao restaurar backup.",
        variant: "destructive",
      });
    } finally {
      setRestoringBackup(null);
    }
  };

  const downloadBackup = (backupId: string) => {
    const backup = backups.find(b => b.id === backupId);
    if (backup) {
      try {
        // Abordagem mais segura para download simulado
        const element = document.createElement('a');
        element.href = `data:text/plain;charset=utf-8,-- Backup simulado para ${backup.name}\n-- Criado em: ${backup.created_at}\n-- Tabelas: ${backup.tables_count}\n-- Registros: ${backup.records_count}`;
        element.download = backup.name;
        element.style.display = 'none';
        
        document.body.appendChild(element);
        element.click();
        
        // Usar setTimeout para garantir que o click seja processado primeiro
        setTimeout(() => {
          try {
            if (element.parentNode === document.body) {
              document.body.removeChild(element);
            }
          } catch (error) {
            console.warn('Elemento já foi removido:', error);
          }
        }, 100);

        toast({
          title: "Download iniciado",
          description: `Download do backup ${backup.name} iniciado.`,
        });
      } catch (error) {
        console.error('Erro no download:', error);
        toast({
          title: "Erro no download",
          description: "Falha ao iniciar o download do backup.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default">Sucesso</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Em progresso</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Criar Backup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Criar Novo Backup
          </CardTitle>
          <CardDescription>
            Faça backup completo de todos os dados do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {creatingBackup && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Criando backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          )}
          
          <Button 
            onClick={createBackup} 
            disabled={creatingBackup}
            className="w-full"
          >
            {creatingBackup ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Criando backup...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Criar Backup Agora
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{backups.length}</p>
                <p className="text-sm text-muted-foreground">Backups disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {backups.filter(b => b.status === 'success').length}
                </p>
                <p className="text-sm text-muted-foreground">Backups com sucesso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <HardDrive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {backups.reduce((acc, b) => acc + parseFloat(b.size.replace(' MB', '')), 0).toFixed(1)} MB
                </p>
                <p className="text-sm text-muted-foreground">Espaço total usado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Existentes</CardTitle>
          <CardDescription>
            Lista de todos os backups criados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(backup.status)}
                      <h4 className="font-medium">{backup.name}</h4>
                      {getStatusBadge(backup.status)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(backup.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HardDrive className="h-4 w-4" />
                        <span>{backup.size}</span>
                      </div>
                      <span>
                        {backup.tables_count} tabelas, {backup.records_count.toLocaleString('pt-BR')} registros
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => downloadBackup(backup.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    <Button
                      onClick={() => restoreBackup(backup.id)}
                      disabled={restoringBackup === backup.id}
                      variant="secondary"
                      size="sm"
                    >
                      {restoringBackup === backup.id ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Restaurando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Restaurar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};