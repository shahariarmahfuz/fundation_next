import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  if (!content) return null;

  // Split content by double newlines or single newlines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let isNumberedList = false;

  const flushList = (keyPrefix: number) => {
    if (currentList.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`list-${keyPrefix}`} className="my-3 list-decimal list-inside space-y-1.5 text-slate-700 pl-2">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`list-${keyPrefix}`} className="my-3 list-disc list-inside space-y-1.5 text-slate-700 pl-2">
            {currentList.map((item, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            ))}
          </ul>
        );
      }
      currentList = [];
      isNumberedList = false;
    }
  };

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code class='bg-slate-100 px-1 py-0.5 rounded text-xs font-mono'>$1</code>");
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("### ")) {
      flushList(index);
      elements.push(
        <h3 key={index} className="text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-2">
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      flushList(index);
      elements.push(
        <h2 key={index} className="text-xl sm:text-2xl font-bold text-slate-900 mt-8 mb-3">
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      flushList(index);
      elements.push(
        <h1 key={index} className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-8 mb-4">
          {trimmed.slice(2)}
        </h1>
      );
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (currentList.length > 0 && isNumberedList) {
        flushList(index);
      }
      isNumberedList = false;
      currentList.push(trimmed.slice(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (currentList.length > 0 && !isNumberedList) {
        flushList(index);
      }
      isNumberedList = true;
      currentList.push(trimmed.replace(/^\d+\.\s/, ""));
    } else if (trimmed === "") {
      flushList(index);
    } else {
      flushList(index);
      elements.push(
        <p
          key={index}
          className="my-3 leading-relaxed text-slate-700"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      );
    }
  });

  flushList(lines.length);

  return <div className={`prose-slate max-w-none text-sm sm:text-base ${className}`}>{elements}</div>;
};
