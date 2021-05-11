const express = require('express');

const joiValidation = require("../middlewares/joi");
const apiSchema = require("../apiSchema/driverSchema");

const driverAuthentication = require('../middlewares/jwt');
const router=express.Router();
const multer = require('../middlewares/multer');

const { OnBoardingController }   = require('../controllers/driver/onBoardingController');
const { EarningController }   = require('../controllers/driver/earningController');

const onBoardingController = new OnBoardingController(); 
const earningController = new EarningController(); 

const accountController = require('../controllers/driver/account');
const staticContentController = require('../controllers/driver/staticContent');
const homeController = require('../controllers/driver/home');

// on boarding API's
router.post('/login',joiValidation.validateBody(apiSchema.login), onBoardingController.login);
router.post('/forgot_password',joiValidation.validateBody(apiSchema.forgot_password), onBoardingController.forgot_password);
router.post('/verify_otp',joiValidation.validateBody(apiSchema.verify_otp), onBoardingController.verify_otp);
router.post('/changePassword', driverAuthentication.validateDriverToken,  joiValidation.validateBody(apiSchema.changePassword), onBoardingController.changeDriverPassword);
router.post('/sign_up_step1',  joiValidation.validateBody(apiSchema.sign_up_step1), onBoardingController.sign_up_step1);
router.post('/sign_up_details_step1', driverAuthentication.validateDriverToken, joiValidation.validateBody(apiSchema.sign_up_details_step1), onBoardingController.sign_up_details_step1);
router.post('/sign_up_details_step2', driverAuthentication.validateDriverToken, joiValidation.validateBody(apiSchema.sign_up_details_step2), onBoardingController.sign_up_details_step2);
router.post('/sign_up_details_step3', driverAuthentication.validateDriverToken, joiValidation.validateBody(apiSchema.sign_up_details_step3), onBoardingController.sign_up_details_step3);
router.get('/logout', driverAuthentication.validateDriverToken, onBoardingController.logout);



// accounts API's
router.put('/editDriverPersonalDetails', driverAuthentication.validateDriverToken, joiValidation.validateBody(apiSchema.driverPersonalDetails), accountController.editDriverPersonalDetails);
router.get('/getDriverPersonalDetails', driverAuthentication.validateDriverToken, accountController.getDriverPersonalDetails);
router.put('/editDriverAddressDetails', driverAuthentication.validateDriverToken, joiValidation.validateBody(apiSchema.driverAddressDetails), accountController.editDriverAddressDetails);
router.get('/getDriverAddressDetails', driverAuthentication.validateDriverToken, accountController.getDriverAddressDetails);
router.put('/editDriverVehicleDetails', driverAuthentication.validateDriverToken, joiValidation.validateBody(apiSchema.driverVehicleDetails), accountController.editDriverVehicleDetails);
router.get('/getDriverVehicleDetails', driverAuthentication.validateDriverToken, accountController.getDriverVehicleDetails);
router.put('/editDriverBankDetails', driverAuthentication.validateDriverToken, joiValidation.validateBody(apiSchema.driverBankDetails), accountController.editDriverBankDetails);
router.get('/getDriverBankDetails', driverAuthentication.validateDriverToken, accountController.getDriverBankDetails);

// statticContent API's

router.get('/getSupportFaq/:topic_id', driverAuthentication.validateDriverToken, staticContentController.helpFaq);
router.get('/getStaticContent/:id', driverAuthentication.validateDriverToken, staticContentController.getStaticContent);

// home API's
router.get('/getPickups', driverAuthentication.validateDriverToken, homeController.getPickups);
router.get('/getDeliveries', driverAuthentication.validateDriverToken, homeController.getDeliveries);
router.get('/getDeliveryDetail/:delivery_id', driverAuthentication.validateDriverToken, homeController.getDeliveryDetails);
router.get('/getPickupDetails/:pickup_id', driverAuthentication.validateDriverToken, homeController.getPickupDetails);
router.post('/sendNotification/:delivery_id',driverAuthentication.validateDriverToken, homeController.sendDeliveryNotification);
router.get('/getTotalCount', driverAuthentication.validateDriverToken, homeController.getTotalCount);
router.post('/deliveryImage', driverAuthentication.validateDriverToken,joiValidation.validateBody(apiSchema.deliveryImage), homeController.getTotalCount);
router.put('/confirmPickups/:pickup_id', driverAuthentication.validateDriverToken, homeController.confirmPickups);
router.put('/confirmOrderPickup/:order_pickup_id',driverAuthentication.validateDriverToken,joiValidation.validateParams(apiSchema.confirmOrderPickup), homeController.confirmOrderPickup);


// earning API's
router.get('/getEarningList', driverAuthentication.validateDriverToken, joiValidation.validateQueryParams(apiSchema.getEarningList), earningController.getEarningList);
router.get('/getEarningDetails', driverAuthentication.validateDriverToken, joiValidation.validateQueryParams(apiSchema.getEarningDetails), earningController.getEarningDetails);
module.exports = router;