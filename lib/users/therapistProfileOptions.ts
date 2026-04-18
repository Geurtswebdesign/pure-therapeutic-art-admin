export type TherapistProfileOptionSets = {
  specializations: string[];
  targetGroups: string[];
  languages: string[];
  methods: string[];
};

export const THERAPIST_PROFILE_OPTION_SETS: TherapistProfileOptionSets = {
  specializations: [
    "ACT (Acceptance and Commitment Therapy)",
    "Ademtherapeut/ breathwork facilitator",
    "Ambulant hulpverlener",
    "Antroposofisch kunstzinnig therapeut",
    "Cognitief coach",
    "Counselor/ psychosociaal therapeut",
    "Danstherapeut/ bewegingstherapeut",
    "Dierentherapeut",
    "Dramatherapeut",
    "Ego-state / parts work",
    "EMDR-therapeut",
    "Energetisch therapeut",
    "Gestalttherapeut",
    "Gezinsbegeleider/ gezinscoach",
    "Healing therapeut",
    "Holistisch therapeut",
    "Hypnotherapeut",
    "Imagery Rescripting",
    "Imaginatie therapeut",
    "Innerlijk kind therapeuten",
    "Integratief therapeut",
    "Integratieve kindertherapie",
    "Jeugd- en jongerenwerker",
    "Jeugdhulpverlener",
    "Jeugdzorgwerker",
    "Jungiaanse analytische therapie",
    "Kinder- en jeugdpsycholoog",
    "Kinder- en jeugdtherapeut",
    "Klinisch psycholoog",
    "Levenscoach/ holistisch coach",
    "Lichaamsgerichte therapie",
    "Maatschappelijk werker",
    "Magnetiseur",
    "Mindfulness-based therapeut",
    "Muziektherapeut",
    "NLP-therapeuten/ master coach",
    "Orthopedagoog",
    "Paardentherapeut",
    "Psycholoog",
    "Psychomotorisch kindertherapeut",
    "Psychomotorisch therapeut",
    "Regressietherapeut",
    "Reiki therapeut",
    "Reïncarnatietherapeut",
    "Relatietherapie/ koppeltherapie",
    "Sandplay therapeut",
    "Seksuoloog (vaak postmaster specialisatie)",
    "Social worker",
    "Speltherapeut",
    "Symbooldrama therapeut",
    "Systeemtherapeut (gezinstherapie)",
    "Toegepaste psycholoog",
    "Transpersoonlijk therapeut",
    "Traumabeeldtherapeut",
    "Traumatherapeut (klinisch, evidence-based)",
    "Tuin- en natuurtherapeut",
    "Vaktherapeut beeldend",
    "Verlies- en rouwtherapeut",
    "Wandelcoach",
  ],
  targetGroups: [
    "Jonge kinderen (0–6 jaar)",
    "Kinderen (6–12 jaar)",
    "Jongeren/ adolescenten (12–18 jaar)",
    "Volwassenen (18–65 jaar)",
    "Ouderen (65+)",
    "Gezinnen",
    "Relaties/ koppels",
    "Groepen",
    "Psychische problematiek",
    "Negatief zelfbeeld",
    "Ingrijpende levensgebeurtenissen",
    "Verlies en rouw",
    "Verslavingsproblematiek",
    "Mensen met beperking",
    "Justitiële doelgroep",
    "Chronische ziekte/ pijn",
    "Stress gerelateerde klachten",
  ],
  languages: [
    "Nederlands",
    "Engels",
    "Duits",
    "Frans",
    "Spaans",
    "Arabisch",
    "Turks",
  ],
  methods: [
    "Beeldende therapie",
    "Creatieve therapie",
    "Gesprekstherapie",
    "Mindfulness",
    "Bilaterale oefeningen",
    "Sensorisch werken",
    "Sensopathisch werken",
    "Kinesthetisch werken",
    "Lichaamsgericht werken",
    "Traumasensitief werken",
    "Psycho-educatie",
    "Systeemgericht werken",
    "Symbolisch werken",
    "Ritueel werken",
    "Natuurgericht werken",
    "Spel- en expressiewerk",
  ],
};

function normalizeOption(value: string) {
  return value.trim();
}

export function filterTherapistOptionsToAllowed(
  values: string[] = [],
  allowedOptions: string[] = []
) {
  const allowedByKey = new Map(
    allowedOptions
      .map((value) => normalizeOption(value))
      .filter(Boolean)
      .map((value) => [value.toLocaleLowerCase("nl-NL"), value] as const)
  );

  const filtered: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeOption(value);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("nl-NL");
    const allowed = allowedByKey.get(key);
    if (!allowed || seen.has(key)) continue;
    seen.add(key);
    filtered.push(allowed);
  }

  return filtered;
}

export function filterAllowedTherapistSpecializations(values: string[] = []) {
  return filterTherapistOptionsToAllowed(
    values,
    THERAPIST_PROFILE_OPTION_SETS.specializations
  );
}

export function filterAllowedTherapistTargetGroups(values: string[] = []) {
  return filterTherapistOptionsToAllowed(
    values,
    THERAPIST_PROFILE_OPTION_SETS.targetGroups
  );
}

export function mergeTherapistOptions(
  baseOptions: string[],
  extraOptions: string[] = []
) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const value of [...baseOptions, ...extraOptions]) {
    const normalized = normalizeOption(value);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("nl-NL");
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
  }

  return merged;
}

export function mergeTherapistProfileOptionSets(
  extraOptions: Partial<TherapistProfileOptionSets> = {}
): TherapistProfileOptionSets {
  return {
    specializations: mergeTherapistOptions(
      THERAPIST_PROFILE_OPTION_SETS.specializations,
      extraOptions.specializations
    ),
    targetGroups: mergeTherapistOptions(
      THERAPIST_PROFILE_OPTION_SETS.targetGroups,
      extraOptions.targetGroups
    ),
    languages: mergeTherapistOptions(
      THERAPIST_PROFILE_OPTION_SETS.languages,
      extraOptions.languages
    ),
    methods: mergeTherapistOptions(
      THERAPIST_PROFILE_OPTION_SETS.methods,
      extraOptions.methods
    ),
  };
}
