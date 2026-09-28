/**
 * What the assistant chrome reads, described structurally.
 *
 * The contracts are core's, so every binding's panel reads the same shape.
 * Re-exported here under the names this package has always published.
 */
export {
  assistantIsBusy,
  assistantIsUsable,
  type TableAssistantAllowanceView,
  type TableAssistantMessageView,
  type TableAssistantProgressView,
  type TableAssistantQuestionOption,
  type TableAssistantQuestionView,
  type TableAssistantReceiptSubject,
  type TableAssistantReceiptView,
  type TableAssistantResumableView,
  type TableAssistantSuggestionView,
  type TableAssistantUndoView,
  type TableAssistantView,
} from "@adapttable/core/binding";
