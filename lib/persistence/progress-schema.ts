import { z } from "zod";
import {
  CARD_KINDS,
  RECALL_RATINGS,
  SESSION_MODES,
  type CardId,
  type CardReviewState,
  type ProgressRecord,
  type SessionSummary,
  type StudySession,
  type StudySettings,
} from "@/domain/study/types";
import { SESSION_SIZE_LIMITS } from "@/domain/study/settings.service";

export const CURRENT_PROGRESS_VERSION = 2;
export const CURRENT_SETTINGS_VERSION = 1;
export const EXPORT_FORMAT = "valence-progress";

const timestamp = z.number().int().nonnegative();
const sectionId = z.number().int().positive();

export const cardIdSchema = z
  .string()
  .regex(new RegExp(`^\\d{1,3}:(${CARD_KINDS.join("|")})$`), "Invalid card id")
  .transform((value) => value as CardId);

const ratingSchema = z.enum(RECALL_RATINGS);

const reviewLogSchema = z.object({
  reviewedAt: timestamp,
  rating: ratingSchema,
  intervalDays: z.number().nonnegative(),
});

export const cardStateSchema: z.ZodType<CardReviewState> = z.object({
  cardId: cardIdSchema,
  easeFactor: z.number().min(1.3).max(5),
  intervalDays: z.number().nonnegative(),
  repetitions: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  dueAt: timestamp,
  lastReviewedAt: timestamp.nullable(),
  history: z.array(reviewLogSchema),
});

const sessionSchema: z.ZodType<StudySession> = z.object({
  id: z.string().min(1),
  mode: z.enum(SESSION_MODES),
  sectionId: sectionId.nullable(),
  queue: z.array(cardIdSchema).min(1),
  position: z.number().int().nonnegative(),
  revealed: z.boolean(),
  answers: z.array(z.object({ cardId: cardIdSchema, rating: ratingSchema, answeredAt: timestamp })),
  requeueCounts: z.record(z.string(), z.number().int().nonnegative()),
  unlockedDuringSession: z.array(sectionId),
  startedAt: timestamp,
  completedAt: timestamp.nullable(),
});

const ratingCountsSchema = z.object({
  again: z.number().int().nonnegative(),
  hard: z.number().int().nonnegative(),
  good: z.number().int().nonnegative(),
  easy: z.number().int().nonnegative(),
});

const sessionSummarySchema: z.ZodType<SessionSummary> = z.object({
  id: z.string().min(1),
  mode: z.enum(SESSION_MODES),
  sectionId: sectionId.nullable(),
  startedAt: timestamp,
  completedAt: timestamp,
  totalAnswers: z.number().int().nonnegative(),
  uniqueCards: z.number().int().nonnegative(),
  correct: z.number().int().nonnegative(),
  accuracy: z.number().min(0).max(1),
  ratings: ratingCountsSchema,
  unlockedSectionIds: z.array(sectionId),
});

export const progressRecordSchema: z.ZodType<ProgressRecord> = z
  .object({
    cards: z.record(z.string(), cardStateSchema),
    unlockedSectionIds: z.array(sectionId).min(1),
    activeSession: sessionSchema.nullable(),
    sessionHistory: z.array(sessionSummarySchema),
    updatedAt: timestamp,
  })
  .superRefine((record, ctx) => {
    for (const [key, state] of Object.entries(record.cards)) {
      if (key !== state.cardId) {
        ctx.addIssue({ code: "custom", path: ["cards", key], message: "Card key does not match cardId" });
      }
    }
  });

export const progressEnvelopeV2Schema = z.object({
  schemaVersion: z.literal(2),
  data: progressRecordSchema,
});

/** Format written by the first prototype, before review history was tracked. */
export const progressEnvelopeV1Schema = z.object({
  schemaVersion: z.literal(1),
  highestSection: z.number().int().positive(),
  reviews: z.record(
    z.string(),
    z.object({
      ease: z.number(),
      interval: z.number().nonnegative(),
      reps: z.number().int().nonnegative(),
      due: timestamp,
    }),
  ),
  savedAt: timestamp,
});

export type ProgressEnvelopeV1 = z.infer<typeof progressEnvelopeV1Schema>;
export type ProgressEnvelopeV2 = z.infer<typeof progressEnvelopeV2Schema>;

export const versionProbeSchema = z.looseObject({ schemaVersion: z.number().int().positive() });

export const settingsSchema: z.ZodType<StudySettings> = z.object({
  sessionSize: z.number().int().min(SESSION_SIZE_LIMITS.min).max(SESSION_SIZE_LIMITS.max),
  cardKinds: z.array(z.enum(CARD_KINDS)).min(1),
});

export const settingsEnvelopeSchema = z.object({
  schemaVersion: z.literal(CURRENT_SETTINGS_VERSION),
  data: settingsSchema,
});

export const exportBundleSchema = z.object({
  format: z.literal(EXPORT_FORMAT),
  exportedAt: timestamp,
  progress: z.unknown(),
  settings: z.unknown().optional(),
});
