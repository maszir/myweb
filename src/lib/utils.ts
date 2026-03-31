import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeStringify(obj: any) {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null && (value.nodeType || value._reactFiber)) {
        return '[Circular/DOM Node]';
      }
      return value;
    });
  } catch (e) {
    return '[Unstringifiable Object]';
  }
}
