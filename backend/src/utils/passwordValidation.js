const validatePasswordComplexity = (password) => {
  const complexity = process.env.PASSWORD_COMPLEXITY || 'simple';
  if (complexity === 'simple') {
    // Simple: At least 3 characters
    return password.length >= 3;
  } else if (complexity === 'complex') {
    // Complex: At least 8 characters, one uppercase, one number, and one special character
    const complexRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*_]).{8,}$/;
    return complexRegex.test(password);
  }

  return true; // Default to always valid if no rule is set
};

module.exports = validatePasswordComplexity;
