import { useEffect, useMemo, useRef, useState } from 'react'

const crops = ['Coentro', 'Alface', 'Salsa', 'Hortaliças', 'Outro']
const problems = ['Solo seco', 'Folhas amareladas', 'Baixa produção', 'Excesso de água', 'Perda de safra']

const problemProfiles = {
  'Solo seco': {
    ph: 5.7,
    moisture: 31,
    npk: [42, 36, 48],
    temp: 30,
    ec: 1.1,
    condition: 'Atenção moderada',
    risk: 'A baixa umidade pode reduzir a absorção de nutrientes e estressar as raízes.',
    primary: 'Reforce o monitoramento da umidade e prefira irrigações curtas em horários mais frescos.',
  },
  'Folhas amareladas': {
    ph: 5.4,
    moisture: 46,
    npk: [28, 35, 41],
    temp: 27,
    ec: 0.9,
    condition: 'Nutrientes em alerta',
    risk: 'O solo pode estar dificultando a disponibilidade de nitrogênio para a planta.',
    primary: 'Avalie correção gradual do pH e reposição equilibrada de nutrientes.',
  },
  'Baixa produção': {
    ph: 6.0,
    moisture: 42,
    npk: [38, 31, 35],
    temp: 28,
    ec: 1.3,
    condition: 'Potencial abaixo do ideal',
    risk: 'Os indicadores sugerem solo ativo, mas com equilíbrio nutricional irregular.',
    primary: 'Acompanhe NPK semanalmente e ajuste adubação conforme a cultura.',
  },
  'Excesso de água': {
    ph: 6.3,
    moisture: 79,
    npk: [34, 43, 39],
    temp: 24,
    ec: 1.8,
    condition: 'Umidade elevada',
    risk: 'O excesso de água pode compactar o solo e prejudicar a respiração das raízes.',
    primary: 'Reduza a irrigação temporariamente e melhore a drenagem do canteiro.',
  },
  'Perda de safra': {
    ph: 5.2,
    moisture: 29,
    npk: [24, 27, 30],
    temp: 32,
    ec: 0.7,
    condition: 'Risco alto',
    risk: 'Há sinais combinados de estresse hídrico, baixa fertilidade e acidez.',
    primary: 'Priorize uma correção do solo em etapas, com recuperação de umidade e nutrientes.',
  },
}

const cropAdjustments = {
  Coentro: { ph: 0.1, moisture: 2, label: 'Coentro responde bem a solo leve, úmido e sem encharcamento.' },
  Alface: { ph: 0.2, moisture: 4, label: 'Alface precisa de umidade estável para manter folhas firmes.' },
  Salsa: { ph: 0, moisture: 1, label: 'Salsa se beneficia de monitoramento frequente no início do crescimento.' },
  Hortaliças: { ph: 0.15, moisture: 3, label: 'Hortaliças pedem equilíbrio entre água, nutrientes e boa drenagem.' },
  Outro: { ph: 0, moisture: 0, label: 'Para culturas variadas, o ideal é acompanhar tendências antes de corrigir.' },
}

function makeResults(crop, problem) {
  const base = problemProfiles[problem] || problemProfiles['Solo seco']
  const cropData = cropAdjustments[crop] || cropAdjustments.Outro
  const moisture = Math.max(18, Math.min(88, base.moisture + cropData.moisture))

  return {
    ph: Number((base.ph + cropData.ph).toFixed(1)),
    moisture,
    npk: base.npk,
    temp: base.temp,
    ec: base.ec,
    condition: base.condition,
    risk: base.risk,
    primary: base.primary,
    cropNote: cropData.label,
    soilHealth: Math.max(38, Math.min(84, Math.round((moisture + base.npk[0] + base.npk[1] + base.npk[2]) / 4))),
  }
}

function makeReading(label, value, level, detail, action) {
  return { label, value, level, detail, action }
}

function levelLabel(level) {
  if (level === 'good') return 'Bom'
  if (level === 'fix') return 'Corrigir'
  return 'Atenção'
}

function getOverallLevel(results) {
  if (results.soilHealth >= 68 && results.moisture >= 40 && results.ph >= 5.6) return 'good'
  if (results.soilHealth < 46 || results.moisture < 34 || results.ph < 5.5) return 'fix'
  return 'warn'
}

function getDecisionSummary(results, hasReport = true) {
  if (!hasReport) {
    return {
      level: 'warn',
      label: 'Faça uma leitura',
      title: 'Aponte a caneta para começar',
      action: 'Abra a IA e informe a cultura e o problema percebido.',
      short: 'Sem leitura final ainda.',
    }
  }

  const level = getOverallLevel(results)
  const titles = {
    good: 'Solo em boa condição',
    warn: 'Solo precisa de atenção',
    fix: 'Corrija antes de insistir no plantio',
  }

  return {
    level,
    label: levelLabel(level),
    title: titles[level],
    action: results.primary,
    short: `${results.condition}. ${results.risk}`,
  }
}

function getReadings(results) {
  const npkAverage = Math.round(results.npk.reduce((total, item) => total + item, 0) / results.npk.length)

  return [
    makeReading(
      'Equilíbrio do solo',
      `${results.ph} pH`,
      results.ph >= 5.8 && results.ph <= 6.8 ? 'good' : results.ph >= 5.5 && results.ph <= 7.2 ? 'warn' : 'fix',
      results.ph < 5.6 ? 'O solo pode estar ácido e dificultar nutrientes.' : 'pH dentro de uma faixa mais confortável.',
      results.ph < 5.6 ? 'Corrigir pH aos poucos e repetir leitura.' : 'Manter acompanhamento semanal.',
    ),
    makeReading(
      'Água disponível',
      `${results.moisture}%`,
      results.moisture >= 45 && results.moisture <= 70 ? 'good' : results.moisture >= 35 && results.moisture <= 78 ? 'warn' : 'fix',
      results.moisture < 40 ? 'A planta pode sofrer por falta de água.' : results.moisture > 72 ? 'Há risco de encharcar as raízes.' : 'Umidade estável para o cultivo.',
      results.moisture < 40 ? 'Irrigar em horário fresco e observar resposta.' : results.moisture > 72 ? 'Reduzir irrigação e melhorar drenagem.' : 'Manter rotina atual de irrigação.',
    ),
    makeReading(
      'Força dos nutrientes',
      `${npkAverage}%`,
      npkAverage >= 42 ? 'good' : npkAverage >= 32 ? 'warn' : 'fix',
      npkAverage < 32 ? 'Faltam nutrientes para crescimento forte.' : 'Nutrientes em nível de acompanhamento.',
      npkAverage < 32 ? 'Planejar adubação equilibrada.' : 'Acompanhar folhas e crescimento.',
    ),
    makeReading(
      'Conforto das raízes',
      `${results.temp}C`,
      results.temp >= 22 && results.temp <= 29 ? 'good' : results.temp >= 18 && results.temp <= 32 ? 'warn' : 'fix',
      results.temp > 30 ? 'Calor aumenta perda de água do solo.' : 'Temperatura sem alerta forte.',
      results.temp > 30 ? 'Preferir irrigação no começo ou fim do dia.' : 'Repetir leitura em outro horário.',
    ),
    makeReading(
      'Sais e atividade',
      `${results.ec} CE`,
      results.ec >= 0.8 && results.ec <= 1.6 ? 'good' : results.ec <= 2 ? 'warn' : 'fix',
      results.ec < 0.8 ? 'Atividade baixa pode acompanhar pouca fertilidade.' : results.ec > 1.6 ? 'Sais elevados pedem atenção.' : 'Atividade do solo está equilibrada.',
      results.ec < 0.8 ? 'Cruzar com NPK antes de adubar.' : results.ec > 1.6 ? 'Evitar excesso de adubo e observar água.' : 'Manter monitoramento.',
    ),
  ]
}

function getPriorityActions(results, hasReport = true) {
  if (!hasReport) {
    return [
      'Abra a assistente IA.',
      'Informe o que você cultiva.',
      'Conte o principal problema visto na plantação.',
    ]
  }

  const readings = getReadings(results)
  const urgent = readings.filter((item) => item.level === 'fix')
  const attention = readings.filter((item) => item.level === 'warn')
  const selected = [...urgent, ...attention].slice(0, 3)

  if (selected.length === 0) {
    return ['Manter a rotina atual.', 'Repetir leitura em alguns dias.', 'Observar folhas e crescimento.']
  }

  return selected.map((item) => item.action)
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function includesAny(text, words) {
  return words.some((word) => text.includes(normalizeText(word)))
}

function detectCrop(text) {
  const normalized = normalizeText(text)
  return crops.find((item) => normalized.includes(normalizeText(item))) || ''
}

function detectProblem(text) {
  const normalized = normalizeText(text)
  const direct = problems.find((item) => normalized.includes(normalizeText(item)))

  if (direct) return direct
  if (includesAny(normalized, ['seca', 'ressecado', 'sem agua', 'sem umidade'])) return 'Solo seco'
  if (includesAny(normalized, ['amarela', 'amarelada', 'clorose'])) return 'Folhas amareladas'
  if (includesAny(normalized, ['pouca producao', 'nao produz', 'baixo rendimento'])) return 'Baixa produção'
  if (includesAny(normalized, ['encharcado', 'muita agua', 'alagado'])) return 'Excesso de água'
  if (includesAny(normalized, ['perdi', 'perda', 'morreu', 'safra ruim'])) return 'Perda de safra'
  return ''
}

function makeAssistantAnswer(input, context) {
  const text = normalizeText(input)
  const { crop, problem, report } = context
  const cropText = crop ? ` para ${crop}` : ''
  const reportText = report
    ? ` Pelo relatório atual, o pH está em ${report.ph}, a umidade em ${report.moisture}% e a saúde do solo em ${report.soilHealth}%.`
    : ''

  if (includesAny(text, ['ph', 'acidez', 'acido', 'alcalino'])) {
    return `O pH mostra se o solo está mais ácido ou mais alcalino. Em muitas hortaliças, ficar perto de uma faixa equilibrada ajuda a planta a absorver melhor os nutrientes.${reportText || ' Se você quiser, posso simular uma leitura e dizer se o pH parece adequado.'}`
  }

  if (includesAny(text, ['npk', 'nitrogenio', 'fosforo', 'potassio', 'nutriente', 'adubo', 'adubacao'])) {
    return `NPK representa três nutrientes importantes: nitrogênio para crescimento das folhas, fósforo para raízes e desenvolvimento, e potássio para resistência da planta. O SoloVitAI traduz esses números em recomendações mais simples${cropText}.`
  }

  if (includesAny(text, ['umidade', 'irrigacao', 'regar', 'agua', 'solo seco', 'seco'])) {
    return report
      ? `A umidade atual simulada é de ${report.moisture}%. ${report.moisture < 40 ? 'Isso sugere atenção: irrigue em horários mais frescos e acompanhe se o solo mantém água por mais tempo.' : report.moisture > 70 ? 'Ela está alta, então vale reduzir irrigação e observar drenagem.' : 'Está em uma faixa mais confortável, mas ainda vale monitorar diariamente.'}`
      : 'A umidade indica se a planta está recebendo água suficiente sem encharcar as raízes. Posso simular a leitura da caneta para transformar isso em uma orientação mais prática.'
  }

  if (includesAny(text, ['temperatura', 'calor', 'frio'])) {
    return report
      ? `A temperatura simulada do solo está em ${report.temp}C. Temperaturas altas podem aumentar evaporação e estresse da planta; temperaturas mais baixas podem reduzir o ritmo de crescimento.`
      : 'A temperatura do solo ajuda a entender evaporação, conforto das raízes e ritmo de crescimento. No SoloVitAI, ela entra junto com umidade e pH para evitar uma recomendação isolada.'
  }

  if (includesAny(text, ['condutividade', 'conducao', 'eletrica', 'ce', 'sal', 'sais'])) {
    return report
      ? `A condução elétrica simulada está em ${report.ec}. Ela dá uma pista sobre sais e atividade do solo. Quando fica fora do equilíbrio, a planta pode ter dificuldade para absorver água e nutrientes.`
      : 'A condução elétrica ajuda a perceber concentração de sais e atividade do solo. A assistente usa esse dado como sinal de equilíbrio, não como um número solto.'
  }

  if (includesAny(text, ['folha amarela', 'folhas amarelas', 'amarelada', 'amareladas'])) {
    return `Folhas amareladas costumam apontar para dificuldade de absorção de nutrientes, excesso de água, falta de nitrogênio ou pH desfavorável. Eu começaria olhando pH, umidade e NPK juntos, porque um dado sozinho pode enganar.`
  }

  if (includesAny(text, ['caneta', 'sensor', 'hardware', 'mede', 'medir', 'funciona'])) {
    return 'A caneta SoloVitAI representa o sensor principal do produto: ela simula leituras de pH, condução elétrica e NPK. O sensor integrado acompanha umidade e temperatura. A ideia é transformar essas leituras em uma resposta simples para o produtor.'
  }

  if (includesAny(text, ['solovitai', 'projeto', 'produto', 'startup', 'objetivo'])) {
    return 'O SoloVitAI é uma proposta de agricultura inteligente e acessível: pegar dados técnicos do solo e entregar orientações claras para pequenos agricultores, sem exigir conhecimento técnico avançado.'
  }

  if (includesAny(text, ['resultado', 'relatorio', 'diagnostico', 'ruim', 'bom', 'recomendacao', 'fazer agora'])) {
    const decision = report ? getDecisionSummary(report) : null
    return report
      ? `${decision.label}: ${decision.title}. Próxima ação: ${decision.action}`
      : 'Ainda não tenho um relatório seu. Me diga a cultura e o problema percebido, ou clique em “Começar análise guiada”, que eu gero uma simulação completa.'
  }

  if (includesAny(text, ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'ajuda'])) {
    return 'Estou por aqui. Você pode me perguntar sobre pH, NPK, umidade, folhas amareladas, irrigação, sensores ou pedir para começar uma análise guiada.'
  }

  if (problem) {
    return `Pelo que você contou sobre ${problem.toLowerCase()}${cropText}, eu olharia primeiro para umidade, pH e NPK. Posso gerar ou explicar o relatório simulado para deixar isso mais claro.`
  }

  return 'Consigo ajudar com dúvidas sobre solo, cultivo, sensores e o funcionamento do SoloVitAI. Para assuntos fora da agricultura, vou preferir te trazer de volta para o cuidado do solo e para a análise da plantação.'
}

function LogoMark() {
  return (
    <div className="logoMark" aria-label="SoloVitAI">
      <span className="logoIcon">
        <span />
      </span>
      <span>SoloVitAI</span>
    </div>
  )
}

function SmartPenVisual({ active }) {
  return (
    <div className={`penScene ${active ? 'isActive' : ''}`} aria-label="Caneta inteligente SoloVitAI">
      <div className="scanBeam" />
      <div className="soilPlate">
        <span />
        <span />
        <span />
      </div>
      <div className="smartPen">
        <div className="penCap">
          <span className="leafWindow" />
        </div>
        <div className="penBody">
          <span className="statusDot" />
          <span className="sensorLine" />
          <span className="brandStrip">AI</span>
        </div>
        <div className="penTip" />
      </div>
      <div className="penHalo" />
    </div>
  )
}

const tabs = [
  { id: 'inicio', label: 'Início' },
  { id: 'ia', label: 'IA' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'hardware', label: 'Hardware' },
  { id: 'relatorio', label: 'Relatório' },
  { id: 'projeto', label: 'Projeto' },
]

function AppNavigation({ activeTab, onTabChange, hasReport, analyzing }) {
  return (
    <header className="appTopBar">
      <LogoMark />
      <nav className="tabList" aria-label="Navegação principal">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? 'active' : ''}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            type="button"
          >
            {tab.label}
            {tab.id === 'relatorio' && hasReport && <span className="tabStatus" />}
            {tab.id === 'dashboard' && analyzing && <span className="tabPulse" />}
          </button>
        ))}
      </nav>
    </header>
  )
}

function HeroExperience({ onStart, onOpenDashboard, onOpenProject, hasReport }) {
  return (
    <section className="hero section" id="inicio" style={{ zoom: 0.7 }}>
      <div className="particleField" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, index) => (
          <span key={index} style={{ '--i': index }} />
        ))}
      </div>
      <div className="heroGrid">
        <div className="heroCopy">
          <span className="eyebrow">Caneta inteligente SoloVitAI</span>
          <h1>Leia o solo. Entenda o problema. Aja com segurança.</h1>
          <p>
            SoloVitAI transforma leituras da caneta em orientação simples para o produtor: o que está bom,
            o que precisa de atenção e o que deve ser corrigido antes de perder a plantação.
          </p>
          <div className="heroActions">
            <button className="primaryButton" onClick={onStart}>Abrir assistente IA</button>
            <button className="secondaryButton" onClick={onOpenDashboard}>Ver dashboard</button>
            <button className="secondaryButton subtleButton" onClick={onOpenProject}>Entender projeto</button>
          </div>
          <div className="heroStats" aria-label="Indicadores de impacto">
            <span><strong>Entender</strong> leitura clara do solo</span>
            <span><strong>Prevenir</strong> perdas no canteiro</span>
            <span><strong>{hasReport ? 'Orientar' : 'Guiar'}</strong> decisão do produtor</span>
          </div>
          <div className="brandPromise">
            <span>Produto demonstrativo premium</span>
            <span>Sem backend ou API paga</span>
            <span>Feito para pitch da marca</span>
          </div>
        </div>
        <SmartPenVisual active={hasReport} />
      </div>
    </section>
  )
}

function ProblemSection() {
  const items = [
    ['Perdas evitáveis', 'Sinais simples do solo chegam tarde ao produtor e viram prejuízo na colheita.'],
    ['Pouco acesso técnico', 'Análises tradicionais podem ser caras, lentas ou difíceis de interpretar.'],
    ['Decisões no escuro', 'Sem dados claros, irrigação e correção do solo viram tentativa e erro.'],
  ]

  return (
    <section className="section lightSection" id="problema">
      <div className="sectionIntro">
        <span className="eyebrow">O problema</span>
        <h2>O pequeno produtor precisa de clareza, não de mais complexidade.</h2>
      </div>
      <div className="problemGrid">
        {items.map(([title, text]) => (
          <article className="insightCard" key={title}>
            <span className="lineIcon" />
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function HardwareSection() {
  const capabilities = [
    ['Equilíbrio do solo', 'Traduz pH em uma leitura simples: bom, atenção ou corrigir.'],
    ['Força dos nutrientes', 'Resume NPK como sinal prático para crescimento da planta.'],
    ['Água disponível', 'Mostra se falta água, se está bom ou se há risco de encharcar.'],
    ['Conforto das raízes', 'Usa temperatura para orientar horário e cuidado com irrigação.'],
    ['Sais e atividade', 'Ajuda a evitar excesso de adubo e desequilíbrio no solo.'],
  ]

  return (
    <section className="section hardwareSection" id="hardware">
      <div className="hardwareVisual">
        <SmartPenVisual active />
      </div>
      <div className="hardwareCopy">
        <span className="eyebrow">Produto SoloVitAI</span>
        <h2>A caneta é a marca, o sensor e a ponte com o produtor.</h2>
        <p>
          Em vez de mostrar números soltos, a caneta SoloVitAI entrega uma resposta que qualquer pessoa
          entende: o estado do solo e a próxima ação recomendada.
        </p>
        <div className="productBadge">Leitura simulada SoloVitAI</div>
        <div className="capabilityGrid">
          {capabilities.map(([title, text]) => (
            <article key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Gauge({ label, value, unit, tone = 'green' }) {
  return (
    <div className="gauge">
      <div className="gaugeHeader">
        <span>{label}</span>
        <strong>{value}{unit}</strong>
      </div>
      <div className="gaugeTrack">
        <span className={tone} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}

function DecisionCard({ reading }) {
  return (
    <article className={`decisionCard ${reading.level}`}>
      <div>
        <span className="decisionLabel">{reading.label}</span>
        <strong>{reading.value}</strong>
      </div>
      <span className="statusChip">{levelLabel(reading.level)}</span>
      <p>{reading.detail}</p>
      <small>{reading.action}</small>
    </article>
  )
}

function SoilDashboard({ results, analyzing, hasReport }) {
  const current = results || makeResults('Coentro', 'Solo seco')
  const decision = getDecisionSummary(current, hasReport)
  const readings = hasReport
    ? getReadings(current)
    : [
        makeReading('Equilíbrio do solo', '--', 'warn', 'Aguardando leitura de pH.', 'Faça uma análise com a caneta.'),
        makeReading('Água disponível', '--', 'warn', 'Aguardando leitura de umidade.', 'Informe a cultura na IA.'),
        makeReading('Força dos nutrientes', '--', 'warn', 'Aguardando leitura de NPK.', 'Conte o sinal visto na plantação.'),
        makeReading('Conforto das raízes', '--', 'warn', 'Aguardando temperatura do solo.', 'Gere o relatório SoloVitAI.'),
        makeReading('Sais e atividade', '--', 'warn', 'Aguardando condução elétrica.', 'Use os dados como demonstração guiada.'),
      ]
  const actions = getPriorityActions(current, hasReport)

  return (
    <section className="section dashboardSection" id="dashboard">
      <div className="sectionIntro">
        <span className="eyebrow">Painel SoloVitAI</span>
        <h2>Como está seu solo agora?</h2>
      </div>
      <div className={`dashboardShell decisionShell ${analyzing ? 'isScanning' : ''}`}>
        <div className={`soloCard ${decision.level}`}>
          <div>
            <span className="productBadge">Orientação simples para o produtor</span>
            <h3>{analyzing ? 'Lendo o solo com a caneta...' : decision.title}</h3>
            <p>{decision.short}</p>
          </div>
          <strong>{analyzing ? 'Lendo' : decision.label}</strong>
        </div>

        <div className="fieldSummary">
          <span><strong>{hasReport ? results.crop : 'Sem leitura'}</strong>Cultura</span>
          <span><strong>{hasReport ? results.problem : 'Use a IA'}</strong>Sinal percebido</span>
          <span><strong>{current.soilHealth}%</strong>Confiança visual</span>
        </div>

        <div className="decisionGrid">
          {readings.map((reading) => (
            <DecisionCard key={reading.label} reading={reading} />
          ))}
        </div>

        <div className="nextActions">
          <span>O que fazer agora</span>
          <ol>
            {actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function ChatAssistant({ onAnalyzing, onComplete, onReset, onViewReport }) {
  const [messages, setMessages] = useState([])
  const [step, setStep] = useState('hello')
  const [crop, setCrop] = useState('')
  const [problem, setProblem] = useState('')
  const [currentReport, setCurrentReport] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      pushBot('Olá! Sou a assistente do SoloVitAI. Posso conduzir uma análise guiada ou responder perguntas sobre solo, sensores, pH, umidade e produtividade.')
      setTimeout(() => {
        pushBot('Se quiser, clique em “Começar análise guiada”. Se preferir, pode digitar sua dúvida livremente.')
        setStep('open')
      }, 900)
    }, 700)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  function pushBot(text) {
    setMessages((current) => [...current, { from: 'bot', text }])
  }

  function pushUser(text) {
    setMessages((current) => [...current, { from: 'user', text }])
  }

  function respond(text, delay = 420) {
    setBusy(true)
    setTimeout(() => {
      pushBot(text)
      setBusy(false)
    }, delay)
  }

  function beginGuidedAnalysis() {
    setStep('crop')
    respond('Claro. Para começar a análise, o que você cultiva hoje?')
  }

  function chooseCrop(value, silent = false) {
    setCrop(value)
    if (!silent) pushUser(value)
    setStep('wait')
    setTimeout(() => {
      pushBot(`Entendi. ${value === 'Outro' ? 'Vou usar uma leitura geral para sua cultura.' : `${value} é uma cultura sensível ao equilíbrio do solo.`}`)
      setTimeout(() => {
        pushBot('Você percebeu algum problema recente na plantação?')
        setStep('problem')
      }, 700)
    }, 500)
  }

  function chooseProblem(value, silent = false) {
    setProblem(value)
    if (!silent) pushUser(value)
    runAnalysis(crop, value)
  }

  function runAnalysis(selectedCrop = crop, selectedProblem = problem) {
    if (!selectedCrop) {
      setStep('crop')
      respond('Antes de gerar a análise, me diga a cultura. Pode ser Coentro, Alface, Salsa, Hortaliças ou Outro.')
      return
    }

    if (!selectedProblem) {
      setStep('problem')
      respond('Já sei a cultura. Agora me diga o principal sinal percebido: solo seco, folhas amareladas, baixa produção, excesso de água ou perda de safra.')
      return
    }

    setStep('analyzing')
    setBusy(true)
    onAnalyzing(true)
    setTimeout(() => pushBot('Certo. Vou simular a leitura da caneta SoloVitAI no solo.'), 400)
    setTimeout(() => pushBot('Estou cruzando pH, umidade, temperatura, NPK e condução elétrica para gerar uma orientação simples.'), 1400)
    setTimeout(() => {
      const results = makeResults(selectedCrop, selectedProblem)
      const report = { crop: selectedCrop, problem: selectedProblem, ...results }
      const decision = getDecisionSummary(results)
      pushBot(`${decision.label}: ${decision.title}. Próxima ação: ${decision.action}`)
      setBusy(false)
      setStep('done')
      onAnalyzing(false)
      setCurrentReport(report)
      onComplete(report)
    }, 3000)
  }

  function resetConversation() {
    setCrop('')
    setProblem('')
    setCurrentReport(null)
    setStep('open')
    onAnalyzing(false)
    onReset()
    respond('Vamos refazer do zero. Você pode começar uma análise guiada ou me contar diretamente a cultura e o problema que percebeu.')
  }

  function handleFreeText(rawValue) {
    const value = rawValue.trim()
    if (!value || busy) return

    pushUser(value)
    setInputValue('')

    const normalized = normalizeText(value)
    const detectedCrop = detectCrop(value)
    const detectedProblem = detectProblem(value)

    if (includesAny(normalized, ['refazer', 'reiniciar', 'comecar de novo', 'nova analise'])) {
      resetConversation()
      return
    }

    if (includesAny(normalized, ['ver relatorio', 'abrir relatorio', 'mostrar relatorio'])) {
      respond(currentReport ? 'O relatório já está pronto logo abaixo. Você também pode me perguntar o que cada indicador significa.' : 'Ainda não gerei um relatório. Me diga a cultura e o problema percebido para eu simular a análise.')
      if (currentReport) setTimeout(onViewReport, 450)
      return
    }

    if (detectedCrop && detectedCrop !== crop) {
      setCrop(detectedCrop)
      if (!detectedProblem && !problem) {
        setStep('problem')
        respond(`Perfeito, vou considerar ${detectedCrop}. Qual problema você percebeu na plantação?`)
        return
      }
    }

    if (detectedProblem && detectedProblem !== problem) {
      setProblem(detectedProblem)
    }

    if (includesAny(normalized, ['gerar analise', 'fazer analise', 'analisar', 'diagnostico', 'diagnosticar', 'escanear'])) {
      runAnalysis(detectedCrop || crop, detectedProblem || problem)
      return
    }

    if (detectedCrop && detectedProblem) {
      setTimeout(() => runAnalysis(detectedCrop, detectedProblem), 260)
      return
    }

    if (detectedProblem && !crop) {
      setStep('crop')
      respond(`Entendi o sinal de ${detectedProblem.toLowerCase()}. Para gerar uma análise melhor, qual cultura você está cultivando?`)
      return
    }

    const answer = makeAssistantAnswer(value, {
      crop: detectedCrop || crop,
      problem: detectedProblem || problem,
      report: currentReport,
    })
    respond(answer)
  }

  function submitMessage(event) {
    event.preventDefault()
    handleFreeText(inputValue)
  }

  const suggestionButtons = (() => {
    if (step === 'crop') return crops.map((item) => ({ label: item, action: () => chooseCrop(item) }))
    if (step === 'problem') return problems.map((item) => ({ label: item, action: () => chooseProblem(item) }))
    if (step === 'analyzing') return [{ label: 'Escaneamento em andamento', action: null }]
    if (step === 'done') {
      return [
        { label: 'Ver relatório final', action: onViewReport },
        { label: 'Explicar meu resultado', action: () => handleFreeText('Explique meu resultado') },
        { label: 'Refazer análise', action: resetConversation },
      ]
    }
    return [
      { label: 'Começar análise guiada', action: beginGuidedAnalysis },
      { label: 'O que é NPK?', action: () => handleFreeText('O que é NPK?') },
      { label: 'Como funciona a caneta?', action: () => handleFreeText('Como funciona a caneta?') },
    ]
  })()

  return (
    <section className="section chatSection" id="chat">
      <div className="chatCopy">
        <span className="eyebrow">Assistente simulada ampla</span>
        <h2>Pergunte livremente ou deixe a assistente conduzir a análise.</h2>
        <p>
          O fluxo continua gratuito e local no navegador, mas agora reconhece intenções, lembra o contexto e
          responde dúvidas comuns sobre solo, sensores e recomendações.
        </p>
      </div>
      <div className="chatPanel">
        <div className="chatHeader">
          <LogoMark />
          <span className="onlineDot">Online</span>
        </div>
        <div className="messageList" ref={listRef}>
          {messages.map((message, index) => (
            <div className={`message ${message.from}`} key={`${message.text}-${index}`}>
              {message.text}
            </div>
          ))}
          {busy && (
            <div className="typingBubble">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>
        <div className="quickReplies">
          {suggestionButtons.map((item) => (
            item.action ? (
              <button key={item.label} onClick={item.action} disabled={busy}>{item.label}</button>
            ) : (
              <span className="analysisPill" key={item.label}>{item.label}</span>
            )
          ))}
        </div>
        <form className="chatComposer" onSubmit={submitMessage}>
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Digite: meu solo está seco, o que é pH, gerar análise..."
            aria-label="Mensagem para a assistente SoloVitAI"
            disabled={busy && step === 'analyzing'}
          />
          <button type="submit" disabled={!inputValue.trim() || busy}>Enviar</button>
        </form>
      </div>
    </section>
  )
}

function FinalReport({ report, onAskAI }) {
  const current = report || makeResults('Coentro', 'Solo seco')
  const hasReport = Boolean(report)
  const decision = getDecisionSummary(current, hasReport)
  const readings = hasReport
    ? getReadings(current)
    : [
        makeReading('Equilíbrio do solo', '--', 'warn', 'Aguardando leitura.', 'Abra a IA.'),
        makeReading('Água disponível', '--', 'warn', 'Aguardando leitura.', 'Informe a cultura.'),
        makeReading('Força dos nutrientes', '--', 'warn', 'Aguardando leitura.', 'Conte o problema.'),
        makeReading('Conforto das raízes', '--', 'warn', 'Aguardando leitura.', 'Gere a análise.'),
        makeReading('Sais e atividade', '--', 'warn', 'Aguardando leitura.', 'Veja o laudo.'),
      ]
  const actions = getPriorityActions(current, hasReport)

  return (
    <section className="section reportSection" id="relatorio">
      <div className="reportHeader">
        <span className="eyebrow">Laudo simples SoloVitAI</span>
        <h2>{hasReport ? 'Uma resposta clara para decidir o próximo cuidado.' : 'Faça uma leitura com a caneta para gerar seu laudo.'}</h2>
      </div>
      <div className={`reportCard ${hasReport ? 'ready' : ''}`}>
        <div className="reportTop">
          <div>
            <span>{hasReport ? `Cultura: ${report.crop}` : 'Aguardando leitura SoloVitAI'}</span>
            <h3>{decision.title}</h3>
          </div>
          <strong className={decision.level}>{decision.label}</strong>
        </div>

        <div className="plainSummary">
          <p>{hasReport ? decision.short : 'O relatório aparecerá aqui depois que a IA receber a cultura e o problema percebido na plantação.'}</p>
          <button className="secondaryButton reportButton" onClick={onAskAI}>
            {hasReport ? 'Tirar dúvida com a IA' : 'Abrir assistente IA'}
          </button>
        </div>

        <div className="reportMetrics">
          {readings.map((reading) => (
            <span className={reading.level} key={reading.label}>
              <strong>{levelLabel(reading.level)}</strong>
              {reading.label}
              <small>{reading.value}</small>
            </span>
          ))}
        </div>

        <div className="recommendationGrid">
          <article>
            <span>Prioridade 1</span>
            <p>{actions[0]}</p>
          </article>
          <article>
            <span>Prioridade 2</span>
            <p>{actions[1]}</p>
          </article>
          <article>
            <span>Observação</span>
            <p>{hasReport ? current.cropNote : actions[2]}</p>
          </article>
        </div>
      </div>
    </section>
  )
}

function ClosingSection() {
  return (
    <section className="section closingSection">
      <div>
        <span className="eyebrow">SoloVitAI</span>
        <h2>Tecnologia que ajuda o produtor antes que o problema vire perda.</h2>
        <p>
          Uma visão de agricultura mais preventiva, sustentável e acessível: dados técnicos viram orientações
          claras, e o cuidado com o solo vira uma decisão diária mais segura.
        </p>
      </div>
    </section>
  )
}

function ProjectOverview() {
  return (
    <div className="projectStack">
      <ProblemSection />
      <ClosingSection />
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('inicio')
  const [report, setReport] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const dashboardResults = useMemo(() => report || makeResults('Coentro', 'Solo seco'), [report])

  function openTab(tabId) {
    setActiveTab(tabId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="appShell">
      <AppNavigation
        activeTab={activeTab}
        analyzing={analyzing}
        hasReport={Boolean(report)}
        onTabChange={openTab}
      />

      <div className="tabSurface">
        <div className={`tabPanel ${activeTab === 'inicio' ? 'active' : ''}`} aria-hidden={activeTab !== 'inicio'}>
          <HeroExperience
            hasReport={Boolean(report) || analyzing}
            onOpenDashboard={() => openTab('dashboard')}
            onOpenProject={() => openTab('projeto')}
            onStart={() => openTab('ia')}
          />
        </div>

        <div className={`tabPanel ${activeTab === 'ia' ? 'active' : ''}`} aria-hidden={activeTab !== 'ia'}>
          <ChatAssistant
            onAnalyzing={setAnalyzing}
            onComplete={setReport}
            onReset={() => setReport(null)}
            onViewReport={() => openTab('relatorio')}
          />
        </div>

        <div className={`tabPanel ${activeTab === 'dashboard' ? 'active' : ''}`} aria-hidden={activeTab !== 'dashboard'}>
          <SoilDashboard results={dashboardResults} analyzing={analyzing} hasReport={Boolean(report)} />
        </div>

        <div className={`tabPanel ${activeTab === 'hardware' ? 'active' : ''}`} aria-hidden={activeTab !== 'hardware'}>
          <HardwareSection />
        </div>

        <div className={`tabPanel ${activeTab === 'relatorio' ? 'active' : ''}`} aria-hidden={activeTab !== 'relatorio'}>
          <FinalReport report={report} onAskAI={() => openTab('ia')} />
        </div>

        <div className={`tabPanel ${activeTab === 'projeto' ? 'active' : ''}`} aria-hidden={activeTab !== 'projeto'}>
          <ProjectOverview />
        </div>
      </div>
    </main>
  )
}
