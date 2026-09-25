import { useEffect, useId, useRef, useState } from "react";

function normalizeOption(option) {
    if (typeof option === "string") {
        return { value: option, label: option };
    }
    return option;
}

export default function StyledSelect({ value = "", options = [], onChange, placeholder = "Select", disabled = false, ariaLabel }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const listboxId = useId();
    const normalizedOptions = options.map(normalizeOption);
    const selectedOption = normalizedOptions.find((option) => String(option.value) === String(value));

    useEffect(() => {
        function handleOutsideClick(event) {
            if (!containerRef.current?.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    function selectOption(nextValue) {
        onChange?.({ target: { value: nextValue } });
        setOpen(false);
    }

    function handleKeyDown(event) {
        if (disabled) return;
        const currentIndex = normalizedOptions.findIndex((option) => String(option.value) === String(value));

        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const nextIndex = currentIndex < 0
                ? 0
                : (currentIndex + direction + normalizedOptions.length) % normalizedOptions.length;
            selectOption(normalizedOptions[nextIndex].value);
            setOpen(true);
        } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((current) => !current);
        } else if (event.key === "Escape") {
            setOpen(false);
        } else if (event.key === "Home" && normalizedOptions.length) {
            event.preventDefault();
            selectOption(normalizedOptions[0].value);
        } else if (event.key === "End" && normalizedOptions.length) {
            event.preventDefault();
            selectOption(normalizedOptions[normalizedOptions.length - 1].value);
        }
    }

    return (
        <div className={`styled-select ${open ? "styled-select--open" : ""}`} ref={containerRef}>
            <button
                type="button"
                className="styled-select__trigger"
                onClick={() => setOpen((current) => !current)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
            >
                <span className={selectedOption ? "" : "styled-select__placeholder"}>
                    {selectedOption?.label || placeholder}
                </span>
                <svg className={`styled-select__chevron ${open ? "styled-select__chevron--open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
            {open ? (
                <div className="styled-select__menu" id={listboxId} role="listbox" aria-label={ariaLabel || placeholder}>
                    {normalizedOptions.map((option) => {
                        const isSelected = String(option.value) === String(value);
                        return (
                            <button
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                key={option.value}
                                className={`styled-select__option ${isSelected ? "styled-select__option--selected" : ""}`}
                                onClick={() => selectOption(option.value)}
                            >
                                <span>{option.label}</span>
                                {isSelected ? <span aria-hidden="true">&#10003;</span> : null}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
