import React, { createContext, useContext } from "react";
import { EasyPdfInstance } from "./utils/instance";

interface EasyPdfContextType {
  instance: EasyPdfInstance;
}

const EasyPdfContext = createContext<EasyPdfContextType | null>(null);

interface EasyPdfProviderProps {
  instance: EasyPdfInstance;
  children: React.ReactNode;
}

export const EasyPdfProvider: React.FC<EasyPdfProviderProps> = ({
  instance,
  children,
}) => {
  return (
    <EasyPdfContext.Provider value={{ instance }}>
      {children}
    </EasyPdfContext.Provider>
  );
};

export const useEasyPdfContext = () => {
  const context = useContext(EasyPdfContext);

  if (!context) {
    throw new Error("useEasyPdf must be used within an EasyPdfProvider");
  }

  return context;
};
