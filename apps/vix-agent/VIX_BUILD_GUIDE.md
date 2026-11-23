# Vix Agent Implementation Guide

## Quick Start

### 1. Setup Development Environment
```bash
cd apps/vix-agent
uv sync
uv run pytest tests/  # Run existing tests
```

### 2. Environment Variables (.env)
```bash
# LiveKit
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...

# Vixir Backend
VIXIR_API_URL=http://localhost:8080/api/v1
VIXIR_SERVICE_SECRET=your-service-jwt-secret

# Config
LOG_LEVEL=INFO
```

### 3. Implementation Order

#### Phase 1: Foundation (Days 1-3)
- [x] Contracts (`contracts.py`) - DONE
- [x] Policy rules (`policy.py`) - DONE  
- [ ] API client (`api_client.py`)
- [ ] Screen manager (`screen.py`)
- [ ] RPC wrappers (`rpc.py`)
- [ ] Tour loader (`tours.py`)

#### Phase 2: LangGraph Core (Days 4-7)
- [ ] State definition (`graph/state.py`)
- [ ] Node implementations (`graph/nodes.py`)
- [ ] Graph builder (`graph/build.py`)
- [ ] Policy guard with LLM (`graph/policy.py`)
- [ ] Prompts (`graph/prompts/`)

#### Phase 3: LiveKit Integration (Days 8-10)
- [ ] Session setup (`session.py`)
- [ ] LangGraph-LLM bridge
- [ ] ScreenMap topic handler
- [ ] RPC execution
- [ ] Main entrypoint updates (`main.py`)

#### Phase 4: Testing (Days 11-14)
- [ ] Unit tests for all nodes
- [ ] Policy property tests
- [ ] Graph tests with mocked LLM
- [ ] Evaluation set creation
- [ ] CI pipeline

#### Phase 5: Polish (Days 15-20)
- [ ] Vision frame sampling (P1)
- [ ] Multi-language support
- [ ] Latency optimization
- [ ] Observability
- [ ] Load testing

## Key Files to Create

```
apps/vix-agent/vix_agent/
├── api_client.py          # Backend API calls
├── screen.py              # ScreenMap cache & resolver
├── rpc.py                 # LiveKit RPC wrappers
├── session.py             # AgentSession setup
├── tours.py               # Scripted tour loading
└── graph/
    ├── __init__.py
    ├── state.py           # VixState TypedDict
    ├── nodes.py           # All node functions
    ├── build.py           # Graph wiring
    ├── policy.py          # LLM classifier
    └── prompts/
        ├── system.txt
        ├── classify_v1.txt
        ├── socratic_v1.txt
        ├── safety_v1.txt
        └── rewrite_v1.txt
```

## Testing Commands

```bash
# Unit tests
uv run pytest tests/unit/

# Integration tests (requires API running)
uv run pytest tests/integration/

# Evaluation tests
uv run pytest tests/evals/

# Property tests
uv run pytest tests/property/

# All tests
uv run pytest

# With coverage
uv run pytest --cov=vix_agent --cov-report=html
```

## Running Locally

```bash
# Development mode (hot reload)
uv run python -m vix_agent.main dev

# Production mode
uv run python -m vix_agent.main start

# Connect to local LiveKit
uv run python -m vix_agent.main connect --url ws://localhost:7880
```

## Debugging

### Enable Debug Logging
```python
import structlog
structlog.configure(
    wrapper_class=structlog.make_filtering_bound_logger(logging.DEBUG),
)
```

### Test Individual Nodes
```python
from vix_agent.graph.nodes import classify_intent_node

state = {
    "user_text": "What should I do next?",
    "screen": mock_screen_map,
}

result = await classify_intent_node(state)
print(result["intent"])  # Should be "what_next"
```

### Test Policy Guard
```python
from vix_agent.policy import violates

assert violates("Your g is 9.8 m/s²", "GRADED") == "states a value with units"
assert violates("Try measuring again", "GRADED") is None
```

## Common Issues

### 1. LiveKit Connection Fails
- Check `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`
- Verify network access to LiveKit Cloud
- Check agent name matches dispatch: `agent_name="vix"`

### 2. API Context 401
- Verify `VIXIR_SERVICE_SECRET` matches backend
- Check JWT generation in `api_client.py`
- Ensure service scope includes `vix-agent`

### 3. Policy False Positives
- Review regex patterns in `policy.py`
- Check LLM classifier prompt
- Add test cases to prevent regression

### 4. High Latency
- Profile each node with `time.time()`
- Check STT/TTS provider selection
- Optimize LLM calls (use Haiku for classification)
- Enable streaming where possible

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| STT final | < 250ms | End of speech → text |
| Intent classification | < 250ms | Text → intent |
| First LLM sentence | < 400ms | Intent → first sentence |
| TTS first audio | < 250ms | Sentence → audio |
| **End-to-end (p50)** | **< 1.2s** | Speech end → audio start |
| **End-to-end (p95)** | **< 2.5s** | Speech end → audio start |
| Policy check | < 100ms | Per sentence |
| RPC call | < 50ms | Agent → web |

## Deployment Checklist

- [ ] Docker image builds
- [ ] Environment variables configured
- [ ] Service JWT secret set
- [ ] STT/TTS API keys valid
- [ ] Claude API key valid with sufficient credits
- [ ] LiveKit agent deployed and registered
- [ ] Health check endpoint working
- [ ] Logs flowing to observability platform
- [ ] Metrics dashboard created
- [ ] Load test passed (20 concurrent sessions)
- [ ] Eval tests passing in CI
- [ ] Demo recorded

## Resources

- **Full Spec**: See `VIX_AGENT_SPEC.md` (companion to this guide)
- **Contracts**: `../../.kiro/steering/contracts.md`
- **Requirements**: `../../.kiro/specs/vix-agent/requirements.md`
- **Design**: `../../.kiro/specs/vix-agent/design.md`
- **LiveKit Docs**: https://docs.livekit.io/agents/
- **LangGraph Docs**: https://python.langchain.com/docs/langgraph

## Getting Help

1. Check existing code in `vix_agent/`
2. Review requirements in `.kiro/specs/vix-agent/`
3. Test with evaluation cases in `evals/`
4. Consult LiveKit Agents examples
5. Review LangGraph multi-agent patterns

---

**Ready to build!** Start with Phase 1 and work incrementally. Test each component before moving to the next.
