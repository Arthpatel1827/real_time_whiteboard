import logging

from loguru import logger


def configure_logging(app=None):
    """Configure structured logging for Flask and other modules."""

    # Pipe loguru logs to standard logging so Flask can use it.
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            logger_opt = logger.opt(depth=6, exception=record.exc_info)
            logger_opt.log(record.levelname, record.getMessage())

    logging.basicConfig(handlers=[InterceptHandler()], level=logging.INFO)

    if app is not None:
        app.logger.handlers = []
        app.logger.propagate = True


def get_logger(name: str):
    return logger.bind(module=name)
