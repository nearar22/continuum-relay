// rolePresets.js
// ==============
// Receiver-role presets a sender can pick from when composing a baton. Each
// preset carries a short descriptor and the layers a receiver in that role most
// needs preserved, which the composer uses to gently prompt for completeness.

export const ROLE_PRESETS = [
  {
    id: 'reviewer',
    label: 'Grant reviewer',
    blurb: 'Scores applications against locked criteria, keeps private notes private.',
    emphasis: ['constraints', 'definitionOfDone', 'decisions'],
  },
  {
    id: 'oncall',
    label: 'On-call engineer',
    blurb: 'Inherits a live incident; needs the timeline, risk, and the next decision.',
    emphasis: ['currentState', 'unresolvedRisks', 'nextAction'],
  },
  {
    id: 'maintainer',
    label: 'Maintainer',
    blurb: 'Takes over unfinished implementation; needs intent and definition of done.',
    emphasis: ['originalIntent', 'completedWork', 'definitionOfDone'],
  },
  {
    id: 'delegate',
    label: 'Incoming delegate',
    blurb: 'Votes on behalf of others; needs full nuance, not just the headline.',
    emphasis: ['originalIntent', 'decisions', 'unresolvedRisks'],
  },
  {
    id: 'moderator',
    label: 'Community moderator',
    blurb: 'Continues a sensitive dispute; needs constraints and confidential boundaries.',
    emphasis: ['constraints', 'currentState', 'peopleWaiting'],
  },
  {
    id: 'contributor',
    label: 'Open-source contributor',
    blurb: 'Picks up a task cold; needs the mission, next action, and done state.',
    emphasis: ['mission', 'nextAction', 'definitionOfDone'],
  },
];

export function getRolePreset(id) {
  return ROLE_PRESETS.find((r) => r.id === id) || null;
}
