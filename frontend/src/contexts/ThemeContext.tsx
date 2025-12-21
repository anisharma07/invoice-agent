import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Force light mode
    setIsDarkMode(false);
    applyTheme(false);
    localStorage.removeItem("stark-invoice-dark-mode");
  }, []);

  const applyTheme = (isDark: boolean) => {
    const body = document.body;
    const html = document.documentElement;

    // Always remove dark classes
    body.classList.remove("dark");
    html.classList.remove("ion-palette-dark");
  };

  const toggleDarkMode = () => {
    // Do nothing
  };

  const setDarkMode = (isDark: boolean) => {
    // Do nothing
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
