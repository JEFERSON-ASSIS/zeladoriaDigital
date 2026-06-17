Ordem ideal para mandar para ele:

Criar monorepo com Next.js, NestJS, Prisma, PostgreSQL e Docker.

Criar autenticação e perfis.

Criar módulo cidadão.

Criar módulo ocorrências.

Criar painel prefeitura.

Criar OS/equipe de campo.

Criar PWA.

Criar WhatsApp.

Criar relatórios.

Criar testes e documentação.

Visual da I7AI
Como você já tem identidade própria, eu manteria:

Sidebar


‌


Cor:
#0F172A
Dark.

Cor principal


‌


Azul:
#2563EB
Cor secundária


‌


Roxo:
#7C3AED
Cards


‌


Branco
Border-radius: 20px
Shadow leve
Dashboard Executivo
Ao entrar:



‌


┌────────────┐
│  1532      │
│ Ocorrências│
└────────────┘
┌────────────┐
│  532       │
│ Em execução│
└────────────┘
┌────────────┐
│  812       │
│ Concluídas │
└────────────┘
Sem tabela logo de cara.

Primeiro:



‌


Cards
Mapa
Gráficos
Depois:



‌


Listagens
Tela de Ocorrências
Ao invés disso:



‌


Tabela enorme
Faria:

Kanban


‌


Aberto
Em análise
Encaminhado
Execução
Concluído
Arrastar e soltar.

Semelhante ao Trello.

Tela de Mapa
Essa é uma das telas mais importantes.

Layout:



‌


+---------------------+
|        MAPA         |
|                     |
|  ● ● ● ● ● ●        |
|                     |
+---------------------+
Painel lateral
 

Frontend: Next.js
Backend: NestJS
Banco: PostgreSQL
Arquivos: MinIO
Deploy: Docker Compose

 

Tabelas principais:



users
citizens
municipalities
departments
categories
occurrences
occurrence_attachments
occurrence_movements
service_orders
messages
notifications
audit_logs
ratings
 

Arquitetura ideal


zeladoria/
├── apps/
│   ├── web/        # Next.js
│   └── api/        # NestJS
├── packages/
│   └── shared/     # tipos e validações compartilhadas
├── docker/
├── docker-compose.yml
└── README.md
 

Semana 1 — Dias 1 a 7
Base do sistema
Desenvolver:



‌


Estrutura do projeto frontend
Estrutura do projeto backend
Banco PostgreSQL
Autenticação
Cadastro de usuários internos
Cadastro de cidadãos
Perfis e permissões
Cadastro de secretarias
Cadastro de categorias
Cadastro de bairros
Layout base administrativo
Layout base cidadão
Entregável:



‌


Sistema com login, usuários, perfis e cadastros básicos funcionando
Semana 2 — Dias 8 a 14
Portal do Cidadão
Desenvolver:



‌


Cadastro do cidadão
Login do cidadão
Recuperação de senha
Dashboard do cidadão
Nova ocorrência
Formulário com categoria, descrição e endereço
Upload de fotos
Upload de vídeos
Consulta de protocolo
Listagem de minhas solicitações
Entregável:



‌


Cidadão consegue criar conta e abrir uma ocorrência básica
Semana 3 — Dias 15 a 21
Geolocalização e Painel Interno
Desenvolver:



‌


Captura de latitude e longitude
Mapa para seleção do local
Visualização da ocorrência no mapa
Central de triagem
Lista de ocorrências internas
Detalhe da ocorrência
Alteração de status
Encaminhamento para secretaria
Histórico de movimentações
Entregável:



‌


Prefeitura consegue receber, visualizar, classificar e encaminhar ocorrências
Semana 4 — Dias 22 a 28
Workflow e Ordem de Serviço
Desenvolver:



‌


Fluxo de status completo
Controle de prioridade
Controle de SLA
Criação de Ordem de Serviço
Atribuição de equipe
Tela de equipe de campo
Registro de execução
Foto antes
Foto depois
Finalização da OS
Conclusão da ocorrência
Entregável:



‌


Fluxo completo da ocorrência: cidadão abre, prefeitura analisa, secretaria executa e finaliza
Semana 5 — Dias 29 a 35
PWA, WhatsApp e Comunicação
Desenvolver:



‌


Manifest PWA
Service Worker
Ícones do aplicativo
Tela offline simples
Instalação no Android/iPhone
Chat cidadão-prefeitura
Mensagens internas
Notificações no painel
Integração WhatsApp
Mensagem de protocolo criado
Mensagem de mudança de status
Mensagem de conclusão
Entregável:



‌


Sistema operando como PWA e notificando o cidadão via WhatsApp
Semana 6 — Dias 36 a 42
Relatórios e Dashboard Executivo
Desenvolver:



‌


Dashboard executivo
Indicadores por status
Indicadores por categoria
Indicadores por bairro
Indicadores por secretaria
Relatório de SLA
Relatório de produtividade
Relatório de satisfação
Exportação PDF
Exportação Excel/CSV
Mapa gerencial
Heatmap básico
Entregável:



‌


Gestores conseguem acompanhar indicadores e emitir relatórios
Semana 7 — Dias 43 a 49
Inteligência e Priorização
Desenvolver:



‌


Regras de pontuação
Priorização automática
Ranking de demandas
Detecção simples de duplicidade
Sugestão de secretaria responsável
Sugestão de categoria
Resumo gerencial com IA
Alertas gerenciais
Entregável:



‌


Sistema gera prioridade automática, ranking e alertas de gestão

O objeto é uma plataforma com aplicativo web/PWA, módulo administrativo, mapa georreferenciado, indicadores de desempenho, integração com sistemas municipais e suporte técnico contínuo, voltada para registro, acompanhamento e priorização de ocorrências urbanas. O edital fala em atender cerca de 30.150 usuários, entre cidadãos, gestores e equipes operacionais.

Funcionalidades principais exigidas
1. Registro de ocorrências urbanas

O cidadão precisa conseguir registrar problemas da cidade, como:

iluminação pública;
buracos;
limpeza urbana;
poda de árvores;
outros problemas urbanos.

O registro deve permitir:

descrição detalhada;
envio de fotos;
envio de vídeos;
interface intuitiva para o cidadão.
2. Geolocalização

A plataforma deve identificar com precisão o local da ocorrência registrada, integrada a serviços de geolocalização.

3. Acompanhamento de status em tempo real

Deve existir painel para acompanhar o andamento das solicitações, com pelo menos estes status:

em aberto;
em andamento;
resolvida.
4. Comunicação direta entre cidadão e prefeitura

O sistema deve ter canal integrado de comunicação entre cidadãos e os órgãos públicos responsáveis, mantendo histórico de interações/mensagens.

5. Feedback e avaliação do atendimento

Precisa ter módulo para coletar avaliações dos serviços prestados, permitindo medir satisfação dos usuários e melhorar os atendimentos.

6. Alertas e notificações

Deve ter notificações automáticas sobre:

alteração de status;
comunicados;
manutenções programadas;
informações relevantes.
7. Relatórios e indicadores

O sistema precisa gerar:

relatórios analíticos;
indicadores estratégicos;
métricas de desempenho operacional;
métricas de desempenho administrativo.
8. Mapa georreferenciado

Deve possuir mapa interativo com as ocorrências registradas e filtros por:

status;
bairro;
período;
categoria;
secretaria responsável.
9. Plataforma web e PWA

A solução deve funcionar via ambiente web e também como PWA, acessível por navegador moderno em celular e desktop, sem precisar instalar por loja de aplicativos.

10. Segurança da informação e LGPD

Deve implementar mecanismos de segurança, confidencialidade e proteção de dados pessoais conforme a LGPD.

11. Armazenamento seguro e escalável

O edital exige infraestrutura segura, escalável e adequada para armazenamento, processamento e gestão das informações coletadas.

12. Integração com sistemas municipais

A plataforma deve ter capacidade de integração com sistemas municipais, incluindo, mas não limitado a:

obras;
planejamento urbano;
orçamento;
protocolos administrativos.
13. Suporte técnico contínuo

Deve haver suporte técnico especializado durante todo o período contratual, incluindo manutenção:

corretiva;
preventiva;
adaptativa;
evolutiva.
Funcionalidades administrativas
14. Cadastro de secretarias, categorias e assuntos

O sistema precisa permitir cadastro e gerenciamento de:

secretarias;
categorias;
assuntos.

Isso serve para direcionar corretamente as demandas.

15. Gestão de demandas

Deve ter módulo para classificação automatizada e priorização de ocorrências com critérios parametrizáveis, como:

relevância;
urgência;
localização;
apoio social.
16. Indicadores de resultado

O sistema deve gerar automaticamente métricas sobre:

tempo de atendimento;
efetividade das intervenções;
volume de demandas;
engajamento da população.
17. Integração com WhatsApp

O edital exige possibilidade de envio automático de notificações sobre o andamento das demandas por aplicativos de mensagem, inclusive WhatsApp, observadas as políticas da plataforma utilizada.

Diferenciais que o edital também cobra

Apesar de chamar de “diferenciais”, o texto diz que a plataforma deverá contemplar essas características:

18. Sistema de apoio às demandas

Cidadãos devem poder apoiar ocorrências já registradas, para indicar demandas com maior relevância social.

19. Ranqueamento inteligente de prioridades

O sistema deve priorizar automaticamente demandas com maior número de apoios ou maior relevância social.

20. Direcionamento automático das demandas

As solicitações devem ser encaminhadas automaticamente para as secretarias responsáveis, com base em regras de negócio parametrizadas.

21. Notificação de demandas próximas

O sistema deve identificar ocorrências já registradas em regiões próximas, para evitar duplicidade de solicitações.

22. Integração de dados operacionais e territoriais

A plataforma deve consolidar dados operacionais, territoriais e analíticos, dando visão sistêmica das ações de zeladoria municipal.

Implantação, treinamento e operação

Além do sistema em si, o edital exige:

desenvolvimento;
parametrização;
testes;
implantação;
treinamento remoto;
suporte técnico contínuo durante todo o contrato.

Também exige:

ambiente de testes para validação;
cronograma detalhado em até 5 dias úteis após a Ordem de Serviço;
início dos trabalhos em até 10 dias úteis após a OS;
implantação concluída em até 60 dias;
reuniões técnicas e videoconferências;
treinamento remoto ao vivo;
chat online durante treinamento;
gravações dos treinamentos disponíveis para consulta posterior;
suporte remoto contínuo durante toda a vigência contratual.
Resumo em formato de módulos do sistema

Na prática, o sistema precisa ter estes módulos:

Portal/PWA do Cidadão
registrar ocorrência;
anexar fotos/vídeos;
geolocalizar;
acompanhar status;
conversar com a prefeitura;
avaliar atendimento;
apoiar demandas existentes.
Painel Administrativo
visualizar demandas;
classificar ocorrências;
priorizar automaticamente;
direcionar para secretarias;
configurar categorias, assuntos e secretarias;
alterar status;
responder cidadãos.
Mapa Georreferenciado
mapa das ocorrências;
filtros por bairro, status, período, categoria e secretaria.
Módulo de Priorização
ranqueamento inteligente;
priorização por urgência, localização, relevância e apoio social.
Módulo de Comunicação
histórico de mensagens;
notificações automáticas;
integração com WhatsApp;
alertas de mudança de status.
Módulo de Relatórios
indicadores de desempenho;
tempo médio de atendimento;
volume de demandas;
efetividade das ações;
engajamento da população.
Módulo de Integração
integração com sistemas municipais;
obras;
planejamento urbano;
orçamento;
protocolo administrativo.
Módulo Técnico/Operacional
ambiente de testes;
parametrização;
segurança LGPD;
armazenamento seguro;
suporte contínuo;
manutenção corretiva, preventiva, adaptativa e evolutiva.

Conclusão: o edital não pede só um app simples de chamados. Ele pede uma plataforma completa de zeladoria com PWA, painel de gestão, mapa, priorização inteligente, apoio social, notificações via WhatsApp, relatórios, integração com sistemas municipais, treinamento e suporte contínuo.