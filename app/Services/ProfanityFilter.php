<?php

namespace App\Services;

class ProfanityFilter
{
    protected static array $badWords = [
        // TODO: mover a diccionario externo
    ];

    public static function clean(string $text): string
    {
        $cleanText = $text;

        foreach (self::$badWords as $word) {
            $escapedWord = preg_quote($word, '/');
            $regexPattern = '';
            $chars = mb_str_split($escapedWord);
            foreach ($chars as $char) {
                $regexPattern .= $char . '+';
            }

            $regexPattern = '/' . $regexPattern . '(s|es|as|os)?/iu';

            $cleanText = preg_replace_callback($regexPattern, function($matches) {
                return str_repeat('*', mb_strlen($matches[0]));
            }, $cleanText);
        }
        return $cleanText;
    }
}
