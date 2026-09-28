---
"@adapttable/core": minor
"@adapttable/ai": minor
"@adapttable/react": patch
"@adapttable/ai-react": patch
---

Move the AI view model and table agent controller out of React. `@adapttable/core/binding` adds the assistant panel's view contracts and presentation rules (`assistantBadgeTone`, `assistantComposerState`, `assistantReceiptHeadline`, `assistantFloatingStyle` and the rest), and `@adapttable/ai` adds `createTableAgentController`, which owns approval parking, always-allow memory, bridge announcements, column sampling and the WebMCP lifecycle. `@adapttable/react` and `tableAgent` in `@adapttable/ai-react` now render from them, with their public API and behaviour unchanged.
