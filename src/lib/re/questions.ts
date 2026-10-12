import type { AnswerValue } from "@/lib/types"
import type { QuestionDefinition, TemplateSection } from "@/lib/re/templates"

export function isQuestionVisible(
  question: QuestionDefinition,
  answers: Record<string, AnswerValue> | undefined
) {
  if (!question.visibleWhen) return true
  const value = answers?.[question.visibleWhen.questionId]
  return value === question.visibleWhen.equals
}

export function visibleQuestions(section: TemplateSection, answers: Record<string, AnswerValue> | undefined) {
  return section.questions.filter((question) => isQuestionVisible(question, answers))
}
