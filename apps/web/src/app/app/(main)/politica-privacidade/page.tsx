import Link from 'next/link';

const privacySections = [
  {
    title: '1. Quais dados coletamos',
    items: [
      'Nome completo.',
      'CPF.',
      'Celular.',
      'Unidade de saúde vinculada, quando aplicável.',
      'Informações de agendamento, solicitações, protocolos e atendimentos realizados no aplicativo.',
      'Dados técnicos necessários ao funcionamento do sistema, como data, hora, dispositivo e registros de acesso.'
    ]
  },
  {
    title: '2. Para que usamos seus dados',
    items: [
      'Identificar você no aplicativo.',
      'Permitir acesso seguro aos serviços digitais.',
      'Registrar solicitações, agendamentos e acompanhamentos.',
      'Vincular seu cadastro à unidade correta.',
      'Enviar avisos, confirmações e atualizações relacionadas aos serviços públicos.',
      'Cumprir obrigações legais, administrativas e de interesse público.'
    ]
  },
  {
    title: '3. Base legal do tratamento',
    text:
      'O tratamento dos dados pode ocorrer com base no consentimento do titular, no cumprimento de obrigação legal ou regulatória, na execução de políticas públicas e na prestação de serviços públicos ao cidadão.'
  },
  {
    title: '4. Compartilhamento de dados',
    text:
      'Seus dados não são vendidos nem compartilhados para fins comerciais. Eles podem ser acessados apenas por setores autorizados da administração pública e por prestadores técnicos necessários à operação do sistema, sempre com finalidade legítima e controle de segurança.'
  },
  {
    title: '5. Segurança das informações',
    text:
      'Adotamos medidas técnicas e administrativas para proteger os dados contra acesso não autorizado, perda, alteração, uso indevido ou divulgação indevida.'
  },
  {
    title: '6. Seus direitos',
    items: [
      'Confirmação da existência de tratamento dos seus dados.',
      'Acesso aos seus dados.',
      'Correção de dados incompletos, inexatos ou desatualizados.',
      'Informações sobre uso e compartilhamento.',
      'Revogação do consentimento, quando aplicável.',
      'Exclusão ou bloqueio de dados, quando permitido pela legislação.'
    ]
  },
  {
    title: '7. Retenção dos dados',
    text:
      'Os dados serão mantidos pelo tempo necessário para cumprir as finalidades do aplicativo, obrigações legais, auditoria, segurança e continuidade dos serviços públicos.'
  },
  {
    title: '8. Contato',
    text:
      'Para dúvidas ou solicitações sobre privacidade e proteção de dados, procure os canais oficiais da prefeitura ou a unidade responsável pelo atendimento.'
  },
  {
    title: '9. Alterações nesta política',
    text:
      'Esta política poderá ser atualizada para refletir melhorias no sistema, mudanças legais ou ajustes nos serviços oferecidos.'
  }
] as const;

export default function PrivacyPolicyPage() {
  return (
    <main className="privacy-policy-page">
      <article className="privacy-policy-card">
        <header className="privacy-policy-header">
          <Link href="/app/login" className="pwa-access-back">
            ← Voltar
          </Link>
          <p className="eyebrow">Prefeitura na Mão</p>
          <h1>Política de Privacidade</h1>
          <p>
            Última atualização: 05/07/2026. A Prefeitura na Mão respeita a sua privacidade e trata seus dados pessoais
            com responsabilidade, transparência e segurança, conforme a Lei Geral de Proteção de Dados Pessoais (Lei nº
            13.709/2018).
          </p>
        </header>

        <div className="privacy-policy-content">
          {privacySections.map((section) => (
            <section key={section.title} className="privacy-policy-section">
              <h2>{section.title}</h2>
              {'text' in section ? <p>{section.text}</p> : null}
              {'items' in section ? (
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
