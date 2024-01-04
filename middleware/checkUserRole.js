const checkUserRole = (requiredRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role
    if (requiredRoles.includes(userRole)) {
      next()
    } else {
      res.status(403).send({ message: "Access forbidden!" })
    }
  }
};

module.exports = checkUserRole;