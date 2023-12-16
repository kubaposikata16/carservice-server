const checkUserRole = (requiredRoles) => {
    return (req, res, next) => {
      const userRole = req.user.role
      if (requiredRoles.includes(userRole)) {
        next() //przechodzi do następnego middleware'u lub do obsługi zapytania, jeśli użytkownik ma odpowiednią rolę
      } else {
        res.status(403).send({ message: "Access forbidden!" }) //jeśli użytkownik nie ma wymaganej roli, zwraca status 403 - brak dostępu
      }
    }
}

module.exports = checkUserRole;