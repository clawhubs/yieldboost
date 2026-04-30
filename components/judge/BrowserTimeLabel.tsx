"use client";

import { useEffect, useState } from "react";

interface BrowserTimeLabelProps {
  value?: string | null;
  prefix?: string;
  emptyLabel?: string;
  className?: string;
}

function formatBrowserTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export default function BrowserTimeLabel({
  value,
  prefix,
  emptyLabel = "No proof timestamp recorded yet.",
  className,
}: BrowserTimeLabelProps) {
  const [formatted, setFormatted] = useState<string | null>(() => (value ? formatBrowserTime(value) : null));

  useEffect(() => {
    setFormatted(value ? formatBrowserTime(value) : null);
  }, [value]);

  if (!formatted) {
    return <span className={className}>{emptyLabel}</span>;
  }

  return (
    <time dateTime={value ?? undefined} title={value ?? undefined} className={className}>
      {prefix ? `${prefix} ${formatted}` : formatted}
    </time>
  );
}
