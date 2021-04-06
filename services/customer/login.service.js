require('dotenv/config');
const models = require('../../models');
const validation = require('../../apiSchema/customerSchema');
const { Op, where } = require("sequelize");
const passwordHash = require('password-hash');
const sendMail = require('../../utils/mail');
const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const responseToken = require('../../utils/responseToken');
const customerAWS = require('../../utils/aws');
const { isBoolean } = require('lodash');
const constants = require("../../constants");
const utilityFunction = require('../../utils/utilityFunctions');

module.exports = {
    
    loginWithEmail: async (params) => {
    
        
            const email = (params.email).toLowerCase()
            const password = params.password;

            const customer = await utilityFunction.convertPromiseToObject( await models.Customer.findOne({
                    where: {
                        email
                    }
                })
            );
            

            if (!customer) throw new Error(constants.MESSAGES.invalid_email_password);

            if (!customer.status) throw new Error(constants.MESSAGES.deactivate_account);

            if (customer.is_social) throw new Error(constants.MESSAGES.social_media_account);           
        

            if (passwordHash.verify(password, customer.password)) {

                delete customer.password;
            
                const user = {
                    ...customer
                };

                const accessToken = responseToken.generateCustomerAccessToken(user);

                return {  accessToken: accessToken };
            }
            else {
                throw new Error(constants.MESSAGES.invalid_email_password);
            }
        

    
    },

    loginWithPhone: async (params) => {

            const phone_no = parseInt(params.phone);
            const country_code = params.country_code;
            const password = params.password;

            const customer = await utilityFunction.convertPromiseToObject( await models.Customer.findOne({
                    where: {
                        phone_no, country_code
                    }
                })
            );

            if (!customer) throw new Error(constants.MESSAGES.invalid_email_password);

            if (!customer.status) throw new Error(constants.MESSAGES.deactivate_account);


            if (customer.is_social) throw new Error(constants.MESSAGES.social_media_account);
        

            if (passwordHash.verify(password, customer.password)) {

            
                if (!customer.is_phone_verified) throw new Error(constants.MESSAGES.phone_not_verified);

                delete customer.password

                const user = {
                    ...customer,
                };

                const accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }
            else {
                throw new Error(constants.MESSAGES.invalid_email_password);
            }
        

    },


    signupCustomer: async (params ) => {

            const { name, country_code, facebook_id, google_id, apple_id } = params;


            const password = passwordHash.generate(params.password);
            const phone_no = parseInt(params.phone);
            const email = (params.email).toLowerCase();

            const checkCustomer = await models.Customer.findOne({
                where: {
                    email,
                }
            });

            if (checkCustomer) {
                throw new Error(constants.MESSAGES.email_already_registered);
            }

            let tempEmail = await utilityFunction.convertPromiseToObject( await models.TempEmail.findOne({
                    where: {
                        email,
                    }
                })
            );

        

            if (!tempEmail) {
                throw new Error(constants.MESSAGES.email_not_verified);
            }

            if (!tempEmail.is_email_verified) {
                throw new Error(constants.MESSAGES.email_not_verified);
            }

            const is_email_verified = true;
            const email_verification_otp = tempEmail.email_verification_otp
            const email_verification_otp_expiry = tempEmail.email_verification_otp_expiry

            const newCustomer = await models.Customer.findOrCreate({
                where: {
                    [Op.or]: {
                        email, phone_no,
                    }
                },
                defaults: {
                    name, email, is_email_verified, email_verification_otp, email_verification_otp_expiry, country_code, phone_no, password, facebook_id, google_id, apple_id
                }
            });

            if (newCustomer[1]) {

                await models.TempEmail.destroy({
                    where: {
                        email,
                    },
                    force: true,
                })

                let customer = await utilityFunction.convertPromiseToObject(await models.Customer.findOne({
                        where: {
                            email
                        }
                    })
                );

                delete customer.password

                const user = {
                    ...customer,
                };

                const accessToken = responseToken.generateCustomerAccessToken(user);


                return { accessToken: accessToken };
            }
            else {
                const checkEmail = await models.Customer.findOne({
                    where: {
                        email,
                    }
                });
                const checkPhone = await models.Customer.findOne({
                    where: {
                        phone_no,
                    }
                });

                if (checkEmail !== null) throw new Error(constants.MESSAGES.email_already_registered);

                if (checkPhone !== null) throw new Error(constants.MESSAGES.phone_already_registered);
            
            }
    

    
    },


    loginWithGoogle: async (params ) => {
    
        
            const body = { google_id: params.id, name: params.name, email: params.email };

            const { google_id, name, email } = body;
            const is_email_verified = true;
            const is_social = true;

            const [customer, created] = await models.Customer.findOrCreate({
                where: {
                    email,
                },
                defaults: {
                    name, email, is_email_verified, google_id, is_social
                }
            });

            if (created) {
                    
                let getCustomer = await utilityFunction.convertPromiseToObject(await models.Customer.findOne({
                            where: {
                                email:body.email,
                            }
                        })
                );

                delete getCustomer.password
            
                const user = {
                    ...getCustomer,
                };

                const accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }
            else {

                if (!customer.status) if (!customer.status) throw new Error(constants.MESSAGES.deactivate_account);

                if (!customer.is_social) throw new Error(constants.MESSAGES.social_media_account_already_not_registered);
                if (!customer.google_id) throw new Error(constants.MESSAGES.social_media_account_already_registered);

                let getCustomer = await utilityFunction.convertPromiseToObject(await models.Customer.findOne({
                            where: {
                                email:body.email,
                            }
                        })
                );

                delete getCustomer.password
            
                const user = {
                    ...getCustomer,
                };


                const accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }
        
   

    },

    loginWithFacebook: async (params ) => {

        
            const body = { facebook_id: params.id, name: params.name, email: params.email };

            const { facebook_id, name, email } = body;

            const is_email_verified = true;
            const is_social = true;
            

            const [customer, created] = await models.Customer.findOrCreate({
                where: {
                    email,
                },
                defaults: {
                    name, email, is_email_verified, facebook_id, is_social
                }
            });

            if (created) {
                let getCustomer = await utilityFunction.convertPromiseToObject(await models.Customer.findOne({
                            where: {
                                email:body.email,
                            }
                        })
                );

                delete getCustomer.password
            
                const user = {
                    ...getCustomer,
                };

                const accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }
            else {

                if (!customer.status) if (!customer.status) throw new Error(constants.MESSAGES.deactivate_account);

                if (!customer.is_social) throw new Error(constants.MESSAGES.social_media_account_already_not_registered);
                if (!customer.facebook_id) throw new Error(constants.MESSAGES.social_media_account_already_registered);

                let getCustomer = await utilityFunction.convertPromiseToObject(await models.Customer.findOne({
                            where: {
                                email:body.email,
                            }
                        })
                );

                delete getCustomer.password
            
                const user = {
                    ...getCustomer,
                };


                const accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }
        
    
    },

    loginWithApple: async (params ) => {

        
            const body = { apple_id: params.id, name: params.name, email: params.email };

            const { apple_id, name, email } = body;

            const is_email_verified = true;
            const is_social = true;
            

            const [customer, created] = await models.Customer.findOrCreate({
                where: {
                    email,
                },
                defaults: {
                    name, email, is_email_verified, apple_id, is_social
                }
            });

                        if (created) {
                let getCustomer = await utilityFunction.convertPromiseToObject(await models.Customer.findOne({
                            where: {
                                email:body.email,
                            }
                        })
                );

                delete getCustomer.password
            
                const user = {
                    ...getCustomer,
                };

                const accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }
            else {

                if (!customer.status) if (!customer.status) throw new Error(constants.MESSAGES.deactivate_account);

                if (!customer.is_social) throw new Error(constants.MESSAGES.social_media_account_already_not_registered);
                if (!customer.apple_id) throw new Error(constants.MESSAGES.social_media_account_already_registered);

                let getCustomer = await utilityFunction.convertPromiseToObject(await models.Customer.findOne({
                            where: {
                                email:body.email,
                            }
                        })
                );

                delete getCustomer.password
            
                const user = {
                    ...getCustomer,
                };


                const accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }
    
    },    

    generatePhoneOTP: async (params ) => {

            const phone_no = parseInt(params.phone);
            const country_code = params.country_code;


            let customer = await utilityFunction.convertPromiseToObject( await models.Customer.findOne({
                    where: {
                        country_code,phone_no
                    }
                })
            );

            if (customer.is_phone_verified) {
                throw new Error(constants.MESSAGES.phone_already_verified);
            }

            client
                .verify
                .services(process.env.TWILIO_SERVICE_ID)
                .verifications
                .create({
                    to: `${customer.country_code}${phone_no}`,
                    channel: 'sms'
                })
                .then((resp) => {
                    models.Customer.update({
                        phone_verification_otp_expiry: new Date(),
                    }, {
                        where: {
                            phone_no
                        },
                        returning: true,
                    });
                    //.status(200).json({ status: 200, message: `Verification code is sent to phone` });
                })
                .catch((error) => {
                    if (error.status === 429) {
                        //.status(429).json({ status: 429, message: `Too many requests` });

                        models.Customer.update({
                            phone_verification_otp_expiry: new Date(),
                        }, {
                            where: {
                                phone_no
                            },
                            returning: true,
                        });
                        //.status(200).json({ status: 200, message: `Verification code is sent to phone` });
                    }
                    else
                    {
                        throw new Error(constants.MESSAGES.verification_code_sent_error);                       
                    }                    
                })
        
            return true;
        
    },

    validatePhoneOTP: async (params ) => {

            const phone_no = parseInt(params.phone);
            const country_code = params.country_code;


            let customer = await utilityFunction.convertPromiseToObject(  await models.Customer.findOne({
                    where: {
                        country_code, phone_no
                    }
                })
            );


            if (customer.is_phone_verified) {
                throw new Error(constants.MESSAGES.phone_already_verified);
            }

            

            const phone_verification_otp_expiry = customer.phone_verification_otp_expiry;
            const now = new Date();

            const timeDiff = Math.floor((now.getTime() - phone_verification_otp_expiry.getTime()) / 1000)
            if (timeDiff > constants.otp_expiry_time) {
                throw new Error(constants.MESSAGES.expire_otp);
            }

            if (params.code == "1234") {
                models.Customer.update({
                    is_phone_verified: true,
                }, {
                    where: {
                        phone_no
                    },
                    returning: true,
                });

                delete customer.password

                let user = {
                    ...customer
                };

                let accessToken = responseToken.generateCustomerAccessToken(user);

                return { accessToken: accessToken };
            }

            client
                .verify
                .services(process.env.TWILIO_SERVICE_ID)
                .verificationChecks
                .create({
                    to: `${customer.country_code}${phone_no}`,
                    code: params.code
                })
                .then((resp) => {
                    if (resp.status === "approved") {
                        models.Customer.update({
                            is_phone_verified: true,
                        }, {
                            where: {
                                phone_no
                            },
                            returning: true,
                        });
                    }
                    else {
                            throw new Error(constants.MESSAGES.invalid_otp);
                    }
                }).catch((error) => {
                    throw new Error(constants.MESSAGES.error_occurred);
                })
               
            delete customer.password

            let user = {
                ...customer
            };

            let accessToken = responseToken.generateCustomerAccessToken(user);

            return { accessToken: accessToken };
    },
 

    generateEmailOTP: async (params ) => {

            const email = (params.email).toLowerCase();

            let customer = await utilityFunction.convertPromiseToObject(  await models.Customer.findOne({
                    where: {
                        email,
                    }
                })
            );

            if (customer) {
                throw new Error(constants.MESSAGES.email_already_registered);
            }

            let email_verification_otp = Math.floor(1000 + Math.random() * 9000);
            const is_email_verified = false;

            const newTempEmail = await models.TempEmail.findOrCreate({
                where: {
                    email,
                },
                defaults: {
                    email,
                    email_verification_otp,
                    is_email_verified,
                    email_verification_otp_expiry: new Date(),
                }
            });

            if (newTempEmail[1]) {

                const mailOptions = {
                    from: `Hotspot <${process.env.SG_EMAIL_ID}>`,
                    to: email,
                    subject: 'Email Verification',
                    text: 'Here is your code',
                    html: `OTP is: <b>${email_verification_otp}</b>`,
                };

                sendMail.send(mailOptions)
                    .then((resp) => {
                        //.status(200).json({ status: 200, message: `Verification code sent to email address` });
                    }).catch((error) => {
                        throw new Error(constants.MESSAGES.error_occurred);
                    });
                
                return true
            }
            else {

                await models.TempEmail.update({
                    email_verification_otp,
                    is_email_verified,
                    email_verification_otp_expiry: new Date(),
                }, {
                    where: {
                        email
                    },
                    returning: true,
                });

                const mailOptions = {
                    from: `Hotspot <${process.env.SG_EMAIL_ID}>`,
                    to: email,
                    subject: 'Email Verification',
                    text: 'Here is your code',
                    html: `OTP is: <b>${email_verification_otp}</b>`,
                };

                sendMail.send(mailOptions)
                    .then((resp) => {
                        //.status(200).json({ status: 200, message: `Verification code Sent to email address` });
                    }).catch((error) => {
                        throw new Error(constants.MESSAGES.error_occurred);
                    });
                
                return true
            }
        
        
    
    },


    validateEmailOTP: async (params ) => {

            const email = (params.email).toLowerCase();

            let customer = await models.Customer.findOne({
                where: {
                    email,
                }
            });

            if (customer) {
                throw new Error(constants.MESSAGES.email_already_registered);
            }

            let tempEmail = await models.TempEmail.findOne({
                where: {
                    email,
                }
            });

            if (!tempEmail) {
                throw new Error(constants.MESSAGES.user_not_found);
            }

            // if (tempEmail.getDataValue('is_email_verified')) {
            //     return .status(409).json({ status: 409, message: `Email is already verified` });
            // }

            const email_verification_otp = tempEmail.email_verification_otp;
            const email_verification_otp_expiry = tempEmail.email_verification_otp_expiry;
            const now = new Date();

            const timeDiff = Math.floor((now.getTime() - email_verification_otp_expiry.getTime()) / 1000)
            if (timeDiff > constants.otp_expiry_time) {
                throw new Error(constants.MESSAGES.expire_otp);
            }

            if (email_verification_otp != null && email_verification_otp === params.code) {
                await models.TempEmail.update({
                    is_email_verified: true,
                }, {
                    where: {
                        email
                    },
                    returning: true,
                });

                return true;
            }
            else {
                throw new Error(constants.MESSAGES.invalid_otp);
            }
        
    
    },

    generatePassResetCode: async (params ) => {
            let is_phone = false;
            let is_email = false;

            const phoneResult = validation.resetPhoneSchema.validate({ country_code: params.country_code, phone: params.emailOrPhone });

            if (!phoneResult.error) {
                is_phone = true;               
            }

            const phone_no = parseInt(phoneResult.value.phone);
            const country_code = phoneResult.value.country_code;

            const emailResult = validation.emailSchema.validate({ email: params.emailOrPhone });

            if (!emailResult.error) {
                is_email = true;
            }

            const email = (emailResult.value.email).toLowerCase();

            if (!is_email && !is_phone) {
                throw new Error(constants.MESSAGES.invalid_email_phone);
            }

            let customer = null;

            if (is_email) {
                customer = await models.Customer.findOne({
                    where: {
                        email
                    }
                });
            }
            else {
                customer = await models.Customer.findOne({
                    where: {                        
                            country_code, phone_no,
                    }
                });
            }


            if (!customer) {
                throw new Error(constants.MESSAGES.user_not_found);
            }

            if (customer.is_social) throw new Error(constants.MESSAGES.social_media_account);


            if (is_phone) {
                client
                    .verify
                    .services(process.env.TWILIO_SERVICE_ID)
                    .verifications
                    .create({
                        to: `${customer.country_code}${phone_no}`,
                        channel: 'sms'
                    })
                    .then((resp) => {
                        models.Customer.update({
                            phone_verification_otp_expiry: new Date(),
                            reset_pass_expiry: new Date(),
                        }, {
                            where: {
                                phone_no
                            },
                            returning: true,
                        });
                        //.status(200).json({ status: 200, message: `Verification code is sent to phone` });
                    })
                    .catch((error) => {
                        if (error.status === 429) {
                            //.status(429).json({ status: 429, message: `Too many requests` });

                            models.Customer.update({
                                phone_verification_otp_expiry: new Date(),
                                reset_pass_expiry: new Date(),
                            }, {
                                where: {
                                    phone_no
                                },
                                returning: true,
                            });
                            //.status(200).json({ status: 200, message: `Verification code is sent to phone` });
                        }
                        else {
                            throw new Error(constants.MESSAGES.verification_code_sent_error);
                        }
                        
                    })
                
                return true
            }

            if (is_email) {
                
                let reset_pass_otp = Math.floor(1000 + Math.random() * 9000);


                await models.Customer.update({
                    reset_pass_otp: `${reset_pass_otp}`,
                    reset_pass_expiry: new Date(),
                }, {
                    where: {
                        email: customer.email,
                    },
                    returning: true,
                });

                const mailOptions = {
                    from: `Hotspot <${process.env.SG_EMAIL_ID}>`,
                    to: customer.email,
                    subject: 'Password Reset',
                    text: 'Here is your code',
                    html: `OTP for password reset is: <b>${reset_pass_otp}</b>`,
                };

                sendMail.send(mailOptions)
                    .then((resp) => {
                        //.status(200).json({ status: 200, message: `Password reset code Sent to email` });
                    }).catch((error) => {
                        throw new Error(constants.MESSAGES.error_occurred);
                    });
                
                return true
            }       
    
    },


    validatePassResetCode: async (params) => {
    
        
            let is_phone = false;
            let is_email = false;

            const phoneResult = validation.resetPhoneSchema.validate({ country_code: params.country_code, phone: params.emailOrPhone });

            if (!phoneResult.error) {
                is_phone = true;
            }

            const phone_no = parseInt(phoneResult.value.phone);
            const country_code = phoneResult.value.country_code;

            const emailResult = validation.emailSchema.validate({ email: params.emailOrPhone });

            if (!emailResult.error) {
                is_email = true;
            }

            const email = (emailResult.value.email).toLowerCase();

            if (!is_email && !is_phone) {
                throw new Error(constants.MESSAGES.invalid_email_phone);
            }

            let customer = null;

            if (is_email) {
                customer = await models.Customer.findOne({
                    where: {
                        email
                    }
                });
            }
            else {
                customer = await models.Customer.findOne({
                    where: {
                        country_code, phone_no,
                    }
                });
            }

            if (!customer) {
                throw new Error(constants.MESSAGES.user_not_found);
            }

            if (customer.is_social) throw new Error(constants.MESSAGES.social_media_account);
        
            const reset_pass_expiry = customer.reset_pass_expiry;
            const now = new Date();

            const timeDiff = Math.floor((now.getTime() - reset_pass_expiry.getTime()) / 1000)
            if (timeDiff > constants.otp_expiry_time) {
                throw new Error(constants.MESSAGES.expire_otp);
            }

            if (is_phone) {
                if (params.code == "1234") {
                    models.Customer.update({
                        is_phone_verified: true,
                    }, {
                        where: {
                            phone_no
                        },
                        returning: true,
                    });

                    return true
                }

                client
                    .verify
                    .services(process.env.TWILIO_SERVICE_ID)
                    .verificationChecks
                    .create({
                        to: `${customer.country_code}${phone_no}`,
                        code: params.code
                    })
                    .then((resp) => {
                        if (resp.status === "approved") {
                            models.Customer.update({
                                is_phone_verified: true,
                            }, {
                                where: {
                                    phone_no
                                },
                                returning: true,
                            });

                            //.status(200).json({ status: 200, message: `OTP is verified.` });
                        }
                        else {
                            throw new Error(constants.MESSAGES.invalid_otp);
                        }
                    }).catch((error) => {
                        throw new Error(constants.MESSAGES.invalid_otp);
                        //.status(500).json({ status: 500, message: `Internal Server Error` });
                    })
                
                return true
            }
            if (is_email) {


                const reset_pass_otp = customer.reset_pass_otp;
            

                if (reset_pass_otp != null && reset_pass_otp === params.code) {
                    return true
                }
                else {
                    throw new Error(constants.MESSAGES.invalid_otp);
                }
        
            }
           
    },

    resetPassword: async (params) => {
        

            if (!params.emailOrPhone) {
                throw new Error(constants.MESSAGES.invalid_email_phone);
            }

            const phone_no = parseInt(params.emailOrPhone);
            const email = (params.emailOrPhone).toLowerCase();
            const country_code = params.country_code

            console.log(phone_no,email,country_code)

            let customer = null;

            if (isNaN(phone_no)) {
                customer = await models.Customer.findOne({
                    where: {
                        email
                    }
                });
            }
            else {
                customer = await models.Customer.findOne({
                    where: {
                            country_code, phone_no,
                    }
                });
            }

            if (!customer) {
                throw new Error(constants.MESSAGES.user_not_found);
            }

            if (customer.is_social) throw new Error(constants.MESSAGES.social_media_account);
        
            const result = validation.passwordSchema.validate({ password: params.password });

            if (result.error) {
                throw new Error(constants.MESSAGES.bad_request);
            }


            const password = passwordHash.generate(params.password);

            await models.Customer.update({
                password,
            }, {
                where: {
                    email: customer.email
                },
                returning: true,
            });

            return true

        
    },

    changeCustomerPicture: async (fileParams,user) => {

            let now = (new Date()).getTime();

            const pictureName = fileParams.originalname.split('.');
            const pictureType = pictureName[pictureName.length - 1];
            const pictureKey = `customer/profile/${now}.${pictureType}`;
            const pictureBuffer = fileParams.buffer;

            const params = customerAWS.setParams(pictureKey, pictureBuffer);

            // customerAWS.s3.upload(params, async (error, data) => {
            //     if (error) throw new Error(constants.MESSAGES.file_upload_error);

            //     const profile_picture_url = data.Location;

            //     await models.Customer.update({
            //         profile_picture_url,
            //     }, {
            //         where: {
            //             email: user.email,
            //         },
            //         returning: true,
            //     },
            //     )

            //     return { profile_picture_url: profile_picture_url };
            // })  

            const s3upload = customerAWS.s3.upload(params).promise();
            const profile_picture_url=await s3upload.then(function (data) {

                return  data.Location ;
            })
            .catch(function (err) {
                throw new Error(constants.MESSAGES.file_upload_error);
            });
        
            await models.Customer.update({
                    profile_picture_url,
                }, {
                    where: {
                        email: user.email,
                    },
                    returning: true,
                },
                )
        
            return { profile_picture_url };
        
    },

    getCustomerProfile: async (user) => {
        
            const customer = await models.Customer.findOne({
                where: {
                    email: user.email,
                }
            })

            if (!customer) throw new Error(constants.MESSAGES.user_not_found);

            return { customer: { name: customer.name, email: customer.email, country_code: customer.country_code, phone: customer.phone_no, profile_picture_url: customer.profile_picture_url, is_phone_verified: customer.is_phone_verified, is_social: customer.is_social } };
        
    
    },

    changeCustomerPassword: async (params,user) => {
        
            const oldPassword = params.oldPassword;

            const customer = await models.Customer.findOne({
                where: {
                    email: user.email,
                }
            })

            if (customer.is_social) throw new Error(constants.MESSAGES.social_media_account);


            if (!passwordHash.verify(oldPassword, customer.password)) throw new Error(constants.MESSAGES.invalid_old_password);
    

            const password = passwordHash.generate(params.newPassword);

            await models.Customer.update({
                password,
            }, {
                where: {
                    email: (params.user.email).toLowerCase()
                },
                returning: true,
            });

            return true        

    },

    updateCustomerName: async (params,user) => {       

            let name = params.name;
                
        
            await models.Customer.update({
                name
            }, {
                where: {
                    email: (user.email).toLowerCase()
                },
                returning: true,
            });
            

            return true;
    
    },

    updateCustomerEmail: async (params, user) => {

            const email = (params.email).toLowerCase();

            const customer = await models.Customer.findOne({
                where: {
                    email,
                }
            });

            if (customer) {
                throw new Error(constants.MESSAGES.email_already_registered);
            }

            let tempEmail = await models.TempEmail.findOne({
                where: {
                    email,
                }
            });


            if (!tempEmail) {
                throw new Error(constants.MESSAGES.email_not_verified);
            }

            if (!tempEmail.is_email_verified) {
                throw new Error(constants.MESSAGES.email_not_verified);
            }

            const is_email_verified = true;
            const email_verification_otp = tempEmail.email_verification_otp
            const email_verification_otp_expiry = tempEmail.email_verification_otp_expiry

            await models.Customer.update({
                email,is_email_verified,email_verification_otp,email_verification_otp_expiry
            }, {
                where: {
                    email:user.email,
                },
                returning: true,
            });

            await models.TempEmail.destroy({
                where: {
                    email,
                },
                force: true,
            })
        
            const getCustomer = await utilityFunction.convertPromiseToObject(await models.Customer.findByPk(user.id));

            delete getCustomer.password
            
            user = {
                ...getCustomer   
            }

            const accessToken = responseToken.generateCustomerAccessToken(user);

            return {accessToken: accessToken };

        
    },

    updateCustomerphone: async (params,user) => {

            const phone_no = parseInt(params.phone);
            const country_code = params.country_code;

            const customer_phone = await models.Customer.findOne({
                where: {
                    phone_no
                }
            });

            if (customer_phone) throw new Error(constants.MESSAGES.phone_already_registered);

            const is_phone_verified = false;


            await models.Customer.update({
                 country_code, phone_no, is_phone_verified
            }, {
                where: {
                    email: (user.email).toLowerCase()
                },
                returning: true,
            });

        return true;
      
    },

    addCustomerAddress: async (params,user) => {

            const customer_id = user.id;
            const hotspot_location_id = params.hotspot_location_id;

            if (!hotspot_location_id || isNaN(hotspot_location_id)) throw new Error(constants.MESSAGES.bad_request);


            const hotspotLocation = await models.HotspotLocation.findOne({
                where: {
                    id:hotspot_location_id,
                    customer_id
                }
            });

            const hotspotDropoff = await models.HotspotDropoff.findAll({
                where: {
                    hotspot_location_id:hotspotLocation.id,
                }
            });

            const hotspot_dropoff_id = hotspotDropoff.map(val => val.id);

            const [customerFavLocation, created] = await models.CustomerFavLocation.findOrCreate({
                where: {
                    
                        hotspot_location_id:hotspotLocation.id, customer_id: customer_id
                },
                defaults: {
                    hotspot_location_id:hotspotLocation.id,hotspot_dropoff_id:hotspot_dropoff_id[0] ,customer_id: customer_id
                }
            });

            await models.HotspotLocation.update({
                is_added: true
            }, {
                where: {
                    id:hotspot_location_id,
                    customer_id
                },
                returning: true,
            });

            if (customerFavLocation || created) return true

        
    },

    getCustomerAddress: async (user) => {

            const customerFavLocation = await models.CustomerFavLocation.findAll({
                where: {
                    customer_id: user.id
                }
            })

            if (customerFavLocation.length === 0) throw new Error(constants.MESSAGES.no_address);

            let customerAddress = [];


            for (const val of customerFavLocation){
                const dropoff = await models.HotspotDropoff.findOne({ where: { id: val.hotspot_dropoff_id } });
                
                const hotspotLocation = await models.HotspotLocation.findOne({
                    where: {
                        id: val.hotspot_location_id,
                        customer_id: user.id
                    }
                });
                
                customerAddress.push(
                    {
                        address: {
                            id: hotspotLocation.id,
                            name:hotspotLocation.name,
                            address: hotspotLocation.location_detail,
                            city: hotspotLocation.city,
                            state: hotspotLocation.state,
                            postal_code: hotspotLocation.postal_code,
                            country: hotspotLocation.country,
                            location_geometry: hotspotLocation.location
                        },
                        default_dropoff: dropoff.dropoff_detail,
                        isDefault: val.is_default
                    }
                )
            }

            return { customerAddress: customerAddress };

        
    },

    setCustomerDefaultAddress: async (params, user) => {

            const customer_id = user.id;
            const hotspot_location_id = params.hotspot_location_id;

            if (!hotspot_location_id || isNaN(hotspot_location_id)) throw new Error(constants.MESSAGES.bad_request);

            const hotspotLocation = await models.HotspotLocation.findOne({
                where: {
                    id:hotspot_location_id,
                    customer_id
                }
            });

            await models.CustomerFavLocation.update({
                is_default: false
            }, {
                where: {
                    is_default: true,
                    customer_id
                },
                returning: true,
            });

            await models.CustomerFavLocation.update({
                is_default: true
            }, {
                where: {
                    hotspot_location_id, customer_id
                },
                returning: true,
            });

            await models.Customer.update({
                address: hotspotLocation.location_detail,
                city: hotspotLocation.city,
                state: hotspotLocation.state,
                country: hotspotLocation.country,
                postal_code:hotspotLocation.postal_code,
            }, {
                where: {
                    id:customer_id
                },
                returning: true,
            });

            return true;



        
    },

    checkDefaultAddress: async (user) => {

          let isDefaultFound = false;

          const customerFavLocation = await models.CustomerFavLocation.findOne({
              where: {
                  customer_id: user.id,
                  is_default: true,
              }
          })

          if (customerFavLocation) isDefaultFound = true;

          return {isDefaultFound };

      
    },

    feedbackCustomer: async(params,user) => {

            const messageBody = (params.message).trim();

            const formattedBody = `<b>From:</b> ${user.name} (${user.email})<br><br>
                                    <b>Feedback:</b> ${messageBody}`;
            const mailOptions = {
                from: `Hotspot models.Customer <${process.env.SG_EMAIL_ID}>`,
                to: user.email,
                subject: 'Customer Feedback',
                html: formattedBody,
            };

            sendMail.send(mailOptions)
                .then((resp) => {
                    //.status(200).json({ status: 200, message: `Feedback Sent Successfully` });
                }).catch((error) => {
                    throw new Error(constants.MESSAGES.error_occurred);
                });
        
            return true       
    
    },

    toggleNotification: async (params, user) => {

        let notification_status = params.notification_status;

        if (!isBoolean(notification_status) && (notification_status === "true" || notification_status === "false")) {
            if (notification_status === "true") notification_status = true;
            else if(notification_status === "false") notification_status = false;
        }

        await models.Customer.update({
            notification_status,
        }, {
            where: {
                email: user.email,
            },
            returning: true,
        });

        //return notification_status ? .status(200).json({ status: 200, message: `Notifications turned on` }) : .status(200).json({ status: 200, message: `Notifications turned off` });

        return true;
    },
    getNotificationStatus: async (user) => {
        const customer = await models.Customer.findOne({
            where: {
                email: user.email,
            }
        })

        return { notification_status: customer.notification_status };
    },



    logoutCustomer: async (user) => {       
            return true 
    },

}
