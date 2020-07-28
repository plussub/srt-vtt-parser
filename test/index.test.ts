import { parse } from '@/index';
import srt from './srt';
import srtMultiWhitespaces from './srtMultiwhitespaces';
import vttMultiWhitespaces from './vttMultiWhitespaces';
import vtt from './vtt';
import vttWithoutIdentifier from './vttWithoutIdentifier';
import vttWithMixedIdentifier from './vttWithMixedIdentifier';
import vttWithNote from './vttWithNote';
import vttWithMultilineNode from './vttWithMultilineNote';
import vttWithStyle from './vttWithStyle';
import vttWithInlineStyle from './vttWithInlineStyle';
import drivesrt from './drivesrt';
import result from './result.json';

describe('srt-vtt-parser', () => {
  it.each`
    raw                       | note
    ${srt}                    | ${'should parse simple srt file'}
    ${srtMultiWhitespaces}    | ${'should parse srt file with multiple whitespaces'}
    ${vtt}                    | ${'should parse simple vtt file'}
    ${vttMultiWhitespaces}    | ${'should parse vtt file with multiple whitespaces'}
    ${vttWithoutIdentifier}   | ${'should parse vtt file without identifier'}
    ${vttWithMixedIdentifier} | ${'should parse vtt file with mixed identifier'}
    ${vttWithNote}            | ${'should vtt file with note'}
    ${vttWithMultilineNode}   | ${'should vtt file with multiline note'}
    ${vttWithStyle}           | ${'should parse vtt file with style blocks'}
    ${vttWithInlineStyle}     | ${'should parse vtt file with inline style'}
  `('$note', async ({ raw }) => {
    const parsedResult = parse(raw);
    expect(parsedResult).toEqual(result);
  });

  it('parse whole srt file', () => {
    console.warn(parse(drivesrt));
  });
});
