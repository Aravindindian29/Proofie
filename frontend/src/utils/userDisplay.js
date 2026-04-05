/**
 * User Display Utilities
 * Handles display of usernames with support for deleted users
 */

/**
 * Get display name for a user object
 * Returns "Deleted User" if user is null/undefined
 * 
 * @param {Object|null} user - User object with username, first_name, last_name
 * @param {Object} options - Display options
 * @param {boolean} options.showFullName - Show full name if available (default: false)
 * @param {boolean} options.showEmail - Show email if available (default: false)
 * @param {string} options.deletedLabel - Custom label for deleted users (default: "Deleted User")
 * @returns {string} Display name
 */
export const getUserDisplayName = (user, options = {}) => {
  const {
    showFullName = false,
    showEmail = false,
    deletedLabel = 'Deleted User'
  } = options;

  // Handle null or undefined user
  if (!user) {
    return deletedLabel;
  }

  // If user object has no username, treat as deleted
  if (!user.username) {
    return deletedLabel;
  }

  // Build display name
  let displayName = user.username;

  if (showFullName && (user.first_name || user.last_name)) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (fullName) {
      displayName = fullName;
    }
  }

  if (showEmail && user.email) {
    displayName += ` (${user.email})`;
  }

  return displayName;
};

/**
 * Get user initials for avatar display
 * Returns "?" for deleted users
 * 
 * @param {Object|null} user - User object
 * @returns {string} User initials (max 2 characters)
 */
export const getUserInitials = (user) => {
  if (!user || !user.username) {
    return '?';
  }

  // Try to use first_name and last_name
  if (user.first_name && user.last_name) {
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  }

  // Try to use first_name only
  if (user.first_name) {
    return user.first_name.substring(0, 2).toUpperCase();
  }

  // Fall back to username
  return user.username.substring(0, 2).toUpperCase();
};

/**
 * Check if a user is deleted (null or missing username)
 * 
 * @param {Object|null} user - User object
 * @returns {boolean} True if user is deleted
 */
export const isDeletedUser = (user) => {
  return !user || !user.username;
};

/**
 * Get user display with fallback for deleted users
 * Useful for displaying author/creator information
 * 
 * @param {Object|null} user - User object
 * @param {string} fieldName - Field name for context (e.g., "uploaded_by", "author")
 * @returns {Object} Display object with name, isDeleted flag, and styling hints
 */
export const getUserDisplay = (user, fieldName = '') => {
  const isDeleted = isDeletedUser(user);
  
  return {
    name: getUserDisplayName(user),
    initials: getUserInitials(user),
    isDeleted,
    className: isDeleted ? 'deleted-user' : 'active-user',
    title: isDeleted 
      ? 'This user has been deleted' 
      : user?.email || user?.username || '',
    fieldName
  };
};

/**
 * Format user for display in lists or tables
 * 
 * @param {Object|null} user - User object
 * @param {Object} options - Display options
 * @returns {string} Formatted user display
 */
export const formatUserForDisplay = (user, options = {}) => {
  if (isDeletedUser(user)) {
    return `<span class="text-muted font-italic">${options.deletedLabel || 'Deleted User'}</span>`;
  }

  const displayName = getUserDisplayName(user, options);
  return `<span class="user-name">${displayName}</span>`;
};

/**
 * Get CSS class for user display based on deletion status
 * 
 * @param {Object|null} user - User object
 * @returns {string} CSS class names
 */
export const getUserClassName = (user) => {
  if (isDeletedUser(user)) {
    return 'text-muted font-italic';
  }
  return 'text-dark';
};

export default {
  getUserDisplayName,
  getUserInitials,
  isDeletedUser,
  getUserDisplay,
  formatUserForDisplay,
  getUserClassName
};
