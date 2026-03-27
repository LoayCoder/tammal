/**
 * ToolkitPageHeader — thin wrapper around the global PageHeader.
 * Kept for backward compatibility; new code should import PageHeader directly.
 */
import { ReactNode } from "react";
import PageHeader from "@/components/system/PageHeader";

interface ToolkitPageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  maxWidth?: "2xl" | "4xl";
}

export default function ToolkitPageHeader({
  icon,
  title,
  subtitle,
  actions,
  maxWidth = "2xl",
}: ToolkitPageHeaderProps) {
  return (
    <PageHeader
      icon={icon}
      title={title}
      subtitle={subtitle}
      actions={actions}
      maxWidth={maxWidth}
      variant="flush"
    />
  );
}
