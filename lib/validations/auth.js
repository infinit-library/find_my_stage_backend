const validator = require('validator');

class AuthValidations {
  // Validate email
  static validateEmail(email) {
    if (!email) {
      return { isValid: false, message: 'Email is required' };
    }
    
    if (!validator.isEmail(email)) {
      return { isValid: false, message: 'Please provide a valid email address' };
    }
    
    return { isValid: true };
  }

  // Validate password
  static validatePassword(password) {
    if (!password) {
      return { isValid: false, message: 'Password is required' };
    }
    
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    
    return { isValid: true };
  }

  // Validate name
  static validateName(name, fieldName = 'Name') {
    if (!name) {
      return { isValid: false, message: `${fieldName} is required` };
    }
    
    if (name.trim().length < 2) {
      return { isValid: false, message: `${fieldName} must be at least 2 characters long` };
    }
    
    if (name.trim().length > 50) {
      return { isValid: false, message: `${fieldName} must be less than 50 characters` };
    }
    
    return { isValid: true };
  }

  // Validate signup data
  static validateSignupData(data) {
    const errors = [];
    
    // Validate first name
    const firstNameValidation = this.validateName(data.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      errors.push(firstNameValidation.message);
    }
    
    // Validate last name
    const lastNameValidation = this.validateName(data.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.push(lastNameValidation.message);
    }
    
    // Validate email
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.message);
    }
    
    // Validate password
    const passwordValidation = this.validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.message);
    }
    
    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate login data
  static validateLoginData(data) {
    const errors = [];
    
    // Validate email
    const emailValidation = this.validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.message);
    }
    
    // Validate password
    if (!data.password) {
      errors.push('Password is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validate password change data
  static validatePasswordChangeData(data) {
    const errors = [];
    
    if (!data.currentPassword) {
      errors.push('Current password is required');
    }
    
    const newPasswordValidation = this.validatePassword(data.newPassword);
    if (!newPasswordValidation.isValid) {
      errors.push(newPasswordValidation.message);
    }
    
    if (data.newPassword !== data.confirmNewPassword) {
      errors.push('New passwords do not match');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize input
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return validator.escape(input.trim());
    }
    return input;
  }

  // Sanitize user data
  static sanitizeUserData(data) {
    const sanitized = {};
    
    if (data.firstName) {
      sanitized.firstName = this.sanitizeInput(data.firstName);
    }
    
    if (data.lastName) {
      sanitized.lastName = this.sanitizeInput(data.lastName);
    }
    
    if (data.email) {
      sanitized.email = validator.normalizeEmail(data.email);
    }
    
    if (data.bio) {
      sanitized.bio = this.sanitizeInput(data.bio);
    }
    
    if (data.location) {
      sanitized.location = this.sanitizeInput(data.location);
    }
    
    if (data.website) {
      sanitized.website = validator.isURL(data.website) ? data.website : null;
    }
    
    if (data.linkedin) {
      sanitized.linkedin = validator.isURL(data.linkedin) ? data.linkedin : null;
    }
    
    if (data.twitter) {
      sanitized.twitter = validator.isURL(data.twitter) ? data.twitter : null;
    }
    
    return sanitized;
  }
}

module.exports = AuthValidations;
