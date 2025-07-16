import React, { createContext, useState, useContext, useEffect } from "react";
import { lightTheme, darkTheme } from "./themes";
import { ConfigProvider } from "antd";
import { flushSync } from "react-dom";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = sessionStorage.getItem("theme");
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  const toggleTheme = async () => {
    if (
      !document.startViewTransition ||
      window.matchMedia("(prefers-reduced-motion:reduce").matches
    ) {
      setIsDarkMode(!isDarkMode);
      return;
    }
    await document.startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode(!isDarkMode);
      });
    }).ready;

    document.documentElement.animate(
      {
        clipPath: [`circle(0 at 90% 5%)`, `circle(9999px at 90% 5%)`],
      },
      {
        duration: 1000,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
    sessionStorage.setItem("theme", JSON.stringify(!isDarkMode));
  };

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-bs-theme",
      isDarkMode ? "dark" : "light"
    );
    document.body.classList.toggle("dark-theme", isDarkMode);
  }, [isDarkMode]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ConfigProvider theme={isDarkMode ? darkTheme({}) : lightTheme({})}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
