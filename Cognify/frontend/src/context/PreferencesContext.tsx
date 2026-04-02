import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light';
type Language = 'ru' | 'en' | 'kk';

const DICTIONARY: Record<Language, Record<string, string>> = {
  ru: {
    'brand.name': 'Cognify',
    'layout.logout': 'Выйти',
    'layout.theme': 'Тема',
    'layout.language': 'Язык',
    'layout.dark': 'Темная',
    'layout.light': 'Светлая',
    'nav.teacher.dashboard': 'Обзор',
    'nav.teacher.courses': 'Мои курсы',
    'nav.teacher.create': 'Создать курс',
    'nav.teacher.students': 'Студенты',
    'nav.student.dashboard': 'Мое обучение',
    'nav.student.catalog': 'Каталог',
    'nav.student.admin': 'Аналитика',
    'auth.title': 'Cognify',
    'auth.login.subtitle': 'Войдите, чтобы продолжить обучение',
    'auth.register.subtitle': 'Создайте аккаунт для обучения',
    'auth.login': 'Войти',
    'auth.register': 'Регистрация',
    'auth.name': 'Имя',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.student': 'Студент',
    'auth.teacher': 'Преподаватель',
  },
  en: {
    'brand.name': 'Cognify',
    'layout.logout': 'Logout',
    'layout.theme': 'Theme',
    'layout.language': 'Language',
    'layout.dark': 'Dark',
    'layout.light': 'Light',
    'nav.teacher.dashboard': 'Overview',
    'nav.teacher.courses': 'My Courses',
    'nav.teacher.create': 'Create Course',
    'nav.teacher.students': 'Students',
    'nav.student.dashboard': 'My Learning',
    'nav.student.catalog': 'Catalog',
    'nav.student.admin': 'Analytics',
    'auth.title': 'Cognify',
    'auth.login.subtitle': 'Sign in to continue learning',
    'auth.register.subtitle': 'Create an account to start learning',
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.name': 'Full Name',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.student': 'Student',
    'auth.teacher': 'Teacher',
  },
  kk: {
    'brand.name': 'Cognify',
    'layout.logout': 'Шығу',
    'layout.theme': 'Тақырып',
    'layout.language': 'Тіл',
    'layout.dark': 'Қараңғы',
    'layout.light': 'Жарық',
    'nav.teacher.dashboard': 'Шолу',
    'nav.teacher.courses': 'Курстарым',
    'nav.teacher.create': 'Курс құру',
    'nav.teacher.students': 'Студенттер',
    'nav.student.dashboard': 'Оқуым',
    'nav.student.catalog': 'Каталог',
    'nav.student.admin': 'Талдау',
    'auth.title': 'Cognify',
    'auth.login.subtitle': 'Оқуды жалғастыру үшін кіріңіз',
    'auth.register.subtitle': 'Оқуды бастау үшін тіркеліңіз',
    'auth.login': 'Кіру',
    'auth.register': 'Тіркелу',
    'auth.name': 'Аты-жөні',
    'auth.email': 'Email',
    'auth.password': 'Құпиясөз',
    'auth.student': 'Студент',
    'auth.teacher': 'Оқытушы',
  },
};

interface PreferencesContextValue {
  theme: Theme;
  language: Language;
  setLanguage: (language: Language) => void;
  toggleTheme: () => void;
  t: (key: string, fallback?: string) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export const PreferencesProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [language, setLanguageState] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'ru');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      theme,
      language,
      setLanguage: setLanguageState,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
      t: (key: string, fallback?: string) => DICTIONARY[language][key] || fallback || key,
    }),
    [theme, language],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return context;
};
