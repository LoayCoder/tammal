import { Button, type ButtonProps } from "@/shared/components/ui/button";
import { TOOLKIT } from "@/config/toolkit-colors";
import { cn } from "@/shared/utils/utils";
import { forwardRef } from "react";

interface GradientButtonProps extends ButtonProps {
  /** Use a single TOOLKIT color instead of the gradient */
  solidColor?: string;
}

const GradientButton = forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ solidColor, className, style, ...props }, ref) => {
    const bg = solidColor
      ? solidColor
      : `linear-gradient(135deg, ${TOOLKIT.lavender}, ${TOOLKIT.sage})`;

    return (
      <Button
        ref={ref}
        className={cn("rounded-xl", className)}
        style={{ background: bg, color: TOOLKIT.plum, ...style }}
        {...props}
      />
    );
  },
);
GradientButton.displayName = "GradientButton";

export default GradientButton;
