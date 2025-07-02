const Joi = require('@hapi/joi');
const { password, mobile } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    mobile: Joi.string().required().custom(mobile),
    role_id: Joi.number().required(),
    organization: Joi.string(),
    
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const otpLogin = {
  body: Joi.object().keys({
    mobile: Joi.string().required().custom(mobile),
  }),
};

const verifyOtp = {
  body: Joi.object().keys({
    mobile: Joi.string().required().custom(mobile),
    otp: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    origin: Joi.string().required(),
  }),
};

const resetPassword = {
  query: Joi.object().keys({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
  }),
};

module.exports = {
  register,
  login,
  refreshTokens,
  forgotPassword,
  resetPassword,
  otpLogin,
  verifyOtp,
};