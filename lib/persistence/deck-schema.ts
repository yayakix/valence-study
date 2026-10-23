import { z } from "zod";
import { DECK_SESSION_MODES, type DeckCardId, type DeckProgress } from "@/domain/decks/types";
import { RECALL_RATINGS } from "@/domain/study/types";

export const CURRENT_DECK_PROGRESS_VERSION = 1;

const timestamp = z.number().int().nonnegative();
const sectionId = z.number().int().positive();
const ratingSchema = z.enum(RECALL_RATINGS);
const modeSchema = z.enum(DECK_SESSION_MODES);

const deckCardIdSchema = z
  .string()
  .regex(/^[^:]+:[^:]+$/, "Invalid card id")
  .transform((value) => value as DeckCardId);

const cardStateSchema = z.object({
  cardId: deckCardIdSchema,
  easeFactor: z.number().min(1.3).max(5),
  intervalDays: z.number().nonnegative(),
  repetitions: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  dueAt: timestamp,
  lastReviewedAt: timestamp.nullable(),
  history: z.array(z.object({ reviewedAt: timestamp, rating: ratingSchema, intervalDays: z.number().nonnegative() })),
});

const sessionSchema = z.object({
  id: z.string().min(1),
  mode: modeSchema,
  sectionId: sectionId.nullable(),
  queue: z.array(deckCardIdSchema).min(1),
  position: z.number().int().nonnegative(),
  revealed: z.boolean(),
  answers: z.array(z.object({ cardId: deckCardIdSchema, rating: ratingSchema, answeredAt: timestamp })),
  requeueCounts: z.record(z.string(), z.number().int().nonnegative()),
  unlockedDuringSession: z.array(sectionId),
  startedAt: timestamp,
  completedAt: timestamp.nullable(),
});

const summarySchema = z.object({
  id: z.string().min(1),
  mode: modeSchema,
  sectionId: sectionId.nullable(),
  startedAt: timestamp,
  completedAt: timestamp,
  totalAnswers: z.number().int().nonnegative(),
  uniqueCards: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(1),
  ratings: z.object({
    again: z.number().int().nonnegative(),
    hard: z.number().int().nonnegative(),
    good: z.number().int().nonnegative(),
    easy: z.number().int().nonnegative(),
  }),
  unlockedSectionIds: z.array(sectionId),
});

export const deckProgressSchema: z.ZodType<DeckProgress> = z
  .object({
    cards: z.record(z.string(), cardStateSchema),
    unlockedSectionIds: z.array(sectionId).min(1),
    promptIds: z.array(z.string().min(1)),
    range: z
      .object({ start: z.number().int().nonnegative(), end: z.number().int().nonnegative() })
      .nullable()
      .default(null),
    activeSession: sessionSchema.nullable(),
    sessionHistory: z.array(summarySchema),
    updatedAt: timestamp,
  })
  .superRefine((record, ctx) => {
    for (const [key, state] of Object.entries(record.cards)) {
      if (key !== state.cardId) {
        ctx.addIssue({ code: "custom", path: ["cards", key], message: "Card key does not match cardId" });
      }
    }
  });

export const deckProgressEnvelopeSchema = z.object({
  schemaVersion: z.literal(CURRENT_DECK_PROGRESS_VERSION),
  data: deckProgressSchema,
});
