import { getLegalRulesByTag } from "@/lib/legal-knowledge/rules";
import type {
  ContractKnowledgeScan,
  DetectedSignal,
  LegalRule,
} from "@/lib/legal-knowledge/types";

interface SignalPattern {
  id: string;
  tag: string;
  descripcion: string;
  /** Patrones sobre texto normalizado (sin acentos, minúsculas). */
  patterns: RegExp[];
}

const SIGNAL_PATTERNS: SignalPattern[] = [
  {
    id: "sig-jurisdiccion-extranjera",
    tag: "jurisdiccion_extranjera",
    descripcion: "Cláusula de jurisdicción o tribunales extranjeros",
    patterns: [
      /\bjurisdiction\b.{0,80}\b(courts?|state of|country)\b/,
      /\bexclusive jurisdiction\b/,
      /\bcompetencia (exclusiva )?de los tribunales\b.{0,60}\b(extranj|del estado|de los estados unidos|de [a-z]+)\b/,
      /\bsomet(er|en)se a la jurisdiccion\b.{0,60}\b(extranj|internacional|del estado)\b/,
      /\bforo (competente )?(del|de la|en el) (estado|pais|territorio)\b/,
    ],
  },
  {
    id: "sig-arbitraje-extranjero",
    tag: "arbitraje_extranjero",
    descripcion: "Arbitraje con sede o reglas extranjeras",
    patterns: [
      /\barbitra(je|tion)\b.{0,80}\b(londres|new york|paris|singapur|londres|geneva|londres)\b/,
      /\barbitra(je|tion)\b.{0,40}\b(internacional|extranjer|en el extranjero)\b/,
      /\bicc\b.{0,40}\barbitra/,
      /\blcia\b/,
    ],
  },
  {
    id: "sig-limitacion-responsabilidad",
    tag: "limitacion_responsabilidad",
    descripcion: "Limitación o exclusión de responsabilidad",
    patterns: [
      /\bno (sera|seran|será|serán) responsab(le|les)\b/,
      /\bexclu(y|i)(e|a|ir|ye)\b.{0,40}\bresponsab/,
      /\blimit(a|e|acion|ación)\b.{0,40}\bresponsab/,
      /\bunder no circumstances\b.{0,40}\bliab/,
      /\bto the maximum extent permitted by law\b/,
      /\ben ningun caso\b.{0,40}\bresponsab/,
    ],
  },
  {
    id: "sig-exclusion-danos",
    tag: "exclusion_danos",
    descripcion: "Exclusión de daños directos, indirectos o consecuenciales",
    patterns: [
      /\bdaños (indirectos|consecuenciales|emergentes|lucro cesante)\b/,
      /\b(indirect|consequential|incidental|special) damages\b/,
      /\bperdidas (indirectas|consecuenciales)\b/,
    ],
  },
  {
    id: "sig-renuncia-derechos",
    tag: "renuncia_derechos",
    descripcion: "Renuncia amplia a derechos o reclamos",
    patterns: [
      /\brenuncia\b.{0,50}\b(cualquier|todo|todos los) (derecho|reclamo|accion|acción)\b/,
      /\bwaive(s|d)?\b.{0,40}\b(rights?|claims?)\b/,
      /\bnada mas (que|a) reclamar\b/,
      /\brenuncia expresa\b.{0,40}\b(derecho|reclamo)\b/,
    ],
  },
  {
    id: "sig-moneda-extranjera",
    tag: "moneda_extranjera",
    descripcion: "Precio u obligación en moneda extranjera",
    patterns: [
      /\b(en|pagadera en|denominada en) (dolares|dólares|usd|eur|euros|u\.?s\.?d\.?)\b/,
      /\b(usd|u\.?s\.?d\.?|eur)\b.{0,30}\b(monto|precio|importe|valor)\b/,
      /\bmoneda extranjera\b/,
      /\bforeign currency\b/,
    ],
  },
  {
    id: "sig-renovacion-automatica",
    tag: "renovacion_automatica",
    descripcion: "Renovación automática o tácita",
    patterns: [
      /\brenovacion (automatica|automática|tacita|tácita)\b/,
      /\bprorroga (automatica|automática|tacita|tácita)\b/,
      /\bautomatically renew/,
      /\bauto-?renew/,
      /\bse prorroga automaticamente\b/,
    ],
  },
  {
    id: "sig-penalidad",
    tag: "penalidad",
    descripcion: "Multas o penalidades contractuales",
    patterns: [
      /\b(penalidad|penalidades|multa|multas|sancion economica|sanción económica)\b/,
      /\bclausula penal\b/,
      /\bpenalty\b.{0,30}\b(fee|amount|payment)\b/,
      /\bindemnizacion (fija|predeterminada)\b/,
    ],
  },
  {
    id: "sig-confidencialidad-indefinida",
    tag: "confidencialidad_indefinida",
    descripcion: "Confidencialidad sin plazo o por tiempo indefinido",
    patterns: [
      /\bconfidencialidad\b.{0,80}\b(indefinid|perpetu|permanente|sin plazo)\b/,
      /\bconfidential(ity)?\b.{0,60}\b(indefinite|perpetual|permanent)\b/,
      /\bobligacion de confidencialidad\b.{0,40}\b(no cesar|permanecer)\b/,
    ],
  },
  {
    id: "sig-contrato-adhesion",
    tag: "contrato_adhesion",
    descripcion: "Indicios de contrato de adhesión o T&C",
    patterns: [
      /\bterminos y condiciones\b/,
      /\btérminos y condiciones\b/,
      /\bterms (and|&) conditions\b/,
      /\bcontrato de adhesion\b/,
      /\bcontrato de adhesión\b/,
      /\bacepto los terminos\b/,
      /\bclickwrap\b/,
      /\bformulario (unico|único)\b/,
    ],
  },
  {
    id: "sig-consumo",
    tag: "consumo",
    descripcion: "Indicios de relación de consumo",
    patterns: [
      /\b(consumidor|usuario final|cliente final)\b/,
      /\bdefensa del consumidor\b/,
      /\bley 24\.?240\b/,
      /\bldc\b/,
      /\bproveedor\b.{0,40}\b(consumidor|usuario)\b/,
    ],
  },
  {
    id: "sig-labor-encubierto",
    tag: "labor_encubierto",
    descripcion: "Indicios de prestación personal con subordinación",
    patterns: [
      /\b(prestacion|prestación) (de servicios|personal)\b.{0,80}\b(exclusiv|horario|subordin|dependenc)/,
      /\bcontrato de (locacion|locación) de servicios\b/,
      /\bfreelancer\b.{0,60}\b(exclusiv|horario|subordin)/,
      /\bmonotributo\b.{0,60}\b(exclusiv|horario|jornada)\b/,
      /\bjornada\b.{0,40}\b(de|laboral|lunes|martes)\b/,
      /\bhorario (de|laboral|de ingreso)\b/,
      /\bexclusividad\b.{0,40}\b(prestador|contratado|consultor)\b/,
    ],
  },
  {
    id: "sig-prestacion-servicios",
    tag: "prestacion_servicios",
    descripcion: "Contrato de prestación o locación de servicios",
    patterns: [
      /\b(prestacion|prestación) de servicios\b/,
      /\blocacion de servicios\b/,
      /\blocación de servicios\b/,
      /\bservices agreement\b/,
      /\bcontrato de servicios\b/,
    ],
  },
  {
    id: "sig-resolucion-inmediata",
    tag: "resolucion_inmediata",
    descripcion: "Resolución de pleno derecho o inmediata",
    patterns: [
      /\b(de pleno derecho|automaticamente|automáticamente)\b.{0,40}\b(resolv|rescind|termin)\b/,
      /\bresolucion (inmediata|automatica|automática)\b/,
      /\bterminate (immediately|automatically)\b/,
      /\bcualquier incumplimiento\b.{0,40}\b(resolv|rescind|termin)\b/,
    ],
  },
  {
    id: "sig-modificacion-unilateral",
    tag: "modificacion_unilateral",
    descripcion: "Modificación unilateral de precio o condiciones",
    patterns: [
      /\bmodific(ar|acion|ación)\b.{0,40}\b(unilateral|a su solo criterio|a su exclusivo criterio)\b/,
      /\bse reserva el derecho de modificar\b/,
      /\bmay (modify|change|update)\b.{0,40}\b(terms|prices|conditions)\b/,
      /\bajust(e|ar) (unilateral|automaticamente|automáticamente)\b.{0,30}\b(precio|tarifa|honorario)\b/,
    ],
  },
  {
    id: "sig-carga-probatoria",
    tag: "carga_probatoria",
    descripcion: "Inversión de carga probatoria",
    patterns: [
      /\bcarga de la prueba\b.{0,40}\b(contratante|cliente|consumidor)\b/,
      /\bburden of proof\b.{0,40}\b(customer|client|user)\b/,
    ],
  },
  {
    id: "sig-pacto-comisorio",
    tag: "pacto_comisorio",
    descripcion: "Pacto comisorio o cláusula resolutoria",
    patterns: [
      /\bpacto comisorio\b/,
      /\bclausula resolutoria\b/,
      /\bcláusula resolutoria\b/,
      /\bresolucion ipso facto\b/,
    ],
  },
  {
    id: "sig-sin-preaviso",
    tag: "sin_preaviso",
    descripcion: "Terminación sin preaviso definido",
    patterns: [
      /\b(sin preaviso|sin aviso previo)\b.{0,40}\b(rescind|termin|finaliz)\b/,
      /\bterminate (at any time|without notice)\b/,
    ],
  },
  {
    id: "sig-prescripcion",
    tag: "prescripcion_contractual",
    descripcion: "Plazos de prescripción contractuales",
    patterns: [
      /\brenuncia\b.{0,40}\b(prescripcion|prescripción)\b/,
      /\bplazo de prescripcion\b.{0,40}\b(acort|reduc|elim)\b/,
      /\bwaive\b.{0,30}\bstatute of limitations\b/,
    ],
  },
];

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function extractEvidence(rawText: string, pattern: RegExp, maxLen = 180): string | null {
  const normalized = normalizeForMatch(rawText);
  const match = pattern.exec(normalized);
  if (!match || match.index === undefined) {
    return null;
  }

  const start = Math.max(0, match.index - 40);
  const end = Math.min(normalized.length, match.index + match[0].length + 80);
  const snippet = rawText.slice(start, end).replace(/\s+/g, " ").trim();
  if (snippet.length <= maxLen) {
    return snippet;
  }
  return `${snippet.slice(0, maxLen - 3)}...`;
}

function collectSignals(text: string): DetectedSignal[] {
  const normalized = normalizeForMatch(text);
  const found: DetectedSignal[] = [];
  const seenIds = new Set<string>();

  for (const signalDef of SIGNAL_PATTERNS) {
    for (const pattern of signalDef.patterns) {
      pattern.lastIndex = 0;
      if (!pattern.test(normalized)) {
        continue;
      }

      if (seenIds.has(signalDef.id)) {
        break;
      }

      seenIds.add(signalDef.id);
      found.push({
        id: signalDef.id,
        tag: signalDef.tag,
        descripcion: signalDef.descripcion,
        evidencia: extractEvidence(text, pattern),
      });
      break;
    }
  }

  return found;
}

function resolveApplicableRules(signals: DetectedSignal[]): LegalRule[] {
  const tags = new Set(signals.map((signal) => signal.tag));
  const rulesById = new Map<string, LegalRule>();

  for (const tag of tags) {
    for (const rule of getLegalRulesByTag(tag)) {
      rulesById.set(rule.id, rule);
    }
  }

  return [...rulesById.values()].sort((a, b) => {
    const riskOrder = { alto: 0, medio: 1, bajo: 2 };
    return riskOrder[a.riesgo] - riskOrder[b.riesgo];
  });
}

export function scanContractKnowledge(text: string): ContractKnowledgeScan {
  const signals = collectSignals(text);
  const applicableRules = resolveApplicableRules(signals);

  return {
    signals,
    applicableRules,
    scannedAt: new Date().toISOString(),
  };
}
