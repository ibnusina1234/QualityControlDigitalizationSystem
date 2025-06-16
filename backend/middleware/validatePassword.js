const validatePassword = (req, res, next) => {
      const { password } = req.body;

      const capitalLetterRegex = /^[A-Z]/;
      const numberRegex = /[0-9]/;

      if (!capitalLetterRegex.test(password) || !numberRegex.test(password)) {
            return res.status(400).json({
                  error: 'Password must start with a capital letter and contain at least one number.',
            });
      }

      next();
};

module.exports = validatePassword;