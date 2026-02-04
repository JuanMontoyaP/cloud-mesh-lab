import logging
from rich.logging import RichHandler

from src.core.config import settings


def setup_logging() -> None:
    logging.basicConfig(
        format="%(message)s",
        level=settings.LOG_LEVEL,
        datefmt="[%X]",
        handlers=[RichHandler(rich_tracebacks=False)],
        force=True,
    )
