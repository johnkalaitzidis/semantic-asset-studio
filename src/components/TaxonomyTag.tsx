import type { TaxonomyRole } from "../shared/types";

const styles: Record<TaxonomyRole, string> = {
  ancestry: "bg-apricot/12 text-apricot ring-2 ring-apricot",
  branch: "bg-cyan/12 text-cyan ring-2 ring-cyan",
  variant: "bg-variant/12 text-variant ring-2 ring-variant",
  unlinked: "bg-white/8 text-unlinked ring-2 ring-unlinked",
};

const labels: Record<TaxonomyRole, string> = {
  ancestry: "Ancestry",
  branch: "Branch",
  variant: "Variant",
  unlinked: "Unlinked",
};

export function TaxonomyTag({ role, compact = false }: { role: TaxonomyRole; compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-tight shadow-[0_1px_8px_rgb(0_0_0_/_0.55)] backdrop-blur-md ${styles[role]} ${compact ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]"}`}
    >
      {labels[role]}
    </span>
  );
}

const textStyles: Record<TaxonomyRole, string> = {
  ancestry: "text-apricot",
  branch: "text-cyan",
  variant: "text-variant",
  unlinked: "text-unlinked",
};

export function TaxonomyLabel({ role, className = "" }: { role: TaxonomyRole; className?: string }) {
  return (
    <span className={`block truncate font-semibold tracking-tight ${textStyles[role]} ${className}`}>
      {labels[role]}
    </span>
  );
}

export const taxonomyStyles = styles;
export const taxonomyLabels = labels;
