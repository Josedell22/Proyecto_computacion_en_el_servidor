import Field from "./Field";
import Select from "./Select";

export default function SubjectSelect({
  subjects = [],
  value,
  onChange,
  required = false,
  label = "Materia",
  placeholder = "Seleccione una materia",
  error,
}) {
  const options = subjects.map((s) => ({ value: String(s.id), label: s.name }));
  return (
    <Field label={label} error={error}>
      <Select
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        options={options}
      />
    </Field>
  );
}
