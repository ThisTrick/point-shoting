from __future__ import annotations

import logging

_LOGGER: logging.Logger | None = None


def get_logger(name: str = "point_shoting") -> logging.Logger:
    """Get a singleton project logger with a sensible default formatter.

    Services import this to obtain a configured logger without duplicating setup.
    """
    global _LOGGER
    if _LOGGER is not None:
        return _LOGGER

    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        fmt = logging.Formatter(
            fmt="%(asctime)s %(levelname)s [%(name)s] %(message)s",
            datefmt="%H:%M:%S",
        )
        handler.setFormatter(fmt)
        logger.addHandler(handler)
    _LOGGER = logger
    return logger
