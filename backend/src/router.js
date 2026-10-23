const express = require("express");

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function Router() {
  const router = express.Router();
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const original = router[method].bind(router);
    router[method] = (path, ...handlers) =>
      original(
        path,
        ...handlers.map((handler) => (typeof handler === "function" ? asyncHandler(handler) : handler))
      );
  }
  return router;
}

module.exports = Router;
