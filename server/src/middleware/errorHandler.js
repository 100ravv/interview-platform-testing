export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
  if (error.name === 'ZodError') {
    return res.status(400).json({ message: error.issues.map((issue) => `${issue.path.join('.') || 'Input'}: ${issue.message}`).join(' ') });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(error.errors).map((item) => item.message).join(' ') });
  }
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid resource identifier.' });
  if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
  console.error(error);
  return res.status(500).json({ message: 'The server ran into a problem. Please try again.' });
}
