import { cn } from 'cn';

// What Input, Textarea and the Select trigger share. Text is 16px on phones, because iOS zooms into a focused
// field with smaller text
export const FIELD_CLASS_NAME = cn(
  'w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-base transition-colors md:text-sm',
  'placeholder:text-muted-foreground',
  'focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-ring',
  'aria-invalid:border-destructive aria-invalid:focus-visible:outline-destructive',
  'disabled:cursor-not-allowed disabled:opacity-50',
);
