export enum AppPhase {
  ONBOARDING = 'ONBOARDING',
  EXECUTION = 'EXECUTION'
}

export interface CVProfile {
  rawText: string;
  analysis: string;
  formatting: string;
}

export interface JobAnalysis {
  jd: string;
  tailoredCV: string;
  linkedinMessage: string;
}

export interface ApplicationRoute {
  type: 'MAIL' | 'PORTAL';
  content: string; // Cover letter or answers
}
