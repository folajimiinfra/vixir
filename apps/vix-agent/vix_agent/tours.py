"""Scripted tour loader, visible-region filtering, and bounded step navigation (Req 4)."""
from __future__ import annotations

from typing import Literal

from .contracts import RpcCall, ScreenMap, TourState, TourStep
from .rpc import RpcDispatcher

TourNavCommand = Literal["next", "back", "again", "stop"]

DEFAULT_SCREEN_TOURS: dict[str, list[TourStep]] = {
    "D1": [
        TourStep(
            regionId="top-bar",
            caption="The top bar shows your experiment title, current practical mode, and the button to plot your T² against L graph when your readings are complete.",
        ),
        TourStep(
            regionId="tool-rail",
            caption="The left tool rail gives you quick instruments: the pointer, the precision vernier ruler, the eye-level magnifier loupe, your lab notebook, and an auxiliary stopwatch.",
        ),
        TourStep(
            regionId="apparatus-tray",
            caption="The apparatus tray lists your retort stand, split cork, inextensible thread, brass bob, metre rule, and stopwatch.",
        ),
        TourStep(
            regionId="bench",
            caption="This is your main pendulum bench. Displace the brass bob by a small angle under 10 degrees and release it smoothly to start oscillating.",
        ),
        TourStep(
            regionId="dock.stopwatch",
            caption="Use the digital stopwatch to time 20 complete oscillations as the string passes the vertical fiducial reference mark.",
        ),
        TourStep(
            regionId="instrument-dock",
            caption="The instrument dock at the bottom lets you adjust the pendulum length L from 30 cm to 100 cm and record your 20-oscillation time.",
        ),
        TourStep(
            regionId="data-panel",
            caption="The data panel on the right stores your recorded table of L, t₁, t₂, mean t, period T, and T², along with your live plot.",
        ),
    ],
    "D2": [
        TourStep(
            regionId="apparatus-tray",
            caption="Check that your 50 cm³ burette is rinsed with acid, your 25.0 cm³ pipette is rinsed with base, and your white tile is under the conical flask.",
        ),
        TourStep(
            regionId="bench",
            caption="Read the bottom of the concave meniscus in the burette at eye level to avoid parallax error.",
        ),
        TourStep(
            regionId="instrument-dock",
            caption="Use the stopcock controls to run acid quickly at first, then add drop-by-drop near the methyl orange end-point.",
        ),
        TourStep(
            regionId="data-panel",
            caption="Record your initial and final burette readings to two decimal places and select your concordant titres within 0.10 cm³.",
        ),
    ],
    "D6": [
        TourStep(
            regionId="apparatus-tray",
            caption="Here on the left you can switch workbench modes, add extra resistors or meters, and set the length and alloy of test wire X.",
        ),
        TourStep(
            regionId="bench",
            caption="This schematic workbench shows your DC cells, key K, sliding rheostat, series ammeter, and parallel voltmeter across wire X.",
        ),
        TourStep(
            regionId="instrument-dock",
            caption="Slide the rheostat to vary the current I, read the analogue ammeter and voltmeter scales, and open the key between readings so wire X stays cool.",
        ),
        TourStep(
            regionId="data-panel",
            caption="Each recorded V and I pair plots directly on your V-against-I graph so you can determine the resistance from the slope.",
        ),
    ],
}


def load_tour_for_screen(
    screen_code: str,
    screen_map: ScreenMap | None,
    custom_tours: dict[str, list[TourStep]] | None = None,
) -> TourState:
    """Load the scripted Tour for `screen_code` and filter it to regions present and `visible=True` in `screen_map` (Req 4 AC1)."""
    catalog = {**DEFAULT_SCREEN_TOURS, **(custom_tours or {})}
    raw_steps = catalog.get(screen_code) or DEFAULT_SCREEN_TOURS["D1"]

    if screen_map is None:
        return TourState(tourId=f"{screen_code}.default", steps=list(raw_steps), index=0, active=True)

    visible_ids = {r.id for r in screen_map.regions if r.visible}
    filtered = [
        step
        for step in raw_steps
        if step.regionId in visible_ids
        or any(vid.startswith(step.regionId + ".") or step.regionId.startswith(vid + ".") for vid in visible_ids)
    ]

    # If none of the canonical IDs matched, synthesize tour steps directly from the visible regions in ScreenMap
    if not filtered and screen_map.visible_regions():
        filtered = [
            TourStep(
                regionId=reg.id,
                caption=f"This is the {reg.label} ({reg.kind}). {reg.summary or 'Use it during this stage of the practical.'}".strip(),
            )
            for reg in screen_map.visible_regions()
        ]

    return TourState(
        tourId=f"{screen_code}.default",
        steps=filtered,
        index=0,
        active=bool(filtered),
    )


def parse_tour_nav_command(user_text: str) -> TourNavCommand | None:
    """Detect whether student speech is a tour navigation command (`next`, `back`, `again`, `stop`)."""
    q = user_text.strip().lower().rstrip(".!?")
    if q in ("next", "continue", "go on", "forward", "next step", "continue tour"):
        return "next"
    if q in ("back", "previous", "go back", "previous step"):
        return "back"
    if q in ("again", "repeat", "say again", "repeat step"):
        return "again"
    if q in ("stop", "end tour", "exit tour", "cancel tour", "stop tour"):
        return "stop"
    return None


def navigate_tour_state(
    tour: TourState,
    command: TourNavCommand,
) -> tuple[TourState, list[RpcCall], str]:
    """Apply `next`, `back`, `again`, or `stop` to an active TourState while preserving `0 <= index <= n-1` (Req 4 AC2–6)."""
    if not tour.steps or not tour.active:
        ended = TourState(tourId=tour.tourId, steps=tour.steps, index=0, active=False)
        return (ended, [RpcDispatcher.end_tour()], "The screen tour has ended. Ask me about any part of the bench whenever you are ready.")

    n = len(tour.steps)
    if command == "stop":
        ended = TourState(tourId=tour.tourId, steps=tour.steps, index=tour.clamp_index(tour.index), active=False)
        return (
            ended,
            [RpcDispatcher.end_tour()],
            "I have closed the screen tour. Which part of the experiment would you like to work on?",
        )

    if command == "next":
        if tour.index + 1 >= n:
            # Reached the end of the tour (Req 4 AC6: call endTour to remove overlays)
            last_idx = n - 1
            ended = TourState(tourId=tour.tourId, steps=tour.steps, index=last_idx, active=False)
            return (
                ended,
                [RpcDispatcher.end_tour()],
                "That completes our tour of the lab screen. What step of the procedure would you like to try first?",
            )
        new_idx = tour.clamp_index(tour.index + 1)
    elif command == "back":
        new_idx = tour.clamp_index(tour.index - 1)
    else:  # "again"
        new_idx = tour.clamp_index(tour.index)

    updated = TourState(tourId=tour.tourId, steps=tour.steps, index=new_idx, active=True)
    step = updated.steps[new_idx]
    rpcs = [
        RpcDispatcher.tour_step(new_idx),
        RpcDispatcher.spotlight(step.regionId),
    ]
    return (updated, rpcs, step.caption)
