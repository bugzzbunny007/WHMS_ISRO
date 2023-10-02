const InitialUser = require('../models/InitialUser')
// Define the isSuperAdmin middleware
const isSuperAdmin = async (req, res, next) => {
    try {
        console.log(req.user)
        InitialUser.findOne({ _id: req.user.uid }).then((data) => {
            console.log(data)
            if (data) {
                if (Array.isArray(data.roles) && data.roles.includes('superadmin')) {
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
        return res.status(401).json({ message: 'Internal Server Error' });
    }
};

module.exports = isSuperAdmin;
