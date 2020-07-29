import { srtParser } from './srtParser';
import { vttParser } from './vttParser';
import { ParsedResult } from './types';

export const parse = async (raw: string): Promise<ParsedResult> => {
  return raw.startsWith('WEBVTT') ? vttParser(raw) : srtParser(raw);
};
