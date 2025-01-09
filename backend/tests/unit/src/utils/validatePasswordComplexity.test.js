const validatePasswordComplexity = require('../../../../src/utils/passwordValidation');

describe('validatePasswordComplexity', () => {
  let originalPasswordComplexity;

  beforeAll(() => {
    // Save the original PASSWORD_COMPLEXITY environment variable
    originalPasswordComplexity = process.env.PASSWORD_COMPLEXITY;
  });

  afterAll(() => {
    // Restore the original PASSWORD_COMPLEXITY environment variable
    process.env.PASSWORD_COMPLEXITY = originalPasswordComplexity;
  });

  describe('Simple Complexity', () => {
    beforeEach(() => {
      process.env.PASSWORD_COMPLEXITY = 'simple';
    });

    it('should return true for passwords with at least 3 characters', () => {
      expect(validatePasswordComplexity('abc')).toBe(true);
      expect(validatePasswordComplexity('123')).toBe(true);
    });

    it('should return false for passwords with fewer than 3 characters', () => {
      expect(validatePasswordComplexity('ab')).toBe(false);
      expect(validatePasswordComplexity('1')).toBe(false);
    });
  });

  describe('Complex Complexity', () => {
    beforeEach(() => {
      process.env.PASSWORD_COMPLEXITY = 'complex';
    });

    it('should return true for passwords meeting complexity requirements', () => {
      expect(validatePasswordComplexity('Abcdef1!')).toBe(true);
      expect(validatePasswordComplexity('StrongPass1$')).toBe(true);
    });

    it('should return false for passwords not meeting complexity requirements', () => {
      expect(validatePasswordComplexity('abcdefg')).toBe(false); // No uppercase, number, or special character
      expect(validatePasswordComplexity('ABCDEFG1')).toBe(false); // No special character
      expect(validatePasswordComplexity('Abcdef!')).toBe(false); // No number
      expect(validatePasswordComplexity('12345678')).toBe(false); // No uppercase or special character
    });
  });

  describe('Default Behavior', () => {
    beforeEach(() => {
      delete process.env.PASSWORD_COMPLEXITY;
    });

    it('should return true if complexity is not set', () => {
      expect(validatePasswordComplexity('abc')).toBe(true);
      expect(validatePasswordComplexity('Complex1$')).toBe(true);
    });
    it('should return false if complexity is not set', () => {
      expect(validatePasswordComplexity('')).toBe(false);
    });
  });
});
