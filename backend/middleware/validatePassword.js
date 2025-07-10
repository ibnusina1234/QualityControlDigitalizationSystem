const validatePassword = (req, res, next) => {
  // Ambil password dari salah satu field
  const password = req.body.newPassword || req.body.password;

  if (!password || password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long.',
    });
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
    return res.status(400).json({
      error: 'Password must include uppercase, lowercase, number, and symbol.',
    });
  }

  next();
};

module.exports = validatePassword;
