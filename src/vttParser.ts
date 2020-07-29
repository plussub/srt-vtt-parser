import { Entry, ParsedResult } from './types';

interface TransitionParams {
  tokens: string[];
  pos: number;
  result: Entry[];
  current: Partial<Entry>;
}

const TRANSITION_NAMES = {
  HEADER: 'header',
  ID: 'id',
  TIME_LINE: 'timeLine',
  TEXT: 'text',
  MULTI_LINE_TEXT: 'multiLineText',
  FIN_ENTRY: 'finEntry',
  FINISH: 'finish'
};

const isBlank = (str: string) => !str || /^\s*$/.test(str);

const timestampToMillisecond = (value: string) => {
  const [hours, minutes, seconds] = value.split(':');
  return parseInt(seconds.replace('.', ''), 10) + parseInt(minutes, 10) * 60 * 1000 + parseInt(hours, 10) * 60 * 60 * 1000;
};

class VttMachine {
  start(raw: string): Entry[] {
    let currentTransition = TRANSITION_NAMES.HEADER;
    let params = {
      tokens: raw.split(/\n/),
      pos: 0,
      result: [],
      current: {}
    };
    while (currentTransition !== TRANSITION_NAMES.FINISH) {
      // @ts-expect-error
      const result = this[currentTransition](params);
      params = result.params;
      currentTransition = result.next;
    }

    return params.result;
  }

  [TRANSITION_NAMES.HEADER](params: TransitionParams) {
    return { next: TRANSITION_NAMES.ID, params: { ...params, pos: ++params.pos } };
  }

  [TRANSITION_NAMES.ID](params: TransitionParams) {
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
  }

  [TRANSITION_NAMES.TIME_LINE](params: TransitionParams) {
    const { tokens, pos, current } = params;
    const timeLine = tokens[pos];
    const [from, to] = timeLine.split('-->');
    current.from = timestampToMillisecond(from);
    current.to = timestampToMillisecond(to);
    return { next: TRANSITION_NAMES.TEXT, params: { ...params, current, pos: pos + 1 } };
  }

  [TRANSITION_NAMES.TEXT](params: TransitionParams) {
    const { tokens, pos, current } = params;
    if (tokens.length <= pos) {
      return { next: TRANSITION_NAMES.FINISH, params };
    }
    if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.FIN_ENTRY, params };
    }
    current.text = tokens[pos];
    return { next: TRANSITION_NAMES.MULTI_LINE_TEXT, params: { ...params, current, pos: pos + 1 } };
  }

  [TRANSITION_NAMES.MULTI_LINE_TEXT](params: TransitionParams) {
    const { tokens, pos, current } = params;
    if (tokens.length <= pos) {
      return { next: TRANSITION_NAMES.FINISH, params };
    }
    if (isBlank(tokens[pos])) {
      return { next: TRANSITION_NAMES.FIN_ENTRY, params };
    }
    current.text = `${current.text}\n${tokens[pos]}`;
    return { next: TRANSITION_NAMES.MULTI_LINE_TEXT, params: { ...params, current, pos: pos + 1 } };
  }

  [TRANSITION_NAMES.FIN_ENTRY](params: TransitionParams) {
    const { pos, current, result } = params;
    // @ts-expect-error
    result.push(current);
    return { next: TRANSITION_NAMES.ID, params: { ...params, current: {}, pos: pos + 1 } };
  }

  [TRANSITION_NAMES.FINISH](_: TransitionParams) {}
}

export const vttParser = (raw: string): ParsedResult => {
  return {
    entries: new VttMachine().start(raw)
  };
};
