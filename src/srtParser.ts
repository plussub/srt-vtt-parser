import { ParsedResult, Entry } from './types';

class SrtMachine{
  result: Entry[] = [];
  current: Partial<Entry> = {};

  constructor() {
  }
  start(raw: string): Entry[] {
    this.id(raw.split(/\n/), 0);
    return this.result;
  }

  id(tokens: string[], pos: number) {
    if (tokens.length <= pos) {
      this.finish();
      return;
    }
    if (isBlank(tokens[pos])) {
      this.id(tokens, ++pos);
      return;
    }

    const idDoesNotExists = tokens[pos].includes('-->');
    this.current.id = idDoesNotExists ? '' : tokens[pos];
    this.timeLine(tokens, idDoesNotExists ? pos : ++pos);
  }

  timeLine(tokens: string[], pos: number) {
    const timeLine = tokens[pos];
    const [from, to] = timeLine.split('-->');
    this.current.from = timestampToMillisecond(from);
    this.current.to = timestampToMillisecond(to);
    this.text(tokens, ++pos);
  }

  text(tokens: string[], pos: number) {
    if (tokens.length <= pos) {
      this.finish();
      return;
    }
    if (isBlank(tokens[pos])) {
      this.finEntry(tokens, pos);
      return;
    }
    this.current.text = tokens[pos];
    this.multiLineText(tokens, ++pos);
  }

  multiLineText(tokens: string[], pos: number) {
    if (tokens.length <= pos) {
      this.finish();
      return;
    }
    if (isBlank(tokens[pos])) {
      this.finEntry(tokens, pos);
      return;
    }
    this.current.text = `${this.current.text}\n${tokens[pos]}`;
    this.multiLineText(tokens, ++pos);
  }

  finEntry(tokens: string[], pos: number) {
    // @ts-ignore
    this.result.push({ ...this.current });
    this.current = {};
    this.id(tokens, ++pos);
  }
  finish() {}
}
const isBlank = (str: string) => !str || /^\s*$/.test(str);

const timestampToMillisecond = (value: string) => {
  const [hours, minutes, seconds] = value.split(':');
  return parseInt(seconds.replace(',', ''), 10) + parseInt(minutes, 10) * 60 * 1000 + parseInt(hours, 10) * 60 * 60 * 1000;
};

export const srtParser = (raw: string): ParsedResult => {
  return {
    entries: new SrtMachine().start(raw)
  };
};
