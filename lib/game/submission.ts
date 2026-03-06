export const resolveSubmittedScore = (finalRunScore: number, responseScore: unknown): number => {
  if (typeof responseScore === 'number' && responseScore !== finalRunScore) {
    throw new Error(`Score mismatch after submission (expected ${finalRunScore}, got ${responseScore}).`);
  }

  return finalRunScore;
};
