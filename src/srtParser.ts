import { ParsedResult, Entry } from './types';
import { createMachine, interpret } from 'xstate';

const machine = {
  result: [] as any[],
  current: {} as any,
  transistions: {
    start(tokens: string[], pos: number) {
      machine.transistions.id(tokens, pos);
    },
    // @ts-ignore
    id(tokens: string[], pos: number) {
      if (tokens.length === pos) {
        return machine.transistions.finish();
      }
      if (isBlank(tokens[pos])) {
        return machine.transistions.id(tokens, ++pos);
      }

      const idDoesNotExists = tokens[pos].includes('-->');
      machine.current.id = idDoesNotExists ? '' : tokens[pos];
      return machine.transistions.timeLine(tokens, idDoesNotExists ? pos : ++pos);
    },
    // @ts-ignore
    timeLine(tokens: string[], pos: number) {
      const timeLine = tokens[pos];
      const [from, to] = timeLine.split('-->');
      machine.current.from = timestampToMillisecond(from);
      machine.current.to = timestampToMillisecond(to);
      return machine.transistions.text(tokens, ++pos);
    },
    // @ts-ignore
    text(tokens: string[], pos: number) {
      if (tokens.length === pos) {
        return machine.transistions.finish();
      }
      if (isBlank(tokens[pos])) {
        return machine.transistions.finEntry(tokens, pos);
      }
      machine.current.text = tokens[pos];
      return machine.transistions.multiLineText(tokens, ++pos);
    },
    // @ts-ignore
    multiLineText(tokens: string[], pos: number) {
      if (tokens.length === pos) {
        return machine.transistions.finish();
      }
      if (isBlank(tokens[pos])) {
        return machine.transistions.finEntry(tokens, pos);
      }
      machine.current.text = `${machine.current.text}\n${tokens[pos]}`;
      return machine.transistions.multiLineText(tokens, ++pos);
    },
    // @ts-ignore
    finEntry(tokens: string[], pos: number) {
      machine.result.push({ ...machine.current });
      machine.current = {};
      return machine.transistions.id(tokens, ++pos);
    },
    finish() {}
  }
};
const isBlank = (str: string) => !str || /^\s*$/.test(str);

const timestampToMillisecond = (value: string) => {
  const [hours, minutes, seconds] = value.split(':');
  return parseInt(seconds.replace(',', ''), 10) + parseInt(minutes, 10) * 60 * 1000 + parseInt(hours, 10) * 60 * 60 * 1000;
};

export const srtParser = (raw: string): ParsedResult => {
  machine.transistions.start(raw.split(/\n/), 0);
  return {
    entries: machine.result
  };
};
