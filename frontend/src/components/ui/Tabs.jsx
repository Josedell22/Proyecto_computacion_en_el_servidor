import { createContext, useContext, useId } from "react";

const TabsContext = createContext(null);

export function Tabs({ children, value, onChange, ariaLabel, className = "" }) {
  const baseId = useId();
  return (
    <TabsContext.Provider value={{ value, onChange, baseId }}>
      <div
        className={`flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-fit ${className}`}
        role="tablist"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function Tab({ value, children, icon: Icon }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tab debe usarse dentro de Tabs");
  const { value: active, onChange, baseId } = ctx;
  const isActive = active === value;

  return (
    <button
      id={`${baseId}-${value}-tab`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`${baseId}-${value}-panel`}
      tabIndex={isActive ? 0 : -1}
      type="button"
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
        isActive
          ? "bg-white text-indigo-600 shadow-sm"
          : "text-slate-500 hover:text-slate-800"
      }`}
      onClick={() => onChange(value)}
    >
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function TabPanel({ value, children }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabPanel debe usarse dentro de Tabs");
  const { value: active, baseId } = ctx;
  const isActive = active === value;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-${value}-panel`}
      aria-labelledby={`${baseId}-${value}-tab`}
      hidden={!isActive}
      className={isActive ? "block" : "hidden"}
    >
      {children}
    </div>
  );
}
