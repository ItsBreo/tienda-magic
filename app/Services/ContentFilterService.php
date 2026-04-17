<?php

namespace App\Services;

class ContentFilterService
{
    private array $blacklist = [
        // TODO: mover a diccionario externo
    ];

    public function filter(string $text): string
    {
        $pattern = '/\b(' . implode('|', array_map('preg_quote', $this->blacklist)) . ')\b/iu';

        return preg_replace_callback($pattern, function ($matches) {
            return str_repeat('*', mb_strlen($matches[0]));
        }, $text);
    }

    public function containsProfanity(string $text): bool
    {
        $filtered = $this->filter($text);
        return $filtered !== $text;
    }
}
