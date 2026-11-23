"""Multi-agent architecture for Vix.

This module implements a true multi-agent system using LangGraph's Coordinator pattern.
Each agent has a specialized role and communicates through structured messages.

Architecture:
- Coordinator: High-level orchestration, state management, policy enforcement
- ScreenAgent: Analyzes screen, resolves references, guides tours
- ContentAgent: Retrieves and explains concepts (theory, glossary, procedure)
- SafetyAgent: Monitors for safety issues, enforces safety rules
- PolicyAgent: Gatekeeper, checks all outputs against mode rules
- VoiceAgent: Handles STT/TTS, voice interaction

Agents communicate via messages with structured schemas, not free text.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from typing_extensions import TypedDict

from .contracts import Mode, ScreenMap


class MessageType(Enum):
    """Types of messages passed between agents."""
    QUERY = "query"  # Request for information
    RESPONSE = "response"  # Reply to a query
    ACTION = "action"  # Request to perform an action
    OBSERVATION = "observation"  # Shared observation (e.g., screen update)
    POLICY_CHECK = "policy_check"  # Policy verification request
    POLICY_VIOLATION = "policy_violation"  # Policy violation report


@dataclass
class Message:
    """Message passed between agents."""
    sender: str
    recipient: str | None  # None = broadcast
    type: MessageType
    payload: dict[str, Any]
    correlation_id: str = field(default_factory=lambda: str(id(Message)))


# =============================================================================
# Agent Definitions
# =============================================================================

class Agent:
    """Base class for all Vix agents."""
    
    def __init__(self, name: str):
        self.name = name
        self.received_messages: list[Message] = []
        self.outgoing_messages: list[Message] = []
    
    def receive(self, message: Message) -> list[Message]:
        """Process a message and return response messages."""
        self.received_messages.append(message)
        responses = self._handle(message)
        self.outgoing_messages.extend(responses)
        return responses
    
    def _handle(self, message: Message) -> list[Message]:
        """Subclasses implement this to handle messages."""
        raise NotImplementedError


class ScreenAgent(Agent):
    """Agent responsible for screen analysis and region resolution."""
    
    def __init__(self):
        super().__init__("screen_agent")
        self.screen_map: ScreenMap | None = None
        self.tour_state: dict | None = None
    
    def update_screen(self, screen_map: ScreenMap):
        """Update the agent's view of the screen."""
        self.screen_map = screen_map
    
    def resolve_reference(self, reference: str) -> list[str] | None:
        """Try to resolve a natural language reference to region IDs."""
        if not self.screen_map:
            return None
        
        # Simple implementation - in reality would use LLM or vector search
        candidates = []
        for region in self.screen_map.regions:
            if reference.lower() in region.label.lower():
                candidates.append(region.id)
        
        return candidates if candidates else None
    
    def _handle(self, message: Message) -> list[Message]:
        """Handle messages specific to screen agent."""
        if message.type == MessageType.QUERY and "screen" in message.payload:
            return [Message(
                sender=self.name,
                recipient=message.sender,
                type=MessageType.RESPONSE,
                payload={"screen_map": self.screen_map}
            )]
        
        elif message.type == MessageType.QUERY and "resolve" in message.payload:
            ref = message.payload["resolve"]
            resolved = self.resolve_reference(ref)
            return [Message(
                sender=self.name,
                recipient=message.sender,
                type=MessageType.RESPONSE,
                payload={"resolved": resolved, "reference": ref}
            )]
        
        elif message.type == MessageType.OBSERVATION and "screen_map" in message.payload:
            self.update_screen(message.payload["screen_map"])
            return []
        
        return []


class ContentAgent(Agent):
    """Agent responsible for retrieving and explaining content."""
    
    def __init__(self):
        super().__init__("content_agent")
        self.experiment_context: dict | None = None
        self.glossary: dict[str, str] = {}
        self.procedure: list[dict] = []
    
    def load_context(self, context: dict):
        """Load experiment context."""
        self.experiment_context = context
        self.glossary = context.get("glossary", {})
        self.procedure = context.get("procedure", [])
    
    def retrieve(self, query: str) -> dict[str, Any]:
        """Retrieve relevant content for a query."""
        # Simple keyword matching - in reality would use BM25
        results = {"theory": [], "glossary": [], "procedure": []}
        
        query_lower = query.lower()
        
        # Search glossary
        for term, definition in self.glossary.items():
            if term.lower() in query_lower:
                results["glossary"].append({"term": term, "definition": definition})
        
        # Search procedure
        for step in self.procedure:
            if any(word in step.get("description", "").lower() for word in query_lower.split()):
                results["procedure"].append(step)
        
        return results
    
    def explain_socratically(self, query: str, user_level: str = "secondary") -> str:
        """Generate a Socratic explanation."""
        retrieved = self.retrieve(query)
        
        if retrieved["glossary"]:
            term = retrieved["glossary"][0]["term"]
            definition = retrieved["glossary"][0]["definition"]
            return f"Great question! {term} means {definition}. " \
                   f"Based on what you've observed, how do you think this applies to your experiment?"
        
        return "That's an interesting aspect of the experiment. Have you considered how it relates " \
               "to the theory we covered in the briefing? What do you predict would happen if...?"
    
    def _handle(self, message: Message) -> list[Message]:
        """Handle content-related queries."""
        if message.type == MessageType.QUERY and "concept" in message.payload:
            concept = message.payload["concept"]
            explanation = self.explain_socratically(concept)
            return [Message(
                sender=self.name,
                recipient=message.sender,
                type=MessageType.RESPONSE,
                payload={"explanation": explanation}
            )]
        
        elif message.type == MessageType.QUERY and "retrieve" in message.payload:
            query = message.payload["retrieve"]
            results = self.retrieve(query)
            return [Message(
                sender=self.name,
                recipient=message.sender,
                type=MessageType.RESPONSE,
                payload={"results": results}
            )]
        
        elif message.type == MessageType.ACTION and "load_context" in message.payload:
            self.load_context(message.payload["load_context"])
            return []
        
        return []


class SafetyAgent(Agent):
    """Agent responsible for safety monitoring and guidance."""
    
    def __init__(self):
        super().__init__("safety_agent")
        self.precautions: list[str] = []
        self.warnings: list[str] = []
    
    def update_warnings(self, warnings: list[str]):
        """Update current safety warnings."""
        self.warnings = warnings
    
    def check_safety(self, action: str) -> bool:
        """Check if an action is safe."""
        # Simple implementation - in reality would use LLM
        unsafe_keywords = ["open flame", "break glass", "mix chemicals", "touch hot"]
        action_lower = action.lower()
        return not any(keyword in action_lower for keyword in unsafe_keywords)
    
    def _handle(self, message: Message) -> list[Message]:
        """Handle safety-related queries."""
        if message.type == MessageType.QUERY and "safety" in message.payload:
            query = message.payload["safety"]
            
            # Search precautions
            relevant = [p for p in self.precautions if query.lower() in p.lower()]
            
            return [Message(
                sender=self.name,
                recipient=message.sender,
                type=MessageType.RESPONSE,
                payload={"precautions": relevant, "warnings": self.warnings}
            )]
        
        elif message.type == MessageType.OBSERVATION and "warnings" in message.payload:
            self.update_warnings(message.payload["warnings"])
            return []
        
        return []


class PolicyAgent(Agent):
    """Agent responsible for policy enforcement."""
    
    def __init__(self, mode: Mode = "PRACTICE"):
        super().__init__("policy_agent")
        self.mode = mode
        self.violations: list[dict] = []
    
    def check_message(self, message: str) -> tuple[bool, str | None]:
        """Check if a message violates policy."""
        from .policy import violates
        
        if violates(message, self.mode):
            return False, "Policy violation detected"
        
        # Additional checks for multi-agent system
        if self.mode == "GRADED" and any(
            keyword in message.lower() 
            for keyword in ["submit", "change", "record", "result is"]
        ):
            return False, "GRADED mode: action forbidden"
        
        return True, None
    
    def set_mode(self, mode: Mode):
        """Update the current mode."""
        self.mode = mode
    
    def _handle(self, message: Message) -> list[Message]:
        """Handle policy checks."""
        if message.type == MessageType.POLICY_CHECK:
            text = message.payload.get("text", "")
            allowed, reason = self.check_message(text)
            
            if not allowed:
                self.violations.append({
                    "text": text,
                    "reason": reason,
                    "mode": self.mode
                })
                return [Message(
                    sender=self.name,
                    recipient=message.sender,
                    type=MessageType.POLICY_VIOLATION,
                    payload={"reason": reason, "original": text}
                )]
            
            return [Message(
                sender=self.name,
                recipient=message.sender,
                type=MessageType.RESPONSE,
                payload={"allowed": True}
            )]
        
        elif message.type == MessageType.ACTION and "set_mode" in message.payload:
            self.set_mode(message.payload["set_mode"])
            return []
        
        return []


class VoiceAgent(Agent):
    """Agent responsible for voice interaction."""
    
    def __init__(self):
        super().__init__("voice_agent")
        self.transcript: list[dict] = []
        self.speech_queue: list[str] = []
    
    def add_speech(self, text: str):
        """Add text to the speech queue."""
        self.speech_queue.append(text)
    
    def get_next_speech(self) -> str | None:
        """Get the next item from speech queue."""
        if self.speech_queue:
            return self.speech_queue.pop(0)
        return None
    
    def record_transcript(self, text: str, role: str):
        """Record a turn in the transcript."""
        self.transcript.append({"role": role, "text": text, "timestamp": len(self.transcript)})
    
    def _handle(self, message: Message) -> list[Message]:
        """Handle voice-related actions."""
        if message.type == MessageType.ACTION and "speak" in message.payload:
            self.add_speech(message.payload["speak"])
            return []
        
        elif message.type == MessageType.OBSERVATION and "transcript" in message.payload:
            self.record_transcript(
                message.payload["transcript"]["text"],
                message.payload["transcript"]["role"]
            )
            return []
        
        elif message.type == MessageType.QUERY and "queue" in message.payload:
            return [Message(
                sender=self.name,
                recipient=message.sender,
                type=MessageType.RESPONSE,
                payload={"speech_queue": self.speech_queue}
            )]
        
        return []


# =============================================================================
# Coordinator (Multi-Agent Orchestrator)
# =============================================================================

class Coordinator(Agent):
    """High-level orchestrator that coordinates all specialized agents."""
    
    def __init__(self):
        super().__init__("coordinator")
        self.agents: dict[str, Agent] = {}
        self.state: dict[str, Any] = {}
        self.message_history: list[Message] = []
        
        # Initialize specialized agents
        self.register_agent(ScreenAgent())
        self.register_agent(ContentAgent())
        self.register_agent(SafetyAgent())
        self.register_agent(PolicyAgent())
        self.register_agent(VoiceAgent())
    
    def register_agent(self, agent: Agent):
        """Register an agent with the coordinator."""
        self.agents[agent.name] = agent
    
    def update_state(self, **kwargs):
        """Update shared state."""
        self.state.update(kwargs)
        
        # Broadcast state updates to agents
        for name, agent in self.agents.items():
            if name != "coordinator":
                agent.receive(Message(
                    sender="coordinator",
                    recipient=None,
                    type=MessageType.OBSERVATION,
                    payload=kwargs
                ))
    
    def dispatch(self, message: Message) -> list[Message]:
        """Dispatch a message to the appropriate agent(s)."""
        self.message_history.append(message)
        
        recipient = message.recipient
        if recipient and recipient in self.agents:
            return self.agents[recipient].receive(message)
        
        # Broadcast to all agents
        responses = []
        for agent in self.agents.values():
            if agent.name != "coordinator":
                responses.extend(agent.receive(message))
        return responses
    
    def generate_response(self, user_query: str, screen_map: ScreenMap | None = None) -> str:
        """Generate a coordinated response to a user query."""
        # Update screen if provided
        if screen_map:
            self.update_state(screen_map=screen_map)
        
        # Route to appropriate agents based on query
        responses = []
        
        # Screen analysis
        screen_response = self.agents["screen_agent"].receive(Message(
            sender="coordinator",
            recipient="screen_agent",
            type=MessageType.QUERY,
            payload={"screen": True}
        ))
        responses.extend(screen_response)
        
        # Content retrieval
        content_response = self.agents["content_agent"].receive(Message(
            sender="coordinator",
            recipient="content_agent",
            type=MessageType.QUERY,
            payload={"concept": user_query}
        ))
        responses.extend(content_response)
        
        # Safety check
        safety_response = self.agents["safety_agent"].receive(Message(
            sender="coordinator",
            recipient="safety_agent",
            type=MessageType.QUERY,
            payload={"safety": user_query}
        ))
        responses.extend(safety_response)
        
        # Policy check
        # We'll check policy on the final response, not intermediate responses
        
        # Synthesize final response (in reality, would use LLM)
        final_text = self._synthesize(responses)
        
        # Final policy check
        policy_response = self.agents["policy_agent"].receive(Message(
            sender="coordinator",
            recipient="policy_agent",
            type=MessageType.POLICY_CHECK,
            payload={"text": final_text}
        ))
        
        # Check for violations
        for resp in policy_response:
            if resp.type == MessageType.POLICY_VIOLATION:
                return f"I can't answer that. {resp.payload['reason']}."
        
        # Add to voice queue
        self.agents["voice_agent"].receive(Message(
            sender="coordinator",
            recipient="voice_agent",
            type=MessageType.ACTION,
            payload={"speak": final_text}
        ))
        
        return final_text
    
    def _synthesize(self, responses: list[Message]) -> str:
        """Synthesize a final response from agent responses."""
        # Simple synthesis - in reality would use LLM to combine
        content_text = ""
        safety_text = ""
        
        for resp in responses:
            if resp.sender == "content_agent":
                content_text = resp.payload.get("explanation", "")
            elif resp.sender == "safety_agent":
                safety_text = resp.payload.get("precautions", [])
        
        if content_text:
            return content_text
        
        if safety_text:
            return f"Important safety note: {' '.join(safety_text[:2])}"
        
        return "I'm here to help with your experiment. What would you like to know?"


# =============================================================================
# Agent State for LangGraph
# =============================================================================

class MultiAgentState(TypedDict):
    """State for the multi-agent LangGraph."""
    
    # User input
    user_query: str
    user_mode: Mode
    
    # Screen context
    screen_map: ScreenMap | None
    
    # Agent messages in flight
    pending_messages: list[Message]
    completed_messages: list[Message]
    
    # Response
    response: str
    speech_queue: list[str]
    
    # Turn counter
    turn_count: int
    max_turns: int
    
    # Session info
    session_id: str
    experiment_id: str
    locale: str


# =============================================================================
# Utility Functions
# =============================================================================

def create_multi_agent_state(
    user_query: str,
    screen_map: ScreenMap | None,
    mode: Mode,
    session_id: str,
    experiment_id: str,
    locale: str = "en"
) -> MultiAgentState:
    """Create a new multi-agent state."""
    return MultiAgentState(
        user_query=user_query,
        user_mode=mode,
        screen_map=screen_map,
        pending_messages=[],
        completed_messages=[],
        response="",
        speech_queue=[],
        turn_count=0,
        max_turns=60,
        session_id=session_id,
        experiment_id=experiment_id,
        locale=locale
    )
