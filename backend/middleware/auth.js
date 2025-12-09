module.exports = {
  auth: (req, res, next) => {
    // Temporary auth - always pass
    req.user = {
      _id: 'temp-user-id',
      profile: { level: 'beginner' },
      statistics: {}
    };
    next();
  }
};
