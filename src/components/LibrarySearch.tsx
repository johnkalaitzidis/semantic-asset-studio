import { Search, X } from "lucide-react";
import { useStudio } from "../store";

export function LibrarySearch() {
  const query = useStudio((s) => s.query);
  const tokens = useStudio((s) => s.tokens);
  const setQuery = useStudio((s) => s.setQuery);
  const removeToken = useStudio((s) => s.removeToken);

  return (
    <div className="space-y-2">
      <label className="flex h-[30px] w-full items-center gap-2 rounded-[8px] bg-white/8 px-2.5 ring-1 ring-inset ring-white/6 focus-within:bg-white/10 focus-within:ring-blue">
        <Search size={14} className="shrink-0 text-secondary" />
        <input
          id="studio-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search prompts, seeds, models"
          className="h-full w-full bg-transparent text-[13px] text-label placeholder:text-tertiary"
          aria-label="Filter assets"
        />
        {query ? (
          <button
            type="button"
            className="rounded-full p-0.5 text-secondary hover:bg-white/10 hover:text-label"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        ) : null}
      </label>
      {tokens.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {tokens.map((token) => (
            <button
              key={token}
              type="button"
              onClick={() => removeToken(token)}
              className="inline-flex h-6 items-center gap-1 rounded-full bg-blue/18 px-2 text-[11px] font-medium text-cyan ring-1 ring-cyan/25"
            >
              {token}
              <X size={11} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
