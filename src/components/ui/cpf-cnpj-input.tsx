import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCnpjCpf, validateCnpjCpf, detectType } from "@/lib/utils/cnpjCpf";
import { CheckCircle2, XCircle } from "lucide-react";

export interface CpfCnpjInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  showValidationIcon?: boolean;
}

const CpfCnpjInput = React.forwardRef<HTMLInputElement, CpfCnpjInputProps>(
  (
    {
      className,
      value = "",
      onChange,
      onValidationChange,
      showValidationIcon = true,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [isValid, setIsValid] = React.useState<boolean | null>(null);
    const [detectedType, setDetectedType] = React.useState<"cpf" | "cnpj" | null>(null);

    React.useEffect(() => {
      if (value) {
        const formatted = formatCnpjCpf(value);
        setDisplayValue(formatted);
        const type = detectType(value);
        setDetectedType(type);
        const valid = validateCnpjCpf(value);
        setIsValid(valid);
        onValidationChange?.(valid);
      } else {
        setDisplayValue("");
        setIsValid(null);
        setDetectedType(null);
        onValidationChange?.(false);
      }
    }, [value, onValidationChange]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/\D/g, "");
      const formatted = formatCnpjCpf(rawValue);
      setDisplayValue(formatted);

      const type = detectType(rawValue);
      setDetectedType(type);

      if (rawValue.length === 0) {
        setIsValid(null);
        onValidationChange?.(false);
        onChange?.("");
        return;
      }

      // Validar apenas se tiver tamanho completo
      const valid = validateCnpjCpf(rawValue);
      setIsValid(valid);
      onValidationChange?.(valid);

      // Passar valor limpo para onChange
      onChange?.(rawValue);
    };

    const handleBlur = () => {
      // Revalidar ao perder foco
      if (displayValue) {
        const rawValue = displayValue.replace(/\D/g, "");
        const valid = validateCnpjCpf(rawValue);
        setIsValid(valid);
        onValidationChange?.(valid);
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={props.placeholder || "000.000.000-00 ou 00.000.000/0000-00"}
          className={cn(
            "pr-10",
            isValid === false && "border-destructive focus-visible:border-destructive",
            isValid === true && "border-green-500 focus-visible:border-green-500",
            className
          )}
          {...props}
        />
        {showValidationIcon && displayValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {isValid === true ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : isValid === false ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : null}
          </div>
        )}
        {detectedType && displayValue && (
          <p className="text-xs text-muted-foreground mt-1">
            {detectedType === "cpf" ? "CPF" : "CNPJ"} detectado
          </p>
        )}
      </div>
    );
  }
);

CpfCnpjInput.displayName = "CpfCnpjInput";

export { CpfCnpjInput };
