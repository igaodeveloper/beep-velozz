import { useTranslation as useI18nextTranslation } from "react-i18next";

export const useTranslation = () => {
  const { t, i18n } = useI18nextTranslation();

  const changeLanguage = async (language: "pt" | "en") => {
    await i18n.changeLanguage(language);
  };

  const getCurrentLanguage = () => i18n.language as "pt" | "en";

  return {
    t,
    changeLanguage,
    currentLanguage: getCurrentLanguage(),
  };
};
