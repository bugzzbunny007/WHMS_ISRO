const express = require("express");
const router = express.Router();
const fetchUser = require("../middleware/fetchuser");
const isSuperAdmin = require("../middleware/isSuperAdmin");
const {
    createAdmin,
    testingFunction,
    removeAdmin,
    fetchAllUsers,
    approveAdminDocById,
    getDocById,
    addDeviceIdToAdmin,
    removeDeviceIdFromAdmin,
    getAllAdmin,
    disableAdmin,
    enableAdmin
} = require("../controllers/superAdmin");


// Define a POST route to create an admin user
router.post('/upsertadmin', fetchUser, isSuperAdmin, createAdmin);

router.post('/removeadmin', fetchUser, isSuperAdmin, removeAdmin);

router.get('/getallusers', fetchUser, isSuperAdmin, fetchAllUsers);

router.post('/getDocById', fetchUser, isSuperAdmin, getDocById);

router.post('/approveAdminDocById', fetchUser, isSuperAdmin, approveAdminDocById);

router.post('/addDeviceIdToAdmin', fetchUser, isSuperAdmin, addDeviceIdToAdmin);

router.post('/removeDeviceIdFromAdmin', fetchUser, isSuperAdmin, removeDeviceIdFromAdmin);

router.get('/getAllAdmin', fetchUser, isSuperAdmin, getAllAdmin);

router.post('/disableAdmin', fetchUser, isSuperAdmin, disableAdmin);

router.post('/enableAdmin', fetchUser, isSuperAdmin, enableAdmin);

router.post('/testing', fetchUser, testingFunction);

module.exports = router;