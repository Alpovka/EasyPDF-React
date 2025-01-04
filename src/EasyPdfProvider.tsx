import React, { createContext, useContext } from "react";
import { EasyPdf } from "./utils/EasyPdf";

interface EasyPdfContextType {
  instance: EasyPdf;
}

const EasyPdfContext = createContext<EasyPdfContextType | null>(null);

interface EasyPdfProviderProps {
  instance: EasyPdf;
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
