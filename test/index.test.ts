import { parse } from '@/index';
import srt from './srt';
import vtt from './vtt';
import vttWithoutIdentifier from './vttWithoutIdentifier';
import vttWithMixedIdentifier from './vttWithMixedIdentifier';
import vttWithNote from './vttWithNote';
import vttWithMultilineNode from './vttWithMultilineNote';
import vttWithStyle from './vttWithStyle';
import vttWithInlineStyle from './vttWithInlineStyle';
import result from './result.json';

describe('srt-vtt-parser', () => {
  it.each`
    raw    | note
    ${srt} | ${'should parse simple srt file'}
    ${vtt} | ${'should parse simple vtt file'}
    ${vttWithoutIdentifier} | ${'should parse vtt file without identifier'}
    ${vttWithMixedIdentifier} | ${'should parse vtt file with mixed identifier'}
    ${vttWithNote} | ${'should vtt file with note'}
    ${vttWithMultilineNode} | ${'should vtt file with multiline note'}
    ${vttWithStyle} | ${'should parse vtt file with style blocks'}
    ${vttWithInlineStyle} | ${'should parse vtt file with inline style'}
  `('$note', async ({ raw }) => {
    const parsedResult = parse(raw);
    expect(parsedResult).toEqual(result);
  });
});
