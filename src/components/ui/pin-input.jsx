import React, { useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";

export const PinInput = ({ 
  value, 
  onChange, 
  length = 6, 
  onComplete 
}) => {
  const inputRefs = useRef([]);

  useEffect(() => {
    // Initialize refs array
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  const handleChange = (e, index) => {
    const newValue = e.target.value;
    if (newValue.length > 1) return; // Only allow single digit

    const newPin = value.split('');
    newPin[index] = newValue;
    const updatedPin = newPin.join('');
    onChange(updatedPin);

    // Move to next input if value entered
    if (newValue && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if PIN is complete
    if (updatedPin.length === length && onComplete) {
      onComplete(updatedPin);
    }
  };

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current is empty
    if (e.key === 'Backspace' && !value[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (pastedData.length <= length && /^\d+$/.test(pastedData)) {
      const newPin = pastedData.slice(0, length).padEnd(length, '');
      onChange(newPin);
      
      // Move focus to appropriate input
      const focusIndex = Math.min(pastedData.length, length - 1);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex]?.focus();
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {[...Array(length)].map((_, index) => (
        <Input
          key={index}
          type="password"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          ref={el => inputRefs.current[index] = el}
          value={value[index] || ''}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-lg border-zinc-700"
        />
      ))}
    </div>
  );
};

export default PinInput;