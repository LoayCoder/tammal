/**
 * Mental Toolkit shared components.
 *
 * ToolkitPageHeader is now an alias for the global PageHeader.
 * ToolkitCard and GradientButton remain toolkit-specific.
 */
export { default as ToolkitPageHeader } from "./ToolkitPageHeader";
export { default as ToolkitCard } from "./ToolkitCard";
export { default as GradientButton } from "./GradientButton";

// Re-export global system components for convenience
export { PageHeader, StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid } from "@/components/system";
