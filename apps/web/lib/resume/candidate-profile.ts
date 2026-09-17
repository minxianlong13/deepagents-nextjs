import careerEvidence from "./candidate_career_evidence.json";
import profile from "./candidate_profile.json";

export const candidateProfile = {
  ...profile,
  career_evidence: careerEvidence,
} as const;

export type CandidateProfile = typeof candidateProfile;
