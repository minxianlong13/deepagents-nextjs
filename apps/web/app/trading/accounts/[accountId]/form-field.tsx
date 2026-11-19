"use client";

import { cloneElement, useId, type ReactElement, type ReactNode } from "react";

/** Labelled form control with an optional action (e.g. "Max") and an accessible error message. */
export function Field({ label, error, action, children }: { label: string; error?: string; action?: ReactNode; children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }> }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-black/75">{label}</label>
        {action}
      </div>
      {cloneElement(children, { id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? errorId : undefined })}
      {error ? <p id={errorId} className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
