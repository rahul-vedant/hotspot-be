require('dotenv/config');
const { Customer } = require('../../models');
const { customerSchema } = require('../../middlewares/customer/validation');
const { Op } = require("sequelize");
const passwordHash = require('password-hash');
const sendMail = require('../../utilityServices/mail');
const jwt = require('jsonwebtoken');
const client = require('twilio')(process.env.accountSID, process.env.authToken);

const loginWithEmail = async(data) => {

    const email = (data.email).toLowerCase()
    const password = data.password;

    if (!email || !password) return { status: 400, message: `Please provide valid email and password` }

    const customer = await Customer.findOne({
        where: {
            email
        }
    });

    if (!customer) return { status: 401, message: `Invalid email Id or password` };
    
    if (passwordHash.verify(password, customer.getDataValue('password'))) {
        const user = {
            username: customer.getDataValue('name'),
            email: customer.getDataValue('email'),
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return { status: 200, message: `Customer (${email}) Logged in successfully`, accessToken: accessToken, refreshToken: refreshToken };
    }
    else
    {
        return { status: 401, message: `Invalid email Id or password` }
        }
};

const loginWithPhone = async (data) => {

    const phone_no = parseInt(data.phone);
    const password = data.password;

    if (!phone_no || !password) return { status: 400, message: `Please provide valid phone and password` };

    const customer = await Customer.findOne({
        where: {
            phone_no
        }
    });

    if (!customer) return { status: 401, message: `Invalid phone or password` };

    if (passwordHash.verify(password, customer.getDataValue('password'))) {
        const user = {
            username: customer.getDataValue('name'),
            email: customer.getDataValue('email'),
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return { status: 200, message: `Customer (${phone_no}) Logged in successfully`, accessToken: accessToken, refreshToken: refreshToken };
    }
    else {
        return { status: 401, message: `Invalid phone or password` }
    }
};


const signupCustomer = async (data) => {

    const result = customerSchema.validate(data);

    if (result.error) {
        return {
            status: 400, message: result.error.details[0].message
        };
    }

    if (result.value) {

        const { name, country_code, facebook_id,google_id, apple_id } = result.value;



        console.log("result error:", result.error, result.value);

        const password = passwordHash.generate(result.value.password);
        const phone_no = parseInt(result.value.phone);
        const email= (result.value.email).toLowerCase();


        const [customer,created] = await Customer.findOrCreate({
            where: {
                [Op.or]: {
                    email, phone_no,
                }
            },
            defaults: {
                name, email, country_code, phone_no, password,facebook_id, google_id, apple_id
            }
        });

        if (created) {
            const user = {
                username: name,
                email: email,
            };

            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);

            return { status: 200, message: `Customer (${email}) created successfully`, accessToken: accessToken, refreshToken: refreshToken };
        }
        else {
            const checkEmail = await Customer.findOne({
                where: {
                    email,
                }
            });
            const checkPhone = await Customer.findOne({
                where: {
                    phone_no,
                }
            });

            if (checkEmail !== null) {
                return { status: 409,  message:`Customer with the same email is already exist. \n Login with ${email}`};
            }

            if (checkPhone !== null) {                
                return {
                    status: 409, message: `Customer with the same phone is already exist. \n Login with ${phone_no}`};
            }
        }
    }
};


const loginWithGoogle = async(userInfo) => {

    const { google_id, name, email } = userInfo;

    const [customer,created] = await Customer.findOrCreate({
        where: {
                email,
        },
        defaults: {
            name, email, google_id
        }
    });

    if (created) {
        const user = {
            username: userInfo.name,
            email: userInfo.email,
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return { status: 200, message: `Customer (${email}) created successfully`, accessToken: accessToken, refreshToken: refreshToken };
    }
    else {
        const user = {
            username: customer.getDataValue('name'),
            email: customer.getDataValue('name'),
        }
        
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return { status: 200, message: `Customer with the same Google account is already exist.`, accessToken: accessToken, refreshToken: refreshToken };
    }

};

const loginWithFacebook = async (userInfo) => {
    const { facebook_id, name, email } = userInfo;

    const [customer,created] = await Customer.findOrCreate({
        where: {
                email,
        },
        defaults: {
            name, email, facebook_id
        }
    });

    if (created) {
        const user = {
            username: userInfo.name,
            email: userInfo.email,
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return { status: 200, message: `Customer (${email}) created successfully`, accessToken: accessToken, refreshToken: refreshToken };
    }
    else {
        const user = {
            username: customer.getDataValue('name'),
            email: customer.getDataValue('name'),
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        return { status: 200, message: `Customer with the same facebook account is already exist.`, accessToken: accessToken, refreshToken: refreshToken  };
    }
};

const generateAccessToken = (userInfo) => {
    return jwt.sign(userInfo, process.env.Access_Token_Secret, {expiresIn:'30s'});
}

const generateRefreshToken = (userInfo) => {
    return jwt.sign(userInfo, process.env.Refresh_Token_Secret);
}

const generatePhoneOTP = (userInfo) => {
    
    return client
                .verify
                .services(process.env.serviceID)
                .verifications
                .create({
                    to: `+${userInfo.country_code}${userInfo.phone}`,
                    channel: userInfo.channel
                })
    
    
};

const validatePhoneOTP = (userInfo) => {
    return client
                .verify
                .services(process.env.serviceID)
                .verificationChecks
                .create({
                    to: `+${userInfo.country_code}${userInfo.phone}`,
                    code: userInfo.code
                })
        
};
 

const generateEmailOTP = async(userInfo) => {
    let email_verification_otp = Math.floor(1000 + Math.random() * 9000);

    let customer = await Customer.findOne({
        where: {
            email:(userInfo.email).toLowerCase(),
        }
    });

    if (customer.getDataValue('email_verification_otp')!==null) {
        email_verification_otp = customer.getDataValue('email_verification_otp');
    }

    await Customer.update({
        email_verification_otp
    }, {
        where: {
            email: (userInfo.email).toLowerCase()
            },
            returning: true,
    });

    const mailOptions = {
        from: `Hotspot <${process.env.ev_email}>`,
        to: userInfo.email,
        subject: 'Email Verification',
        text: 'Here is your code',
        html: `OTP is: <b>${email_verification_otp}</b>`,
    };
    
    return sendMail(mailOptions);
};


const validateEmailOTP = async(req,res) => {
    const customer = await Customer.findOne({
        where: {
            email: (req.query.email).toLowerCase(),
        }
    });

    const email_verification_otp = customer.getDataValue('email_verification_otp');

    if (email_verification_otp != null && email_verification_otp === req.query.code) {
        await Customer.update({
            is_email_verified: true,
        }, {
            where: {
                email: (req.query.email).toLowerCase()
            },
            returning: true,
        });

        return res.status(200).json({ status: 200, message: `${req.query.email} is verified.` });
    }
    else {
        console.log("h1")
        return res.status(401).json({ status: 401, message: `Invalid Code` });
    }
};

const generatePassResetCode = async (userInfo) => {
    let reset_pass_otp = Math.floor(1000 + Math.random() * 9000);

    const email = (userInfo.email).toLowerCase();

    let customer = await Customer.findOne({
        where: {
            email
        }
    });

    // if (customer.getDataValue('email_verification_otp') !== null) {
    //     email_verification_otp = customer.getDataValue('email_verification_otp');
    // }

    await Customer.update({
        reset_pass_otp: `${reset_pass_otp}`,
        reset_pass_expiry: new Date(),
    }, {
        where: {
            email,
        },
        returning: true,
    });

    const mailOptions = {
        from: `Hotspot <${process.env.ev_email}>`,
        to: customer.getDataValue('email'),
        subject: 'Password Reset',
        text: 'Here is your code',
        html: `OTP for password reset is: <b>${reset_pass_otp}</b>`,
    };

    return sendMail(mailOptions);
};


const validatePassResetCode = async (req,res) => {
    const customer = await Customer.findOne({
        where: {
            email: (req.query.email).toLowerCase(),
        }
    });

    const reset_pass_otp = customer.getDataValue('reset_pass_otp');
    const reset_pass_expiry = customer.getDataValue('reset_pass_expiry');
    const now = new Date();
    
    const timeDiff = Math.floor((now.getTime() - reset_pass_expiry.getTime()) / 1000)
    if (timeDiff > 60) {
        return res.status(401).json({ status: 401, message: ` OTP Expired` });        
    }

    if (reset_pass_otp != null && reset_pass_otp === req.query.code) {
        return res.status(200).json({ status: 200, message: `OTP is verified.` });
    }
    else {
        return res.status(401).json({ status: 401, message: `Invalid OTP` });
    }
};

module.exports = { validatePassResetCode, generatePassResetCode, signupCustomer, loginWithPhone, loginWithEmail, loginWithGoogle,loginWithFacebook, generatePhoneOTP, validatePhoneOTP, generateEmailOTP,validateEmailOTP };
