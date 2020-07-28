import { srtParser } from './srtParser';
import { vttParser } from './vttParser';
import { ParsedResult } from './types';

export const parse = (raw: string): ParsedResult => {
  return raw.startsWith('WEBVTT') ? vttParser(raw) : srtParser(raw);
};
