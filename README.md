# SRT/VTT Parser
A dependency free SRT / Vtt subtitle parser, written in Typescript.

SRT (SubRip)
```
00:01:42,821 --> 00:01:44,289
(SIREN WAILING IN DISTANCE)
multiline test

2
00:01:45,365 --> 00:01:48,084
<i>DRIVER: There's 100,000 streets in this city.</i>

3
00:01:49,077 --> 00:01:51,421
You don't need to know the route.
```

VTT
```
WEBVTT

1
00:01:42.821 --> 00:01:44.289
(SIREN WAILING IN DISTANCE)
multiline test

2
00:01:45.365 --> 00:01:48.084
<i>DRIVER: There's 100,000 streets in this city.</i>

3
00:01:49.077 --> 00:01:51.421
You don't need to know the route.
```

Results into
```
{
  "entries": [
    {
      "from": 102821,
      "id": "1",
      "text": "(SIREN WAILING IN DISTANCE)\nmultiline test",
      "to": 104289
    },
    {
      "from": 105365,
      "id": "2",
      "text": "<i>DRIVER: There's 100,000 streets in this city.</i>",
      "to": 108084
    },
    {
      "from": 109077,
      "id": "3",
      "text": "You don't need to know the route.",
      "to": 111421
    }
  ]
}
```

Respect NOTE/ MULTILINE NOTE / STYLE Blocks and inline style but will ignore them for the output.


```
WEBVTT

STYLE
::cue {
  background-image: linear-gradient(to bottom, dimgray, lightgray);
  color: papayawhip;
}
/* Style blocks cannot use blank lines nor "dash dash greater than" */

NOTE comment blocks can be used between style blocks.

00:01:42.821 --> 00:01:44.289
(SIREN WAILING IN DISTANCE)
multiline test

NOTE style blocks cannot appear after the first cue.
this is a multiline note block

some identifier
00:01:45.365 --> 00:01:48.084
<i>DRIVER: There's 100,000 streets in this city.</i>


00:01:49.077 --> 00:01:51.421
You don't need to know the route.
```


Results into
```
{
  "entries": [
    {
      "from": 102821,
      "id": "",
      "text": "(SIREN WAILING IN DISTANCE)\nmultiline test",
      "to": 104289
    },
    {
      "from": 105365,
      "id": "some identifier",
      "text": "<i>DRIVER: There's 100,000 streets in this city.</i>",
      "to": 108084
    },
    {
      "from": 109077,
      "id": "",
      "text": "You don't need to know the route.",
      "to": 111421
    }
  ]
}
```
