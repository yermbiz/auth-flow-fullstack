const validatePasswordComplexity = (password) => {
  // eslint-disable-next-line no-undef
  const complexity = process.env.REACT_APP_PASSWORD_COMPLEXITY || 'simple';
  
  if (complexity === 'simple') {
    // Simple: At least 3 characters
    return password.length >= 3;
  } else if (complexity === 'complex') {
    // Complex: At least 8 characters, one uppercase, one number, and one special character
    const complexRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    return complexRegex.test(password);
  }
  return true; // Default to always valid if no rule is set
};

export default validatePasswordComplexity;
