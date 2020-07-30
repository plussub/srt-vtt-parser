export interface Entry {
  id: string;
  from: number;
  to: number;
  text: string;
}

export interface ParsedResult {
  entries: Entry[];
}

export const isEntryFromPartial = (e: Partial<Entry>): e is Entry => {
  return typeof e.id === 'string' && typeof e.from === 'number' && typeof e.to === 'number' && typeof e.text === 'string';
};
