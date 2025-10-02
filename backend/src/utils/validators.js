const { containsProfanity } = require('./profanity');

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation
function isValidPassword(password) {
  // Minimum 8 characters, at least 1 uppercase, 1 number, 1 special character
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    valid: minLength && hasUppercase && hasNumber && hasSpecial,
    errors: {
      minLength: !minLength ? 'Password must be at least 8 characters' : null,
      hasUppercase: !hasUppercase ? 'Password must contain at least 1 uppercase letter' : null,
      hasNumber: !hasNumber ? 'Password must contain at least 1 number' : null,
      hasSpecial: !hasSpecial ? 'Password must contain at least 1 special character' : null
    }
  };
}

// Item validation
function validateItem(itemData) {
  const errors = {};
  
  // Title validation
  if (!itemData.title || itemData.title.length < 3 || itemData.title.length > 200) {
    errors.title = 'Title must be between 3 and 200 characters';
  } else {
    const profanityCheck = containsProfanity(itemData.title);
    if (profanityCheck.detected) {
      errors.title = 'Title contains inappropriate content';
    }
  }
  
  // Description validation
  if (!itemData.description || itemData.description.length < 20 || itemData.description.length > 2000) {
    errors.description = 'Description must be between 20 and 2000 characters';
  } else {
    const profanityCheck = containsProfanity(itemData.description);
    if (profanityCheck.detected) {
      errors.description = 'Description contains inappropriate content';
    }
  }
  
  // Price validation
  const price = parseFloat(itemData.price);
  if (isNaN(price) || price < 0 || price > 999999.99) {
    errors.price = 'Price must be between 0 and 999,999.99';
  }
  
  // Category validation
  if (!itemData.category_id) {
    errors.category = 'Category is required';
  }
  
  // Condition validation
  const validConditions = ['New', 'Like New', 'Good', 'Fair', 'Poor'];
  if (!itemData.condition || !validConditions.includes(itemData.condition)) {
    errors.condition = 'Invalid condition value';
  }
  
  // Location validation
  if (!itemData.location || itemData.location.length > 100) {
    errors.location = 'Location is required and must be less than 100 characters';
  }
  
  // Discount validation
  if (itemData.discount_percentage) {
    const discount = parseInt(itemData.discount_percentage);
    if (isNaN(discount) || discount < 0 || discount > 90) {
      errors.discount = 'Discount must be between 0 and 90';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// Message validation
function validateMessage(content) {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 1000) {
    return { valid: false, error: 'Message must be less than 1000 characters' };
  }
  
  const profanityCheck = containsProfanity(content);
  if (profanityCheck.detected) {
    return { valid: false, error: 'Message contains inappropriate content' };
  }
  
  return { valid: true };
}

module.exports = {
  isValidEmail,
  isValidPassword,
  validateItem,
  validateMessage
};
