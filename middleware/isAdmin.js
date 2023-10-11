const InitialUser = require('../models/InitialUser')
// Define the isAdmin middleware
const isAdmin = async (req, res, next) => {
  try {
    console.log(req.user)
    InitialUser.findOne({ _id: req.user.uid }).then((data) => {
      console.log(data)
      if (data) {
        if (Array.isArray(data.roles) && (data.roles.includes('admin') || data.roles.includes('superadmin'))) {
          next();
        } else {
          return res.status(401).json({ message: 'UnAuthorized' });

        }
      } else {
        return res.status(401).json({ message: 'UnAuthorized' });
      }
    })
    // return res.status(401).json({ message: 'UnAuthorized' });

  } catch (error) {
    console.error(error);
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    logger.logToCloudWatch(formattedDate.toString(),`isAdmin.js Internal Server Error: ${error}`);

    return res.status(401).json({ message: 'Internal Server Error' });
  }
};

module.exports = isAdmin;
