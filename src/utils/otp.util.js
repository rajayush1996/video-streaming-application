/* eslint-disable camelcase */
const config = require('../../config/config');
const logger = require('../features/logger');
const otpGenerator = require('otp-generator');
const Twilio = require('twilio');

const {account_sid, auth_token, mob_number: sender} = config.twilio;
const authToken = auth_token.trim();
const accountSid = account_sid.trim();

const client = new Twilio(accountSid, authToken);

const generateOTP = () => {
    // Declare a digits variable
    const OTP = otpGenerator.generate(config.authentication.otp_length, {digits: true, lowerCaseAlphabets: false, upperCaseAlphabets: false, specialChars: false});
    return OTP;
};

const sendSms = async ({message, contactNumber}) => {
    // eslint-disable-next-line no-useless-catch
    try {
        logger.info(`Receiver number is: ${contactNumber}`);
        const res = await client.messages
            .create({
                from: sender,
                to: contactNumber,
                body: message,
            });
        logger.info(`result of send sms: ${res}`);
        return res;
    } catch (error) {
        throw error;
    }
};

module.exports = {
    sendSms,
    generateOTP,
};
