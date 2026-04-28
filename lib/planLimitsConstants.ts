// Plan limits constants - safe to import in any component (no server deps)
export const PLAN_LIMITS = {
  free:  { leads: 50, emails: 100, jobSearches: 20, aiGeneration: false, analytics: false, sequences: false },
  pro:   { leads: Infinity, emails: 2000, jobSearches: Infinity, aiGeneration: true, analytics: true, sequences: true },
  team:  { leads: Infinity, emails: 10000, jobSearches: Infinity, aiGeneration: true, analytics: true, sequences: true, teamMembers: 5 },
} as const;
