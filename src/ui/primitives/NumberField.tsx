interface NumberFieldProps {
  readonly label: string;
  readonly value: number;
  readonly min?: number;
  readonly max?: number;
  readonly disabled?: boolean;
  readonly onChange: (value: number) => void;
}

/** Etiqueta siempre visible: un placeholder como etiqueta desaparece al escribir. */
export const NumberField = ({
  label,
  value,
  min = 0,
  max = 100,
  disabled = false,
  onChange,
}: NumberFieldProps) => (
  <label className="field">
    <span className="field__label">{label}</span>
    <input
      className="field__input num"
      type="number"
      inputMode="numeric"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(event) => {
        const parsed = Number(event.target.value);
        if (!Number.isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
      }}
    />
  </label>
);
