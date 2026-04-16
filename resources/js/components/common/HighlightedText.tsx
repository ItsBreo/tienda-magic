import React from 'react';

interface HighlightedTextProps {
    text: string;
    highlight: string;
    className?: string;
    highlightClassName?: string;
}

/**
 * Renders text with any matching substring highlighted.
 * Case-insensitive, highlights ALL occurrences in the string.
 */
export default function HighlightedText({ text, highlight, className, highlightClassName }: HighlightedTextProps) {
    if (!highlight.trim()) {
        return <span className={className}>{text}</span>;
    }

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark
                        key={i}
                        className={highlightClassName ?? 'bg-emerald-500/30 text-emerald-400 font-bold rounded-sm px-0.5 not-italic border-b border-emerald-500/50'}
                    >
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
}
