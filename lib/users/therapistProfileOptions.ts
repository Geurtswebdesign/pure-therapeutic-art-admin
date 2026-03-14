export type TherapistProfileOptionSets = {
  specializations: string[];
  targetGroups: string[];
  languages: string[];
  methods: string[];
};

export const THERAPIST_PROFILE_OPTION_SETS: TherapistProfileOptionSets = {
  specializations: [
    "Rouw en verlies",
    "Trauma en herstel",
    "Angst en spanning",
    "Boosheid en agressie",
    "Eenzaamheid",
    "Zelfbeeld",
    "Zelfvertrouwen",
    "Grenzen",
    "Controle en loslaten",
    "Cognitie, gedachten en piekeren",
    "Gevoelens en emotieregulatie",
    "Troost en herstel",
    "Toekomst en perspectief",
    "Mindfulness en ontspanning",
    "Misbruik en mishandeling",
    "Verslaving",
    "Zingeving en spiritualiteit",
    "Symbolen en metaforen",
    "Sprookjes en archetypen",
    "Natuur en symbolische kracht",
    "Lichaamsbewustzijn en zintuigen",
  ],
  targetGroups: [
    "Kinderen",
    "Jongeren",
    "Jongvolwassenen",
    "Volwassenen",
    "Ouderen",
    "Ouders",
    "Gezinnen",
    "Groepen",
    "Scholen",
    "Professionals",
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
