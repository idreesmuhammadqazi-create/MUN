/**
 * Email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Phone number validation (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * URL validation
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * File validation
 */
export function validateFile(file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxNameLength?: number;
}): {
  isValid: boolean;
  error?: string;
} {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = [], maxNameLength = 255 } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Check filename length
  if (file.name.length > maxNameLength) {
    return {
      isValid: false,
      error: `Filename ${file.name} is too long. Maximum length is ${maxNameLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validate MUN country name
 */
export function isValidCountry(country: string): boolean {
  // List of valid UN member states (simplified for demo)
  const validCountries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
    'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso',
    'Burundi', 'Côte D\'Ivoire', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic',
    'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus',
    'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland',
    'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea',
    'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
    'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
    'Kuwait', 'Kyrgyzstan', 'Lao People\'s Democratic Republic', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
    'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
    'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Monaco',
    'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
    'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
    'Poland', 'Portugal', 'Qatar', 'Republic of Korea', 'Republic of Moldova', 'Romania', 'Russian Federation',
    'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
    'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone',
    'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan',
    'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syrian Arab Republic',
    'Tajikistan', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United Republic of Tanzania',
    'United States of America', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
    'United States', 'UK', 'USA', 'America'
  ];

  return validCountries.some(validCountry =>
    validCountry.toLowerCase() === country.trim().toLowerCase()
  );
}

/**
 * Validate committee name
 */
export function isValidCommittee(committee: string): boolean {
  // Common MUN committees
  const validCommittees = [
    'General Assembly',
    'Security Council',
    'Economic and Social Council',
    'Human Rights Council',
    'International Court of Justice',
    'UNGA',
    'UNSC',
    'ECOSOC',
    'UNHRC',
    'ICJ',
    'Disarmament and International Security',
    'Economic and Financial',
    'Social, Humanitarian and Cultural',
    'Special Political and Decolonization',
    'Legal',
    'Organizational',
    'Administrative and Budgetary',
    'DISEC',
    'SOCHUM',
    'SPECPOL',
    'GA1',
    'GA2',
    'GA3',
    'GA4',
    'GA5',
    'GA6'
  ];

  return validCommittees.some(validCommittee =>
    validCommittee.toLowerCase() === committee.trim().toLowerCase()
  );
}

/**
 * Validate session topic
 */
export function isValidTopic(topic: string): boolean {
  const trimmedTopic = topic.trim();

  // Basic validation rules
  return (
    trimmedTopic.length >= 5 &&
    trimmedTopic.length <= 200 &&
    /^[A-Za-z0-9\s\-_,.!?'"()]+$/.test(trimmedTopic)
  );
}

/**
 * Validate message content
 */
export function isValidMessage(content: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return { isValid: false, error: 'Message cannot be empty' };
  }

  if (trimmedContent.length < 1) {
    return { isValid: false, error: 'Message must contain at least 1 character' };
  }

  if (trimmedContent.length > 10000) {
    return { isValid: false, error: 'Message cannot exceed 10,000 characters' };
  }

  // Check for potentially harmful content (basic validation)
  const harmfulPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  for (const pattern of harmfulPatterns) {
    if (pattern.test(trimmedContent)) {
      return { isValid: false, error: 'Message contains potentially harmful content' };
    }
  }

  return { isValid: true };
}

/**
 * Validate user profile data
 */
export function validateUserProfile(profile: {
  fullName?: string;
  email?: string;
  experienceLevel?: string;
  preferredCountry?: string;
  preferredCommittee?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate full name
  if (profile.fullName) {
    const trimmedName = profile.fullName.trim();
    if (trimmedName.length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }
    if (trimmedName.length > 100) {
      errors.push('Full name cannot exceed 100 characters');
    }
    if (!/^[a-zA-Z\s\-']+$/.test(trimmedName)) {
      errors.push('Full name can only contain letters, spaces, hyphens, and apostrophes');
    }
  }

  // Validate email
  if (profile.email && !isValidEmail(profile.email)) {
    errors.push('Please enter a valid email address');
  }

  // Validate experience level
  if (profile.experienceLevel) {
    const validLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validLevels.includes(profile.experienceLevel.toLowerCase())) {
      errors.push('Experience level must be one of: beginner, intermediate, or advanced');
    }
  }

  // Validate preferred country
  if (profile.preferredCountry && !isValidCountry(profile.preferredCountry)) {
    errors.push('Please enter a valid UN member state');
  }

  // Validate preferred committee
  if (profile.preferredCommittee && !isValidCommittee(profile.preferredCommittee)) {
    errors.push('Please enter a valid MUN committee');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate session data
 */
export function validateSessionData(session: {
  country?: string;
  committee?: string;
  council?: string;
  topic?: string;
}): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate country
  if (!session.country) {
    errors.push('Country is required');
  } else if (!isValidCountry(session.country)) {
    errors.push('Please enter a valid UN member state');
  }

  // Validate committee
  if (!session.committee) {
    errors.push('Committee is required');
  } else if (!isValidCommittee(session.committee)) {
    errors.push('Please enter a valid MUN committee');
  }

  // Validate topic
  if (!session.topic) {
    errors.push('Topic is required');
  } else if (!isValidTopic(session.topic)) {
    errors.push('Topic must be between 5 and 200 characters and contain only valid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate WebSocket URL
 */
export function isValidWebSocketURL(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'ws:' || parsedUrl.protocol === 'wss:';
  } catch {
    return false;
  }
}

/**
 * Check if string contains sensitive information (basic detection)
 */
export function containsSensitiveInfo(text: string): boolean {
  // Basic patterns for sensitive information
  const sensitivePatterns = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card numbers
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN pattern
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/, // Phone numbers
  ];

  return sensitivePatterns.some(pattern => pattern.test(text));
}

/**
 * Sanitize user input (basic sanitization)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters long');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Include numbers');

  if (/[^a-zA-Z\d]/.test(password)) score++;
  else feedback.push('Include special characters');

  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  return {
    isValid: score >= 3,
    strength,
    feedback,
  };
}