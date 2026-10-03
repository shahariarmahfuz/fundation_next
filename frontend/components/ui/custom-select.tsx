"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
  ReactNode,
} from "react";
import {
  ChevronDown,
  Check,
  Search,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: string;
  badgeColor?: string;
  [key: string]: any;
}

export type SelectOptionInput = SelectOption | string | number;

export interface CustomSelectProps {
  value: string | number | null | undefined;
  onChange: (value: any, option?: SelectOption) => void;
  options: SelectOptionInput[];
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  error?: string | boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  icon?: ReactNode;
  name?: string;
  id?: string;
  "aria-label"?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  searchable,
  searchPlaceholder = "Search...",
  disabled = false,
  required = false,
  clearable = false,
  loading = false,
  emptyMessage = "No options found",
  error,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  icon,
  name,
  id: customId,
  "aria-label": ariaLabel,
}) => {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const listboxId = `${selectId}-listbox`;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options into standard SelectOption objects
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          ...opt,
          value: opt.value,
          label: String(opt.label ?? opt.value ?? ""),
        };
      }
      return {
        value: opt,
        label: String(opt),
      };
    });
  }, [options]);

  // Determine if search should be enabled (auto-enable for > 7 items if not specified)
  const isSearchable = useMemo(() => {
    if (typeof searchable === "boolean") return searchable;
    return normalizedOptions.length > 7;
  }, [searchable, normalizedOptions.length]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(q);
      const sublabelMatch = opt.sublabel
        ? opt.sublabel.toLowerCase().includes(q)
        : false;
      const valueMatch = String(opt.value).toLowerCase().includes(q);
      return labelMatch || sublabelMatch || valueMatch;
    });
  }, [normalizedOptions, searchQuery]);

  // Currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(
      (opt) => String(opt.value) === String(value)
    );
  }, [normalizedOptions, value]);

  // Calculate position: open upward if not enough space below
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedMenuHeight = 280;

    if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, []);

  const openDropdown = () => {
    if (disabled || loading) return;
    updatePosition();
    setIsOpen(true);
    setSearchQuery("");

    // Set highlighted index to selected option
    const idx = filteredOptions.findIndex(
      (opt) => String(opt.value) === String(value)
    );
    setHighlightedIndex(idx >= 0 ? idx : 0);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const toggleDropdown = () => {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;
    onChange(option.value, option);
    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange("", undefined);
    closeDropdown();
    triggerRef.current?.focus();
  };

  // Close on outside click or touch
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [isOpen]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen && isSearchable) {
      // Short delay for render
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSearchable]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.children[
        highlightedIndex
      ] as HTMLElement;
      if (highlightedEl) {
        highlightedEl.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [highlightedIndex, isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        closeDropdown();
        triggerRef.current?.focus();
        break;

      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (
            next < filteredOptions.length &&
            filteredOptions[next]?.disabled
          ) {
            next++;
          }
          return next < filteredOptions.length ? next : prev;
        });
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next]?.disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;

      case "Home":
        e.preventDefault();
        setHighlightedIndex(0);
        break;

      case "End":
        e.preventDefault();
        setHighlightedIndex(filteredOptions.length - 1);
        break;

      case "Enter":
        e.preventDefault();
        if (
          highlightedIndex >= 0 &&
          highlightedIndex < filteredOptions.length
        ) {
          const opt = filteredOptions[highlightedIndex];
          if (opt && !opt.disabled) {
            handleSelect(opt);
          }
        }
        break;

      case "Tab":
        closeDropdown();
        break;
    }
  };

  const hasValue = value !== null && value !== undefined && value !== "";
  const isInvalid = Boolean(error);

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-left font-sans ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for standard HTML form compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={selectId}
        disabled={disabled || loading}
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || placeholder}
        aria-invalid={isInvalid}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white transition-all duration-150 select-none ${
          disabled
            ? "bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-800"
            : isInvalid
            ? "border-rose-400 dark:border-rose-500/80 ring-2 ring-rose-400/20 focus:outline-none"
            : isOpen
            ? "border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 focus:outline-none"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        } ${triggerClassName}`}
      >
        {/* Left Section (Icon + Label) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && (
            <span className="text-slate-400 dark:text-slate-500 shrink-0">
              {icon}
            </span>
          )}

          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 truncate">
              {selectedOption.icon && (
                <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="text-xs text-slate-400 dark:text-slate-500 truncate font-mono">
                  {selectedOption.sublabel}
                </span>
              )}
              {selectedOption.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 ${
                    selectedOption.badgeColor ||
                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 truncate">
              {placeholder}
            </span>
          )}
        </div>

        {/* Right Section (Loading / Clear / Chevron) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1 text-slate-400 dark:text-slate-500">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
          ) : (
            <>
              {clearable && hasValue && !disabled && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={handleClear}
                  aria-label="Clear selection"
                  className="p-0.5 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-emerald-600 dark:text-emerald-400" : ""
                }`}
              />
            </>
          )}
        </div>
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div
          role="listbox"
          id={listboxId}
          aria-label={ariaLabel || placeholder}
          className={`absolute z-50 left-0 right-0 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden backdrop-blur-sm ${
            openUpward ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top"
          } animate-in fade-in zoom-in-95 duration-150 ${menuClassName}`}
        >
          {/* Search Input Bar */}
          {isSearchable && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 sticky top-0 z-10">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/60 overscroll-contain p-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={`${opt.value}-${index}`}
                    role="option"
                    id={`${selectId}-opt-${index}`}
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs text-left cursor-pointer transition-colors select-none ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed bg-transparent text-slate-400"
                        : isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-semibold"
                        : isHighlighted
                        ? "bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Label & Details */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {opt.icon && (
                        <span className="shrink-0 text-slate-400">
                          {opt.icon}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate font-mono">
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: Badge + Checkmark */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            opt.badgeColor ||
                            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {typeof error === "string" && error && (
        <div className="mt-1 flex items-center gap-1 text-xs text-rose-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
