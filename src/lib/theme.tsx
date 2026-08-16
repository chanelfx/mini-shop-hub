import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "mini-shop-theme";
const CHOSEN_KEY = "mini-shop-theme-chosen";

interface ThemeCtx {
  theme: Theme;
  hasChosen: boolean;
  setTheme: (t: Theme) => void;
  confirmChoice: (t: Theme) => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "dark",
  hasChosen: false,
  setTheme: () => {},
  confirmChoice: () => {},
});

function apply(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [hasChosen, setHasChosen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const chosen = localStorage.getItem(CHOSEN_KEY) === "1";
    const initial: Theme = stored === "light" || stored === "dark" ? stored : "dark";
    setThemeState(initial);
    setHasChosen(chosen);
    apply(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    apply(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  const confirmChoice = useCallback(
    (t: Theme) => {
      setTheme(t);
      localStorage.setItem(CHOSEN_KEY, "1");
      setHasChosen(true);
    },
    [setTheme],
  );

  return (
    <Ctx.Provider value={{ theme, hasChosen, setTheme, confirmChoice }}>{children}</Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
