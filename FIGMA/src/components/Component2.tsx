import { FunctionComponent, useMemo, type CSSProperties } from "react";

export type Component2Type = {
  className?: string;
  text?: string;

  /** Variant props */
  variant?: 2 | 3 | 4;

  /** Style props */
  component2Top?: CSSProperties["top"];
  component2Right?: CSSProperties["right"];
  component2Left?: CSSProperties["left"];
  component2Height?: CSSProperties["height"];
  component2Bottom?: CSSProperties["bottom"];
  component2Position?: CSSProperties["position"];
};

const Component2: FunctionComponent<Component2Type> = ({
  className = "",
  variant = 1,
  text = "da empresa, pessoas e ne…",
  component2Top,
  component2Right,
  component2Left,
  component2Height,
  component2Bottom,
  component2Position,
}) => {
  const component2Style: CSSProperties = useMemo(() => {
    return {
      top: component2Top,
      right: component2Right,
      left: component2Left,
      height: component2Height,
      bottom: component2Bottom,
      position: component2Position,
    };
  }, [
    component2Top,
    component2Right,
    component2Left,
    component2Height,
    component2Bottom,
    component2Position,
  ]);

  return (
    <div
      className={`absolute w-full top-[calc(50%_-_10.5px)] right-[-2px] left-[2px] overflow-hidden flex flex-col items-start justify-start text-left text-sm text-betaagendorcombr-mirage font-betaagendorcombr-semantic-button data-[variant='4']:overflow-auto data-[variant='4']:pt-0 data-[variant='4']:px-0 data-[variant='4']:pb-2 data-[variant='4']:box-border data-[variant='4']:max-h-[256px] [&_.text]:data-[variant='3']:text-betaagendorcombr-blue-bell [&_.text]:data-[variant='4']:text-betaagendorcombr-east-bay ${className}`}
      data-variant={variant}
      style={component2Style}
    >
      <div className="text relative leading-[21px]">{text}</div>
    </div>
  );
};

export default Component2;
