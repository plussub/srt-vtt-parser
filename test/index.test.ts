import { parse } from '@/index';
import srt from './srt';
import srtMultiWhitespaces from './srtMultiwhitespaces';
import srtWithEmptyTextLines from './srtWithEmptyTextLines';
import vttMultiWhitespaces from './vttMultiWhitespaces';
import vttWithEmptyTextLines from './vttWithEmptyTextLines';
import vtt from './vtt';
import vttWithoutIdentifier from './vttWithoutIdentifier';
import vttWithMixedIdentifier from './vttWithMixedIdentifier';
import vttWithMixedIdentifierStyleAndNote from './vttWithMixedIdentifierStyleAndNote';
import vttWithNote from './vttWithNote';
import vttWithMultilineNode from './vttWithMultilineNote';
import vttWithStyle from './vttWithStyle';
import vttWithInlineStyle from './vttWithInlineStyle';
import driveSrt from './driveSrt';
import pulpfictionVtt from './pulpfictionVtt';
import result from './result.json';
import resultWithoutId from './resultWithoutId.json';
import resultWithMixedId from './resultWithMixedId.json';
import resultWithEmptyTextLines from './resultWithEmptyTextLines.json';

describe('srt-vtt-parser', () => {
  it.each`
    raw                                   | expected                    | note
    ${srt}                                | ${result}                   | ${'should parse simple srt file'}
    ${srtMultiWhitespaces}                | ${result}                   | ${'should parse srt file with multiple whitespaces'}
    ${srtWithEmptyTextLines}              | ${resultWithEmptyTextLines} | ${'should parse srt file with empty text lines'}
    ${vtt}                                | ${result}                   | ${'should parse simple vtt file'}
    ${vttMultiWhitespaces}                | ${result}                   | ${'should parse vtt file with multiple whitespaces'}
    ${vttWithEmptyTextLines}              | ${resultWithEmptyTextLines} | ${'should parse vtt file with empty text lines'}
    ${vttWithoutIdentifier}               | ${resultWithoutId}          | ${'should parse vtt file without identifier'}
    ${vttWithMixedIdentifier}             | ${resultWithMixedId}        | ${'should parse vtt file with mixed identifier'}
    ${vttWithNote}                        | ${resultWithoutId}          | ${'should vtt file with note'}
    ${vttWithMultilineNode}               | ${resultWithoutId}          | ${'should vtt file with multiline note'}
    ${vttWithStyle}                       | ${resultWithoutId}          | ${'should parse vtt file with style blocks'}
    ${vttWithMixedIdentifierStyleAndNote} | ${resultWithMixedId}        | ${'should parse vtt file with style blocks'}
    ${vttWithInlineStyle}                 | ${resultWithoutId}          | ${'should parse vtt file with inline style'}
  `('$note', ({ raw, expected }) => {
    const parsedResult = parse(raw);
    expect(parsedResult).toEqual(expected);
  });

  it('parse whole srt file', () => {
    console.warn(parse(driveSrt));
  });

  it('parse whole vtt file', async () => {
    console.warn(await parse(pulpfictionVtt));
  });
});
