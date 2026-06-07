import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from './semanticEngine';

describe('semanticEngine', () => {
  describe('cosineSimilarity', () => {
    it('returns 1.0 for identical vectors', () => {
      const v1 = [1, 0, 1, 0];
      const v2 = [1, 0, 1, 0];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(1.0, 5);
    });

    it('returns 0.0 for completely orthogonal vectors', () => {
      const v1 = [1, 0];
      const v2 = [0, 1];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(0.0, 5);
    });

    it('returns -1.0 for completely opposite vectors', () => {
      const v1 = [1, 2, 3];
      const v2 = [-1, -2, -3];
      expect(cosineSimilarity(v1, v2)).toBeCloseTo(-1.0, 5);
    });

    it('returns 0.0 if one of the vectors is empty or mismatched dimensions', () => {
      expect(cosineSimilarity([], [1, 2])).toBe(0);
      expect(cosineSimilarity([1], [1, 2])).toBe(0);
    });
  });
});
