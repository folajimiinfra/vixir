FROM python:3.12.9-slim
COPY --from=ghcr.io/astral-sh/uv:0.6.14 /uv /bin/uv
WORKDIR /app

RUN useradd --create-home --shell /usr/sbin/nologin appuser

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY vix_agent ./vix_agent

RUN chown -R appuser:appuser /app
USER appuser

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PORT=8090
EXPOSE 8090
CMD ["/app/.venv/bin/python", "-m", "vix_agent.server"]
