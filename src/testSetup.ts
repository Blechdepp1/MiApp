import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

// Viele Testdateien laufen parallel; unter Last reicht die Standard-Wartezeit von 1 s nicht immer
configure({ asyncUtilTimeout: 3000 });
