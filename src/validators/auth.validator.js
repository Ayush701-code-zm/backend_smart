const Joi = require('@hapi/joi');
const { password, mobile } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    name: Joi.string().required(),
    mobile: Joi.string().required().custom(mobile),
    role: Joi.string().required().valid('admin', 'manager', 'sales_executive'),
    organization: Joi.string().required().valid('KHUSHII', 'JWP', 'ANIMAL CARE', 'GREEN EARTH', 'EDUCATION FIRST'),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }),
};

const refreshTokens = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

module.exports = {
  register,
  login,
  refreshTokens,
};