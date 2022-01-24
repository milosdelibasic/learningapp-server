/* eslint-disable quotes */
module.exports.codes = {
  NO_DATA_PROVIDED: {
    code: 403,
    message: "No credentials provided",
  },
  BAD_REQUEST: {
    code: 400,
    message: "Bad request!",
  },
  EMAIL_REGISTERED: {
    code: 406,
    message: "Email already registered",
  },
  USERNAME_REGISTERED: {
    code: 406,
    message: "Username already exists",
  },
  NICK_REGISTERED: {
    code: 406,
    message: "Player with that nick already exists",
  },
  SHORT_PASSWORD: {
    code: 400,
    internalCode: 40004,
    message: "Password shorter then 4 characters",
  },
  WEEK_PASSWORD: {
    code: 400,
    internalCode: 40005,
    message:
      "Password must contain at least one digit, one upper case letter, one special character and must be at least 8 characters long",
  },
  NOT_AUTHENTICATED: {
    code: 401,
    message: "Not Authenticated",
  },
  FORBIDDEN: {
    code: 405,
    message: "You are not authorized to access this URI",
  },
  EXPIRED: {
    code: 403,
    internalCode: 40403,
    message: "Your session has expired",
  },
  EXPIRED_REFRESH_TOKEN: {
    code: 403,
    internalCode: 10,
    message: "Your refresh token has expired, please re-login.",
  },
  NOT_FOUND: {
    code: 404,
    message: "Not found",
  },
  NOT_ALLOWED: {
    code: 405,
    message: "Not allowed",
  },
  ACCOUNT_INACTIVE: {
    code: 405,
    message: "Your account is inactive",
  },
  DUPLICATE: {
    code: 406,
    message: "Duplicate, already exists",
  },
  INVALID_EMAIL_PASSWORD: {
    code: 409,
    message: "Invalid email/password",
  },
  INVALID_PASSWORD: {
    code: 409,
    message: "Invalid password",
  },
  PASSWORDS_DONT_MATCH: {
    code: 409,
    message: "Password and confirm password do not match",
  },
  INTERNAL_ERROR: {
    code: 500,
    message: "Internal server error",
  },
  DATABASE_ERROR: {
    code: 500,
    message: "Database error",
  },
  INTERNAL_ERROR_SENDING_EMAIL: {
    code: 500,
    message: "Internal server error occurred while sending email",
  },
  EMAIL_IS_BLACKLISTED: {
    code: 417,
    internalCode: 17,
    message: "Looks like your email is blacklisted, please contact support",
  },
  WHERE_VALUE: (fieldName) => {
    return {
      code: 400,
      message: `You must enter ${fieldName} value`,
    };
  },
  UNIQUE_CONSTRAINT: {
    code: 500,
    message: "Duplicate key",
  },
  NOT_ACTIVE: {
    code: 400,
    internalCode: 15,
    message: "Inactive",
  },
  REJECT_API: {
    code: 401,
    message: "Unauthorized access",
  },
  INVALID_PAYMENT_DATA: {
    code: 400,
    message: "Invalid Payment Data",
  },
  CUSTOM: ({ code, message, data }) => {
    return {
      code,
      message,
      data,
    };
  },
};
