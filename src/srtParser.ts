import { Entry, isEntryFromPartial, ParsedResult } from './types';
import { isBlank } from './util';

const TRANSITION_NAMES = {
  ID: 'ID',
  TIME_LINE: 'TIME_LINE',
  TEXT: 'TEXT',
  MULTI_LINE_TEXT: 'MULTI_LINE_TEXT',
  FIN_ENTRY: 'FIN_ENTRY',
  FINISH: 'FINISH'
} as const;
type TransitionNames = keyof typeof TRANSITION_NAMES;

type Machine = Record<TransitionNames, (params: TransitionParams) => TransitionResult> & {
  start: (raw: string) => Entry[];
};

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

const timestampToMillisecond = (value: string) => {
  let arr = value.split(':');
  let hours, minutes, seconds ;
  arr.length === 2 ? [minutes, seconds] = arr : [hours, minutes, seconds] = arr;
  return parseInt(seconds.replace(',', ''), 10) + parseInt(minutes, 10) * 60 * 1000 +  (hours ? parseInt(hours, 10) : 0)  * 60 * 60 * 1000;
};

const SrtMachine: () => Machine = () =>({
  start(raw: string): Entry[] {
    let currentTransition: TransitionNames = TRANSITION_NAMES.ID;
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
    return { next: TRANSITION_NAMES.ID, params: { ...params, current: {}, pos: pos + 1 } };
  },

  [TRANSITION_NAMES.FINISH](params: TransitionParams): TransitionResult {
    return {
      next: TRANSITION_NAMES.FINISH,
      params
    };
  }
});

export const srtParser = (raw: string): ParsedResult => {
  return {
    entries: SrtMachine().start(raw)
  };
};
