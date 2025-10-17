# TESTE MECÂNICO COMPLETO - PLATAFORMA LASMAR TELEMED

## Data do Teste: 2025-10-17

---

## 1. AUTENTICAÇÃO

### 1.1 Login do Profissional da Saúde
- [ ] Acessar `/auth` ou `/professional/auth`
- [ ] Inserir credenciais válidas
- [ ] Verificar redirecionamento para `/dashboard/professional`
- [ ] Verificar se o perfil é carregado corretamente
- [ ] Verificar se o role é 'doctor'

### 1.2 Login do Administrador
- [ ] Acessar `/admin/auth`
- [ ] Inserir credenciais válidas
- [ ] Verificar redirecionamento para `/dashboard/admin`
- [ ] Verificar se o perfil é carregado corretamente
- [ ] Verificar se o role é 'admin'

### 1.3 Cadastro de Novo Profissional
- [ ] Acessar `/auth` → aba "Cadastro"
- [ ] Preencher todos os campos obrigatórios
- [ ] Submeter formulário
- [ ] Verificar se recebe email de confirmação
- [ ] Verificar se aplicação é criada automaticamente
- [ ] Verificar se stage 1 é marcado como 'completed'
- [ ] Verificar se stage 2 é marcado como 'available'

---

## 2. DASHBOARD DO PROFISSIONAL

### 2.1 Visualização de Etapas
- [ ] Acessar `/dashboard/professional`
- [ ] Verificar se todas as 6 etapas são exibidas
- [ ] Verificar cores de status corretas:
  - Verde: Completo
  - Azul: Disponível
  - Cinza: Bloqueado
- [ ] Verificar progresso geral (%)

### 2.2 Navegação entre Etapas
- [ ] Clicar em "Iniciar Entrevista" → Deve ir para `/interview`
- [ ] Tentar acessar "Documentos" quando bloqueado → Deve mostrar toast de erro
- [ ] Tentar acessar "Treinamento" quando bloqueado → Deve mostrar toast de erro

---

## 3. ETAPA 2: ENTREVISTA

### 3.1 Formulário de Entrevista
- [ ] Acessar `/interview`
- [ ] Verificar se campos dinâmicos são carregados do banco
- [ ] Preencher todos os campos obrigatórios
- [ ] Verificar validação de campos (email, telefone, etc.)
- [ ] Submeter formulário
- [ ] Verificar se dados são salvos em `stage_progress.notes`
- [ ] Verificar se status muda para 'in_progress'

### 3.2 Disponibilidade
- [ ] Marcar dias da semana disponíveis
- [ ] Marcar horários disponíveis
- [ ] Verificar se dados são salvos corretamente

---

## 4. ETAPA 3: DOCUMENTOS

### 4.1 Formulário de Dados Pessoais
- [ ] Acessar `/documents`
- [ ] Verificar se campos dinâmicos são carregados do banco
- [ ] Preencher todos os campos
- [ ] Verificar validação (CPF, RG, etc.)

### 4.2 Download de Contratos
- [ ] Verificar se seção "Download do Contrato" aparece
- [ ] Verificar se documentos são listados do banco (`signature_documents`)
- [ ] Clicar em "Baixar" → Deve abrir PDF em nova aba
- [ ] Verificar se documentos obrigatórios têm badge "Obrigatório"

### 4.3 Upload de Documentos Assinados
- [ ] Na seção "Documentos para Assinatura"
- [ ] Clicar em "Baixar Documento"
- [ ] Selecionar arquivo PDF assinado
- [ ] Clicar em "Enviar Assinado"
- [ ] Verificar se arquivo é enviado para `candidate-documents` bucket
- [ ] Verificar se registro é criado em `signed_documents`
- [ ] Verificar se status muda para "Assinado"

### 4.4 Upload de Documentos Gerais
- [ ] Fazer upload de RG, CPF, CRM, Diploma, etc.
- [ ] Verificar se arquivos são enviados para storage
- [ ] Verificar se registros são criados em `documents` table
- [ ] Clicar em "Enviar Documentos"
- [ ] Verificar se redireciona para `/training/professional`

---

## 5. ETAPA 4: TREINAMENTO

### 5.1 Listagem de Vídeos
- [ ] Acessar `/training/professional`
- [ ] Verificar se vídeos são carregados do banco (`training_videos`)
- [ ] Verificar se progresso é carregado (`training_progress`)
- [ ] Verificar badges de status:
  - "Não Iniciado"
  - "Assistindo"
  - "Concluído"

### 5.2 Assistir Vídeo
- [ ] Clicar em "Assistir Vídeo"
- [ ] Verificar se player do YouTube carrega
- [ ] Verificar se simulação de progresso funciona
- [ ] Verificar se barra de progresso atualiza

### 5.3 Marcar como Concluído
- [ ] Clicar em "Marcar como Concluído"
- [ ] Confirmar no dialog
- [ ] Verificar se status muda para "Concluído"
- [ ] Verificar se `completed_at` é preenchido no banco

### 5.4 Desmarcar Conclusão
- [ ] Em vídeo concluído, clicar em "Desmarcar Conclusão"
- [ ] Verificar se status volta para não concluído
- [ ] Verificar se `completed_at` é removido do banco

### 5.5 Reassistir Vídeo
- [ ] Em vídeo concluído, clicar em "Reassistir Vídeo"
- [ ] Verificar se player abre novamente
- [ ] Verificar se progresso é resetado

### 5.6 Finalizar Treinamento
- [ ] Completar todos os vídeos
- [ ] Clicar em "Finalizar Treinamento"
- [ ] Verificar se stage_progress é atualizado para 'completed'

---

## 6. DASHBOARD DO ADMIN

### 6.1 Visão Geral
- [ ] Acessar `/dashboard/admin`
- [ ] Verificar estatísticas:
  - Total de candidatos
  - Candidatos ativos
  - Taxa de aprovação
- [ ] Verificar gráfico de candidatos por etapa
- [ ] Verificar cards de ação rápida

### 6.2 Navegação
- [ ] Clicar em "Ver Candidatos" → `/admin/applications`
- [ ] Clicar em "Formulários Pendentes" → `/admin/forms`
- [ ] Clicar em "Entrevistas para Revisar" → `/admin/interviews`

---

## 7. GESTÃO DE CANDIDATOS

### 7.1 Visualizar Candidatos
- [ ] Acessar `/admin/applications`
- [ ] Verificar se todos os candidatos são listados
- [ ] Verificar filtros (todos, pendentes, aprovados, reprovados)
- [ ] Verificar busca por nome

### 7.2 Visualizar Detalhes de Candidato
- [ ] Clicar em "Ver Detalhes"
- [ ] Verificar se mostra informações do perfil
- [ ] Verificar se mostra progresso das etapas
- [ ] Verificar se mostra documentos enviados

### 7.3 Aprovar Etapa
- [ ] Em candidato com etapa 'in_progress'
- [ ] Clicar em "Aprovar Etapa"
- [ ] Verificar se:
  - Stage atual muda para 'approved'
  - Próxima stage muda para 'available'
- [ ] Verificar se profissional pode acessar próxima etapa

### 7.4 Rejeitar Etapa
- [ ] Clicar em "Rejeitar Etapa"
- [ ] Adicionar comentário
- [ ] Verificar se stage muda para 'rejected'
- [ ] Verificar se profissional recebe notificação

---

## 8. VISUALIZAÇÃO DE ENTREVISTAS

### 8.1 Listar Entrevistas
- [ ] Acessar `/admin/interviews`
- [ ] Verificar se todas as entrevistas são listadas
- [ ] Verificar se mostra dados preenchidos pelo profissional

### 8.2 Visualizar Respostas
- [ ] Clicar em um candidato
- [ ] Verificar se todas as respostas são exibidas
- [ ] Verificar disponibilidade selecionada

---

## 9. VISUALIZAÇÃO DE FORMULÁRIOS

### 9.1 Listar Formulários
- [ ] Acessar `/admin/forms`
- [ ] Verificar se todos os formulários são listados
- [ ] Verificar se mostra dados preenchidos

### 9.2 Visualizar Documentos Assinados
- [ ] Clicar em "Ver Documentos"
- [ ] Verificar se lista documentos assinados
- [ ] Clicar em "Baixar" → Deve abrir PDF assinado
- [ ] Verificar status (Pendente/Assinado)

---

## 10. EDITAR CAMPOS DE ENTREVISTA

### 10.1 Adicionar Campo
- [ ] Acessar `/admin/edit-interview`
- [ ] Clicar em "Adicionar Campo"
- [ ] Preencher:
  - Nome do campo
  - Label
  - Tipo
  - Obrigatório
  - Placeholder
  - Help text
- [ ] Salvar
- [ ] Verificar se campo é criado em `interview_fields`
- [ ] Verificar se aparece na entrevista do profissional

### 10.2 Editar Campo
- [ ] Clicar em "Editar" em um campo
- [ ] Modificar informações
- [ ] Salvar
- [ ] Verificar se mudanças são refletidas

### 10.3 Ativar/Desativar Campo
- [ ] Usar switch "Ativo"
- [ ] Verificar se campo some da entrevista quando desativado

### 10.4 Excluir Campo
- [ ] Clicar em "Excluir"
- [ ] Confirmar exclusão
- [ ] Verificar se campo é removido do banco

---

## 11. EDITAR CAMPOS DE FORMULÁRIO

### 11.1 Gerenciar Campos Personalizados
- [ ] Acessar `/admin/edit-forms`
- [ ] Tab "Campos do Formulário"
- [ ] Adicionar campo personalizado
- [ ] Verificar tipos disponíveis (texto, email, telefone, CPF, data, seleção)
- [ ] Configurar opções para tipo "seleção"

### 11.2 Gerenciar Documentos para Assinatura
- [ ] Tab "Documentos para Assinatura"
- [ ] Clicar em "Adicionar Documento"
- [ ] Preencher:
  - Título
  - Descrição
  - Arquivo PDF
  - Obrigatório
  - Ordem
- [ ] Fazer upload do PDF
- [ ] Salvar
- [ ] Verificar se documento aparece para profissional

### 11.3 Editar Documento
- [ ] Clicar em "Editar"
- [ ] Modificar informações
- [ ] Trocar arquivo PDF (se necessário)
- [ ] Salvar

### 11.4 Ativar/Desativar Documento
- [ ] Usar switch "Ativo"
- [ ] Verificar se documento some quando desativado

---

## 12. EDITAR TREINAMENTOS

### 12.1 Adicionar Vídeo de Treinamento
- [ ] Acessar `/admin/edit-training`
- [ ] Clicar em "Adicionar Vídeo"
- [ ] Preencher:
  - Título
  - Descrição
  - URL do YouTube
  - Duração (minutos)
  - Ordem
- [ ] Salvar
- [ ] Verificar se vídeo é criado em `training_videos`

### 12.2 Editar Vídeo
- [ ] Clicar em "Editar"
- [ ] Modificar informações
- [ ] Salvar

### 12.3 Reordenar Vídeos
- [ ] Usar campo "Ordem"
- [ ] Verificar se ordem muda na lista do profissional

### 12.4 Ativar/Desativar Vídeo
- [ ] Usar switch "Ativo"
- [ ] Verificar se vídeo some quando desativado

---

## 13. VISUALIZAR TREINAMENTOS

### 13.1 Ver Progresso dos Profissionais
- [ ] Acessar `/admin/training`
- [ ] Verificar lista de profissionais
- [ ] Ver quantos vídeos cada um completou
- [ ] Ver % de conclusão

### 13.2 Ver Detalhes de Progresso
- [ ] Clicar em profissional
- [ ] Ver lista de vídeos com status
- [ ] Ver data de conclusão de cada vídeo

---

## 14. NAVEGAÇÃO E SIDEBAR

### 14.1 Sidebar do Profissional
- [ ] Verificar itens do menu:
  - Dashboard Profissional
  - Entrevista
  - Documentos
  - Treinamento
  - Ferramentas de trabalho
  - Meu Perfil
  - Sair
- [ ] Verificar ícones
- [ ] Verificar highlight da rota ativa
- [ ] Verificar bloqueio de acesso (Documentos e Treinamento)

### 14.2 Sidebar do Admin
- [ ] Verificar grupos:
  - **Início**: Dashboard
  - **Candidatos**: Ver Candidatos, Ver Entrevista, Ver Formulário, Ver Treinamentos
  - **Gestão de Ferramentas**: Editar Entrevista, Editar Formulário, Editar Treinamento, Configurações, Sistema Tester
- [ ] Verificar navegação
- [ ] Verificar ícones

### 14.3 Responsividade
- [ ] Testar em mobile (< 768px)
- [ ] Verificar se sidebar colapsa
- [ ] Verificar se botão de menu aparece
- [ ] Verificar se header mobile funciona

---

## 15. SISTEMA DE NOTIFICAÇÕES (TOAST)

### 15.1 Notificações de Sucesso
- [ ] Ao salvar dados com sucesso
- [ ] Ao fazer upload com sucesso
- [ ] Ao aprovar/rejeitar etapa

### 15.2 Notificações de Erro
- [ ] Ao falhar validação
- [ ] Ao falhar upload
- [ ] Ao tentar acessar rota bloqueada

---

## 16. FLUXO COMPLETO (END-TO-END)

### 16.1 Jornada do Profissional
1. [ ] Cadastro no sistema
2. [ ] Login
3. [ ] Preencher entrevista
4. [ ] Aguardar aprovação do admin
5. [ ] Preencher documentos e fazer uploads
6. [ ] Aguardar aprovação do admin
7. [ ] Assistir vídeos de treinamento
8. [ ] Marcar todos como concluídos
9. [ ] Finalizar treinamento
10. [ ] Aguardar aprovação final

### 16.2 Jornada do Admin
1. [ ] Login
2. [ ] Ver novo candidato no dashboard
3. [ ] Revisar entrevista
4. [ ] Aprovar etapa 2
5. [ ] Aguardar profissional completar documentos
6. [ ] Revisar documentos e documentos assinados
7. [ ] Aprovar etapa 3
8. [ ] Aguardar profissional completar treinamento
9. [ ] Revisar progresso do treinamento
10. [ ] Aprovar etapa 4
11. [ ] Marcar como aprovado final

---

## PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### ✅ Corrigido: Tela branca no login do profissional
- **Problema**: Loading infinito esperando perfil
- **Solução**: Melhorado loading state no App.tsx

### ✅ Corrigido: Erro "duplicate key" ao marcar vídeo como concluído
- **Problema**: Tentativa de inserir registro duplicado
- **Solução**: Verificar se existe antes de inserir/atualizar

### ✅ Corrigido: Vídeos sendo marcados automaticamente como assistidos
- **Problema**: Ao atingir 100% era marcado automaticamente
- **Solução**: Removida marcação automática, apenas manual

### ⚠️ Pendente: Documentos para assinatura não aparecem
- **Problema**: Nenhum documento cadastrado
- **Ação**: Admin precisa cadastrar documentos em `/admin/edit-forms`

### ⚠️ Pendente: Admin não vê respostas da entrevista
- **Solução**: Criar interface em `/admin/interviews` para visualizar

### ⚠️ Pendente: Admin não vê dados do formulário
- **Solução**: Criar interface em `/admin/forms` para visualizar

---

## CHECKLIST DE SEGURANÇA

- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS impedem acesso não autorizado
- [ ] Validação de input no cliente
- [ ] Validação de input no servidor (RLS)
- [ ] Arquivos enviados para storage privado
- [ ] URLs de storage não são previsíveis
- [ ] Senhas não são logadas no console
- [ ] Tokens de autenticação não são expostos

---

## PERFORMANCE

- [ ] Página inicial carrega em < 3 segundos
- [ ] Navegação entre páginas é instantânea
- [ ] Upload de arquivos mostra progresso
- [ ] Imagens são otimizadas
- [ ] Consultas ao banco são eficientes

---

## ACESSIBILIDADE

- [ ] Todos os botões têm labels descritivos
- [ ] Formulários têm labels associados
- [ ] Cores têm contraste adequado
- [ ] Navegação por teclado funciona
- [ ] Mensagens de erro são claras

---

## CONCLUSÃO

**Status Geral**: ⚠️ Parcialmente Funcional

**Principais Gaps**:
1. Admin não consegue visualizar respostas de entrevista dos profissionais
2. Admin não consegue visualizar dados de formulário dos profissionais
3. Admin não consegue visualizar progresso detalhado de treinamento
4. Nenhum documento para assinatura está cadastrado

**Próximas Ações**:
1. Criar interfaces de visualização para admin
2. Melhorar feedback visual nas aprovações
3. Adicionar notificações em tempo real
4. Implementar sistema de comentários admin-profissional
