// AIDEV-NOTE: Arquivo original refatorado para usar o novo componente modularizado
import { CompanyPopupProps } from "./company-popup/types";
import CompanyPopupRefactored from "./company-popup";

export function CompanyPopup({ company, open, onOpenChange }: CompanyPopupProps) {
  return (
    <CompanyPopupRefactored 
      company={company} 
      open={open} 
      onOpenChange={onOpenChange} 
    />
  );
}
