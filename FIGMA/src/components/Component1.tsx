import { FunctionComponent } from "react";

export type Component1Type = {
  className?: string;

  /** Variant props */
  variant?: 2;
};

const Component1: FunctionComponent<Component1Type> = ({
  className = "",
  variant = 1,
}) => {
  return (
    <div
      className={`absolute top-[-32px] right-[0px] rounded-lg bg-betaagendorcombr-mirage flex flex-row items-center justify-center py-1 px-2 ${className}`}
      data-variant={variant}
    >
      <div className="w-5 relative h-5" />
    </div>
  );
};

export default Component1;
