const validatePassword = (req, res, next) => {
  const { password } = req.body;

  // Cek minimal 6 karakter
  if (!password || password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long.',
    });
  }

  // Regex untuk masing-masing kriteria
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password); // simbol: karakter non-alphanumeric

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
    return res.status(400).json({
      error: 'Password must include uppercase, lowercase, number, and symbol.',
    });
  }

  next();
};

module.exports = validatePassword;
