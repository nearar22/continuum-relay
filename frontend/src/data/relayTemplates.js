// relayTemplates.js
// =================
// Starter templates for the Baton Composer. Each template pre-fills the twelve
// layers for a common handoff situation so a contributor can compose a complete
// baton fast, then adjust. These are scaffolds, not the demo seed batons.

export const RELAY_TEMPLATES = [
  {
    id: 'tmpl-incident',
    name: 'Incident handover',
    receiverRole: 'On-call engineer (next timezone)',
    description: 'Pass a live incident across timezones without losing the timeline.',
    layers: {
      mission: 'Hand over an active incident to the next on-call without losing context.',
      originalIntent: 'Restore the service while keeping a clean public status narrative.',
      currentState: 'Describe the current error rate, what is degraded, and what mitigation is live.',
      completedWork: 'List the mitigations already applied and the current root-cause hypothesis.',
      unresolvedRisks: 'Name the single risk most likely to escalate this incident.',
      decisions: 'Record the decisions made so far and why a rollback was or was not taken.',
      constraints: 'Do not post raw internal error logs to the public status page.',
      nextAction: 'State the next concrete decision and its deadline.',
      definitionOfDone: 'Error rate back under target and status page fully operational.',
      peopleWaiting: 'Who is watching the status page and waiting on resolution.',
    },
  },
  {
    id: 'tmpl-review',
    name: 'Review handoff',
    receiverRole: 'Reviewer',
    description: 'Continue a review while protecting confidential notes.',
    layers: {
      mission: 'Continue the review process from where it stands.',
      originalIntent: 'Judge fairly while keeping private notes confidential.',
      currentState: 'How many items are reviewed, how many remain, what is finalized.',
      completedWork: 'What has been scored or assessed so far.',
      unresolvedRisks: 'Where a misread score or note could cause harm.',
      decisions: 'Locked criteria and any decisions already taken.',
      constraints: 'Do not expose private reviewer notes to applicants under any circumstances.',
      nextAction: 'The remaining items to review and how to write the public explanations.',
      definitionOfDone: 'All items have public-facing explanations with no private data leaked.',
      peopleWaiting: 'Applicants and leads awaiting the outcome.',
    },
  },
  {
    id: 'tmpl-feature',
    name: 'Feature handoff',
    receiverRole: 'Maintainer',
    description: 'Pass unfinished implementation to a maintainer.',
    layers: {
      mission: 'Finish the feature so it can ship.',
      originalIntent: 'The user-facing outcome this feature is meant to deliver.',
      currentState: 'What is built, what is partial, what is untested.',
      completedWork: 'The components and logic already complete.',
      unresolvedRisks: 'The part most likely to be misread or break.',
      decisions: 'Architectural decisions that must hold.',
      constraints: 'Anything that must never be exposed or changed.',
      nextAction: 'The next implementation step and how to test it.',
      definitionOfDone: 'The verifiable condition that means this feature is finished.',
      peopleWaiting: 'Who is blocked until this ships.',
    },
  },
  {
    id: 'tmpl-blank',
    name: 'Blank baton',
    receiverRole: '',
    description: 'Start from an empty baton and compose every layer yourself.',
    layers: {
      mission: '',
      originalIntent: '',
      currentState: '',
      completedWork: '',
      unresolvedRisks: '',
      decisions: '',
      constraints: '',
      nextAction: '',
      definitionOfDone: '',
      peopleWaiting: '',
    },
  },
];

export function getTemplate(id) {
  return RELAY_TEMPLATES.find((t) => t.id === id) || null;
}
