import React, { useEffect, useState } from 'react';

interface SliderInputProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    className?: string;
}

export const SliderInput: React.FC<SliderInputProps> = ({
    label, value, onChange, min, max, step = 1, unit = '', className
}) => {
    const [localValue, setLocalValue] = useState(String(value));

    useEffect(() => {
        setLocalValue(String(value));
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        const num = parseFloat(e.target.value);
        if (!isNaN(num))
        {
            onChange(num);
        }
    };

    const handleBlur = () => {
        let num = parseFloat(localValue);
        if (isNaN(num)) num = value;
        // num = Math.min(Math.max(num, min), max); // Optional clamping?
        setLocalValue(String(num));
        onChange(num);
    };

    return (
        <div className={className}>
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-600">{label}</label>
                <div className="flex items-center">
                    <input
                        type="text"
                        value={localValue}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="w-12 text-right text-xs border rounded px-1 py-0.5"
                    />
                    <span className="text-xs text-gray-400 ml-1 w-4">{unit}</span>
                </div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => {
                    const val = Number(e.target.value);
                    setLocalValue(String(val));
                    onChange(val);
                }}
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
        </div>
    );
};
