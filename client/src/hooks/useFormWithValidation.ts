import { useState } from 'react';
import type { ChangeEvent } from 'react';

export default function useFormWithValidation() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValid, setIsValid] = useState(false);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    setValues((previous) => ({ ...previous, [input.name]: input.value }));
    setErrors((previous) => ({ ...previous, [input.name]: input.validationMessage }));
    setIsValid(input.form?.checkValidity() ?? false);
  }

  return { values, errors, isValid, handleChange };
}
