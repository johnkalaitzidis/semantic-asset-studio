import { taxonomyLabels, taxonomyStyles } from "./TaxonomyTag";
import { sourceLabel } from "../lib/studio";
import { useStudio } from "../store";
import type { AssetSource, TaxonomyRole } from "../shared/types";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const roles: TaxonomyRole[] = ["ancestry", "branch", "variant", "unlinked"];

function FilterChip({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex shrink-0 items-center rounded-full text-[10px] font-medium tracking-tight ring-inset ${className}`}
      style={{ padding: "2px 12px" }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="h-4 w-px shrink-0 self-center bg-white/20" />;
}

export function LibraryFilters({
  sources,
  models,
}: {
  sources: AssetSource[];
  models: string[];
}) {
  const roleFilters = useStudio((s) => s.roleFilters);
  const sourceFilters = useStudio((s) => s.sourceFilters);
  const modelFilters = useStudio((s) => s.modelFilters);
  const stagedOnly = useStudio((s) => s.stagedOnly);
  const toggleRoleFilter = useStudio((s) => s.toggleRoleFilter);
  const toggleSourceFilter = useStudio((s) => s.toggleSourceFilter);
  const toggleModelFilter = useStudio((s) => s.toggleModelFilter);
  const setStagedOnly = useStudio((s) => s.setStagedOnly);
  const clearFilters = useStudio((s) => s.clearFilters);
  const active =
    roleFilters.length > 0 || sourceFilters.length > 0 || modelFilters.length > 0 || stagedOnly;

  const items: ReactNode[] = [
    ...roles.map((role) => {
      const on = roleFilters.includes(role);
      return (
        <FilterChip
          key={role}
          aria-pressed={on}
          onClick={() => toggleRoleFilter(role)}
          className={`${taxonomyStyles[role]} ${on ? "opacity-100" : "opacity-45 hover:opacity-80"}`}
        >
          {taxonomyLabels[role]}
        </FilterChip>
      );
    }),
  ];

  if (sources.length > 1) {
    items.push(<Divider key="div-sources" />);
    items.push(
      ...sources.map((source) => {
        const on = sourceFilters.includes(source);
        return (
          <FilterChip
            key={source}
            aria-pressed={on}
            onClick={() => toggleSourceFilter(source)}
            className={`ring-1 ${
              on ? "bg-blue/14 text-cyan ring-cyan" : "bg-white/6 text-secondary ring-white/14 hover:text-label"
            }`}
          >
            {sourceLabel(source)}
          </FilterChip>
        );
      }),
    );
  }

  if (models.length > 1) {
    items.push(<Divider key="div-models" />);
    items.push(
      ...models.map((model) => {
        const on = modelFilters.includes(model);
        return (
          <FilterChip
            key={model}
            aria-pressed={on}
            onClick={() => toggleModelFilter(model)}
            title={model}
            className={`max-w-[148px] truncate ring-1 ${
              on ? "bg-blue/14 text-cyan ring-cyan" : "bg-white/6 text-secondary ring-white/14 hover:text-label"
            }`}
          >
            {model}
          </FilterChip>
        );
      }),
    );
  }

  items.push(<Divider key="div-staged" />);
  items.push(
    <FilterChip
      key="staged"
      aria-pressed={stagedOnly}
      onClick={() => setStagedOnly(!stagedOnly)}
      className={`ring-1 ${
        stagedOnly ? "bg-blue/14 text-cyan ring-cyan" : "bg-white/6 text-secondary ring-white/14 hover:text-label"
      }`}
    >
      Staged
    </FilterChip>,
  );
  if (active) {
    items.push(
      <FilterChip
        key="clear"
        onClick={clearFilters}
        className="text-secondary hover:bg-white/8 hover:text-label"
      >
        Clear filters
      </FilterChip>,
    );
  }

  return (
    <div className="flex flex-wrap items-center" style={{ gap: 8 }} data-tutorial="taxonomy">
      {items}
    </div>
  );
}
