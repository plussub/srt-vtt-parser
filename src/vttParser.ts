import { ParsedResult, Entry } from './types';
import mitt, { Emitter } from 'mitt';
import { EventType } from 'mitt/src/index';

interface TransitionParams {
  tokens: string[];
  pos: number;
  result: Entry[];
  current: Partial<Entry>;
  context: {
    emitter: Emitter;
    emit: <TransitionParams>(type: EventType, event: TransitionParams) => void;
  };
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

const throwIfUndef = <T = any>(fn: (event: T) => void) => {
  return (params: T | undefined) => {
    if (!params) {
      throw new Error('transition has undefined params undefinded');
    }
    return fn(params);
  };
};

const isBlank = (str: string) => !str || /^\s*$/.test(str);

const timestampToMillisecond = (value: string) => {
  const [hours, minutes, seconds] = value.split(':');
  return parseInt(seconds.replace('.', ''), 10) + parseInt(minutes, 10) * 60 * 1000 + parseInt(hours, 10) * 60 * 60 * 1000;
};

class VttMachine {
  private emitter: Emitter;
  private currentHandlers: {
    fn: (event: TransitionParams | undefined) => void;
    transitionName: string;
  }[] = [];

  constructor() {
    this.emitter = mitt();
  }

  start(raw: string): Promise<Entry[]> {
    this.currentHandlers = Object.values(TRANSITION_NAMES).map((transitionName) => ({
      // @ts-ignore
      fn: (event: TransitionParams | undefined) => setImmediate(() => this[transitionName].bind(this)(event)),
      transitionName
    }));

    this.currentHandlers.forEach(({ transitionName, fn }) => {
      this.emitter.on<TransitionParams>(transitionName, fn);
    });

    const promise = new Promise<Entry[]>((resolve) => {
      const handler = throwIfUndef(({ result, context: { emitter } }: TransitionParams): void => {
        emitter.off(TRANSITION_NAMES.FINISH, handler);
        this.shutdown();
        resolve(result);
      });
      this.emitter.on(TRANSITION_NAMES.FINISH, handler);
    });

    this.emitter.emit<TransitionParams>(TRANSITION_NAMES.HEADER, {
      tokens: raw.split(/\n/),
      pos: 0,
      result: [],
      current: {},
      context: {
        emit: this.emitter.emit,
        emitter: this.emitter
      }
    });

    return promise;
  }

  shutdown() {
    this.currentHandlers.forEach(({ transitionName, fn }) => {
      this.emitter.off(transitionName, fn);
    });
    this.currentHandlers = []; // this.emitter.all
  }

  [TRANSITION_NAMES.HEADER](params: TransitionParams): void {
    const {
      context: { emit }
    } = params;
    emit(TRANSITION_NAMES.ID, { ...params, pos: ++params.pos });
  }

  [TRANSITION_NAMES.ID](params: TransitionParams) {
    const {
      tokens,
      pos,
      current,
      context: { emit }
    } = params;
    if (tokens.length <= pos) {
      emit(TRANSITION_NAMES.FINISH, params);
      return;
    }
    if (isBlank(tokens[pos])) {
      emit(TRANSITION_NAMES.ID, { ...params, pos: pos + 1 });
      return;
    }

    const idDoesNotExists = tokens[pos].includes('-->');
    current.id = idDoesNotExists ? '' : tokens[pos];
    emit(TRANSITION_NAMES.TIME_LINE, {
      ...params,
      current,
      tokens,
      pos: idDoesNotExists ? pos : pos + 1
    });
  }

  [TRANSITION_NAMES.TIME_LINE](params: TransitionParams) {
    const {
      tokens,
      pos,
      current,
      context: { emit }
    } = params;
    const timeLine = tokens[pos];
    const [from, to] = timeLine.split('-->');
    current.from = timestampToMillisecond(from);
    current.to = timestampToMillisecond(to);
    emit(TRANSITION_NAMES.TEXT, { ...params, current, pos: pos + 1 });
  }

  [TRANSITION_NAMES.TEXT](params: TransitionParams) {
    const {
      tokens,
      pos,
      current,
      context: { emit }
    } = params;
    if (tokens.length <= pos) {
      emit(TRANSITION_NAMES.FINISH, params);
      return;
    }
    if (isBlank(tokens[pos])) {
      emit(TRANSITION_NAMES.FIN_ENTRY, params);
      return;
    }
    current.text = tokens[pos];
    emit(TRANSITION_NAMES.MULTI_LINE_TEXT, { ...params, current, pos: pos + 1 });
  }

  [TRANSITION_NAMES.MULTI_LINE_TEXT](params: TransitionParams) {
    const {
      tokens,
      pos,
      current,
      context: { emit }
    } = params;
    if (tokens.length <= pos) {
      emit(TRANSITION_NAMES.FINISH, params);
      return;
    }
    if (isBlank(tokens[pos])) {
      emit(TRANSITION_NAMES.FIN_ENTRY, params);
      return;
    }
    current.text = `${current.text}\n${tokens[pos]}`;
    emit(TRANSITION_NAMES.MULTI_LINE_TEXT, { ...params, current, pos: pos + 1 });
  }

  [TRANSITION_NAMES.FIN_ENTRY](params: TransitionParams) {
    const {
      pos,
      current,
      result,
      context: { emit }
    } = params;
    // @ts-ignore
    result.push(current);
    // console.log(this.current);
    emit(TRANSITION_NAMES.ID, { ...params, current: {}, pos: pos + 1 });
  }

  [TRANSITION_NAMES.FINISH](_: TransitionParams) {}
}

export const vttParser = async (raw: string): Promise<ParsedResult> => {
  return {
    entries: await new VttMachine().start(raw)
  };
};
