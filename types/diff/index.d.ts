// Type definitions for diff 4.0
// Project: https://github.com/kpdecker/jsdiff
// Definitions by: vvakame <https://github.com/vvakame>
//                 szdc <https://github.com/szdc>
//                 moc-yuto <https://github.com/moc-yuto>
//                 BendingBender <https://github.com/BendingBender>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.2

export as namespace Diff;

export interface BaseOptions {
    /**
     * `true` to ignore casing difference.
     * @default false
     */
    ignoreCase?: boolean;
}

export interface Change {
    count?: number;
    /**
     * Text content.
     */
    value: string;
    /**
     * `true` if the value was inserted into the new string.
     */
    added?: boolean;
    /**
     * `true` if the value was removed from the old string.
     */
    removed?: boolean;
}

/**
 * Diffs two blocks of text, comparing character by character.
 *
 * @returns A list of change objects.
 */
export function diffChars(oldStr: string, newStr: string, options?: BaseOptions): Change[];
