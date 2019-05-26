module.exports = {
  'extends': 'google',
  'env': {
    'browser': true,
  },
  'rules': {
    // --- BEGIN Disabled rules ---
    'no-var': 0,
    'padded-blocks': 0,
    'prefer-rest-params': 0,
    'spaced-comment': 0,
    'guard-for-in': 0,
    'one-var': 0,
    'no-multi-spaces': 0,
    'object-curly-spacing': 0,
    'require-jsdoc': 0,
    'prefer-spread': 0,
    'no-multi-str': 0,
    // --- BEGIN Errors ---
    'no-tabs': 2,
    'indent': ['error', 2],
    'quotes': 2,
    // --- BEGIN Warnings ---
    'no-unused-vars': 1,
    'max-len': [1, 160],
    'comma-dangle': 1,
    'key-spacing': 1,
    'valid-jsdoc': 1,
  },
};
