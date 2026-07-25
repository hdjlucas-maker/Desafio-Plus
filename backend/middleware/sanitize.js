/**
 * Desafio+ — middleware/sanitize.js
 * Sanitização básica de inputs para prevenir XSS e injeção.
 */

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Middleware: sanitiza req.body e req.query antes de chegar ao controller.
 */
function sanitizeInputs(req, res, next) {
  if (req.body)  req.body  = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  next();
}

module.exports = { sanitizeInputs };
