export type SupportedLanguage = "en" | "hi" | "mr";

export type ExamConfig = {
  id: string;
  name: string;
  stages: string[];
  subjects: string[];
  supportedLanguages: SupportedLanguage[];
};

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
];
