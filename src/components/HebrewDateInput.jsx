import { useState } from "react";

export default function HebrewDateInput({ name, value, defaultValue = "", onChange, placeholder, required, className, inputClassName, ...rest }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const dateValue = value !== undefined ? value : internalValue;

  function handleChange(nextValue) {
    if (value === undefined) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  }

  return (
    <input
      type="date"
      name={name}
      value={dateValue}
      required={required}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputClassName || "w-full rounded-xl border border-slate-200 px-4 py-3 bg-white text-slate-900"} ${className || ""}`.trim()}
      {...rest}
    />
  );
}
