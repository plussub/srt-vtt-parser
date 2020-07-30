import { Entry, isEntryFromPartial, ParsedResult } from './types';
import { isBlank } from './util';

const TRANSITION_NAMES = {
  HEADER: 'HEADER',
  ID: 'ID',
  TIME_LINE: 'TIME_LINE',
  ID_OR_NOTE_OR_STYLE: 'ID_OR_NOTE_OR_STYLE',
  STYLE: 'STYLE',
  NOTE: 'NOTE',
  TEXT: 'TEXT',
  MULTI_LINE_TEXT: 'MULTI_LINE_TEXT',
  FIN_ENTRY: 'FIN_ENTRY',
  FINISH: 'FINISH'
} as const;
type TransitionNames = keyof typeof TRANSITION_NAMES;

interface TransitionParams {
  tokens: string[];
  pos: number;
  result: Entry[];
  current: Partial<Entry>;
}

interface TransitionResult {
  next: TransitionNames;
  params: TransitionParams;
}

type Machine = Record<TransitionNames, (params: TransitionParams) => TransitionResult> & {
  start: (raw: string) => Entry[];
};

const timestampToMillisecond = (value: string) => {
  const [hours, minutes, seconds] = value.split(':');
  return parseInt(seconds.replace('.', ''), 10) + parseInt(minutes, 10) * 60 * 1000 + parseInt(hours, 10) * 60 * 60 * 1000;
};

const VttMachine: () => Machine = () => ({
  start(raw: string): Entry[] {
    let currentTransition: TransitionNames = TRANSITION_NAMES.HEADER;
    let params: TransitionParams = {
      tokens: raw.split(/\n/),
      pos: 0,
      result: [],
      current: {}
    };
    while (currentTransition !== TRANSITION_NAMES.FINISH) {
      const result = this[currentTransition](params);
      params = result.params;
      currentTransition = result.next;
    }

    return params.result;
  },

  [TRANSITION_NAMES.HEADER](params: TransitionParams): TransitionResult {
    return { next: TRANSITION_NAMES.ID_OR_NOTE_OR_STYLE, params: { ...params, pos: params.pos + 1 } };
  },

  [TRANSITION_NAMES.ID_OR_NOTE_OR_STYLE](params: TransitionParams): TransitionResult {
    const { tokens, pos } = params;

    if (tokens.length <= pos) {
      return { next: TRANSITION_NAMES.FINISH, params };
    } else if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.ID_OR_NOTE_OR_STYLE, params: { ...params, pos: pos + 1 } };
    } else if (tokens[pos].toUpperCase().includes('NOTE')) {
      return { next: TRANSITION_NAMES.NOTE, params };
    } else if (tokens[pos].toUpperCase().includes('STYLE')) {
      return { next: TRANSITION_NAMES.STYLE, params };
    } else {
      return { next: TRANSITION_NAMES.ID, params };
    }
  },

  [TRANSITION_NAMES.STYLE](params: TransitionParams): TransitionResult {
    const { tokens, pos } = params;
    if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.ID_OR_NOTE_OR_STYLE, params: { ...params, pos: pos + 1 } };
    }
    return { next: TRANSITION_NAMES.STYLE, params: { ...params, pos: pos + 1 } };
  },

  [TRANSITION_NAMES.NOTE](params: TransitionParams): TransitionResult {
    const { tokens, pos } = params;
    if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.ID_OR_NOTE_OR_STYLE, params: { ...params, pos: pos + 1 } };
    }
    return { next: TRANSITION_NAMES.STYLE, params: { ...params, pos: pos + 1 } };
  },

  [TRANSITION_NAMES.ID](params: TransitionParams): TransitionResult {
    const { tokens, pos, current } = params;
    if (tokens.length <= pos) {
      return { next: TRANSITION_NAMES.FINISH, params };
    }
    if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.ID, params: { ...params, pos: pos + 1 } };
    }

    const idDoesNotExists = tokens[pos].includes('-->');
    current.id = idDoesNotExists ? '' : tokens[pos];
    return {
      next: TRANSITION_NAMES.TIME_LINE,
      params: {
        ...params,
        current,
        tokens,
        pos: idDoesNotExists ? pos : pos + 1
      }
    };
  },

  [TRANSITION_NAMES.TIME_LINE](params: TransitionParams): TransitionResult {
    const { tokens, pos, current } = params;

    const timeLine = tokens[pos];
    const [from, to] = timeLine.split('-->');
    current.from = timestampToMillisecond(from);
    current.to = timestampToMillisecond(to);
    return { next: TRANSITION_NAMES.TEXT, params: { ...params, current, pos: pos + 1 } };
  },

  [TRANSITION_NAMES.TEXT](params: TransitionParams): TransitionResult {
    const { tokens, pos, current } = params;
    if (tokens.length <= pos) {
      return { next: TRANSITION_NAMES.FINISH, params };
    }
    if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.FIN_ENTRY, params };
    }
    current.text = tokens[pos];
    return { next: TRANSITION_NAMES.MULTI_LINE_TEXT, params: { ...params, current, pos: pos + 1 } };
  },

  [TRANSITION_NAMES.MULTI_LINE_TEXT](params: TransitionParams): TransitionResult {
    const { tokens, pos, current } = params;
    if (tokens.length <= pos) {
      return { next: TRANSITION_NAMES.FINISH, params };
    }
    if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.FIN_ENTRY, params };
    }
    current.text = `${current.text}\n${tokens[pos]}`;
    return { next: TRANSITION_NAMES.MULTI_LINE_TEXT, params: { ...params, current, pos: pos + 1 } };
  },

  [TRANSITION_NAMES.FIN_ENTRY](params: TransitionParams): TransitionResult {
    const { pos, current, result } = params;
    if (isEntryFromPartial(current)) {
      result.push(current);
    } else {
      throw new Error(`Parsing error current not complete ${JSON.stringify(current)}`);
    }
    return { next: TRANSITION_NAMES.ID_OR_NOTE_OR_STYLE, params: { ...params, current: {}, pos: pos + 1 } };
  },

  [TRANSITION_NAMES.FINISH](params: TransitionParams): TransitionResult {
    return {
      next: TRANSITION_NAMES.FINISH,
      params
    };
  }
});

export const vttParser = (raw: string): ParsedResult => {
  return {
    entries: VttMachine().start(raw)
  };
};
