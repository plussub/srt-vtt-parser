export default `WEBVTT

STYLE
::cue {
  background-image: linear-gradient(to bottom, dimgray, lightgray);
  color: papayawhip;
}
/* Style blocks cannot use blank lines nor "dash dash greater than" */

NOTE comment blocks can be used between style blocks.

STYLE
::cue(b) {
  color: peachpuff;
}

00:01:42.821 --> 00:01:44.289
(SIREN WAILING IN DISTANCE)
multiline test

NOTE style blocks cannot appear after the first cue.
multiline comment

NOTE another comment

1
00:01:45.365 --> 00:01:48.084
<i>DRIVER: There's 100,000 streets in this city.</i>

wtf that is also an identifier
00:01:49.077 --> 00:01:51.421
You don't need to know the route.
`
