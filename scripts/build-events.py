#!/usr/bin/env python3
"""Generate game/content/events.json from flow/CATALOG-EVENTS.md.

The catalog is the single source for what situations exist and what each option
spends. This script translates its prose spend clauses into the structured form
game/sim/ reads. It invents no situations and no options.

Magnitudes are OPEN-E1. Every number this script assigns comes from the phrase
table below and nowhere else, so changing a magnitude is one edit here rather
than 207 edits in JSON. The generated file carries that warning in its header.

Faction missions (MSN-01..04) are skipped: R11.3 runs them as an off-route
sortie, which flow/BUILD.md section 9 leaves out of the first playable.

Usage:  python3 scripts/build-events.py
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "flow" / "CATALOG-EVENTS.md"
OUT = ROOT / "game" / "content" / "events.json"

EVENT_RE = re.compile(r"^####\s+((?:EVT|MSN)-\d{2})\s+·\s+(.+?)\s*$")
OPTION_RE = re.compile(
    r"^-\s+\*\*(?P<label>[^*]+)\*\*\s*(?P<gate>\*\([^)]*\)\*)?\s*—\s*(?P<body>.+)$"
)
META_RE = re.compile(r"`([a-z ]+):\s*([^`]*)`")

# ---------------------------------------------------------------------------
# Phrase table. Ordered; first match wins. STUB OPEN-E1 throughout.
# A rule returns a dict merged into the option's spend, or a marker string.
# ---------------------------------------------------------------------------

def n(m, i=1):
    return int(m.group(i))

PHRASES = [
    (r"^\+(\d+) threat",                    lambda m: {"threat": n(m)}),
    (r"^(\d+) hours? of detour",            lambda m: {"hours": n(m), "fuel": 4}),
    (r"^(\d+) hours? (stopped|stationary)", lambda m: {"hours": n(m), "speedOrder": "stop"}),
    (r"^(\d+) hours",                       lambda m: {"hours": n(m)}),
    (r"^(\d+) hour\b",                      lambda m: {"hours": n(m)}),
    (r"^(\d+) parts?\b",                    lambda m: {"parts": n(m)}),
    (r"^(\d+) medical",                     lambda m: {"medical": n(m)}),
    (r"^(\d+) rations?",                    lambda m: {"rations": n(m)}),
    (r"^(\d+) morale",                      lambda m: {"morale": -n(m)}),
    (r"^(\d+) fuel",                        lambda m: {"fuel": n(m)}),
    (r"^(\d+) teams? permanently(?! assigned)", lambda m: {"loseTeams": n(m)}),
    (r"^(\d+) teams?\b",                    lambda m: {"detachTeams": n(m)}),
    (r"^every team's station",              lambda m: {"detachTeams": 3, "hours": 2}),
    (r"^teams in two rooms",                lambda m: {"detachTeams": 2, "hours": 2}),
    (r"^teams at (risk|high hazard damage)", lambda m: {"detachTeams": 2, "hours": 2, "teamHealth": -18}),
    (r"^that team at risk",                 lambda m: {"teamHealth": -22}),
    (r"^team health in the cold",           lambda m: {"teamHealth": -12}),

    (r"^(\d+ |a |one )?route layer",        lambda m: {"routeLayers": 1}),
    (r"^route (position|freedom)",          lambda m: {"routeLayers": 1}),

    (r"^more Scrap than",                   lambda m: {"scrap": 30}),
    (r"^Scrap$",                            lambda m: {"scrap": 20}),
    (r"^what they asked for",               lambda m: {"scrap": 18}),

    (r"^flank fuel",                        lambda m: {"fuel": 9, "speedOrder": "flank"}),
    (r"^a sortie's fuel if flown",          lambda m: {"fuel": 4}),
    (r"^the contaminated fuel",             lambda m: {"special": "contaminated_fuel"}),
    (r"^all aviation fuel",                 lambda m: {"special": "aviation_fuel"}),
    (r"^fuel (for|to|at)\b",                lambda m: {"fuel": 6}),
    (r"^fuel$",                             lambda m: {"fuel": 5}),
    (r"^a detour",                          lambda m: {"fuel": 5, "hours": 2}),

    (r"^AA and secondary ammunition",       lambda m: {"aa": 14, "shell": 8}),
    (r"^AA ammunition",                     lambda m: {"aa": 12}),
    (r"^a great deal of ammunition",        lambda m: {"shell": 30, "aa": 10}),
    (r"^a fight's worth of ammunition",     lambda m: {"fight": True}),
    (r"^a fight",                           lambda m: {"fight": True}),
    (r"^under fire from an undamaged escort", lambda m: {"fight": True}),
    (r"^ammunition and hull",               lambda m: {"shell": 12, "hull": 6}),
    (r"^ammunition$",                       lambda m: {"shell": 10}),
    (r"^that battery's ammunition",         lambda m: {"special": "battery_ammunition"}),
    (r"^shells or a depth charge",          lambda m: {"shell": 4}),
    (r"^shells or a torpedo",               lambda m: {"shell": 6}),
    (r"^shells",                            lambda m: {"shell": 5}),
    (r"^depth charges",                     lambda m: {"depth": 4}),
    (r"^your depth-charge stock",           lambda m: {"special": "all_depth_charges"}),
    (r"^smoke stores",                      lambda m: {"smoke": 2}),
    (r"^flares",                            lambda m: {"flares": 1}),
    (r"^a flare or a transmission",         lambda m: {"flares": 1, "emissions": 1}),

    (r"^(a |a radio )?transmission",        lambda m: {"emissions": 1}),
    (r"^an active ping if ordered",         lambda m: {"emissions": 1}),
    (r"^emissions stopped",                 lambda m: {}),
    (r"^emissions",                         lambda m: {"emissions": 1}),

    (r"^cargo space",                       lambda m: {"cargo": 1}),
    (r"^cargo$",                            lambda m: {"cargo": 1}),
    (r"^the accommodation slot frees",      lambda m: {"accommodation": -1}),
    (r"^(the )?accommodation( slot)?",      lambda m: {"accommodation": 1}),
    (r"^the slot$",                         lambda m: {"accommodation": 1}),
    (r"^(their|his) rations",               lambda m: {"rations": 2}),
    (r"^medical supplies",                  lambda m: {"medical": 2}),
    (r"^(half your|your) parts",            lambda m: {"special": "parts_share"}),
    (r"^parts$",                            lambda m: {"parts": 2}),
    (r"^the spare radio",                   lambda m: {"module": "spare_radio"}),
    (r"^one module slot freed",             lambda m: {}),

    (r"^morale$",                           lambda m: {"morale": -3}),
    (r"^(reputation|standing|some standing)", lambda m: {"standing": -5}),
    (r"^stability",                         lambda m: {"stability": -10}),
    (r"^hull damage from the scraping",     lambda m: {"hull": 6}),
    (r"^possible stern damage",             lambda m: {"hull": 4}),
    (r"^water into a stern compartment",    lambda m: {"stability": -12}),
    (r"^plus water to pump",                lambda m: {"stability": -8, "hours": 1}),
    (r"^condition$",                        lambda m: {"systemWear": 0.08}),
    (r"^that compartment's systems",        lambda m: {"systemWear": 0.15}),
    (r"^a skill reset on that team",        lambda m: {"teamHealth": -5}),
    (r"^emergency capacity",                lambda m: {"parts": 1}),
    (r"^range$",                            lambda m: {"special": "clean_reserve_only"}),
    (r"^(a share of actual stock|a share of the cargo|stores of your choosing|over the side)",
                                            lambda m: {"special": "stores_share"}),
    (r"^some survivors",                    lambda m: {}),
    (r"^hours stopped$",                    lambda m: {"hours": 2, "speedOrder": "stop"}),
    (r"^(time|hours)$",                     lambda m: {"hours": 2}),
    (r"^(nothing now|nothing)$",            lambda m: {}),
    (r"^speed order (flank|slow|stop)",     lambda m: {"speedOrder": lambda_group(1)}),
    (r"^(a readiness delay on departure|readiness)", lambda m: {"readinessDelay": True}),
    (r"^less of each",                      lambda m: {"yieldScale": 0.6}),
    (r"^or forever",                        lambda m: {}),
    (r"^a real chance it detonates alongside", lambda m: {"gambleHull": 18}),
    (r"^exposure to shore threats",         lambda m: {"threat": 5}),
    (r"^the withdrawal meter's exposure",   lambda m: {"hull": 4}),
    (r"^search time",                       lambda m: {"hours": 3}),
    (r"^operator effort",                   lambda m: {}),
    (r"^power$",                            lambda m: {}),
    (r"^the contact you were tracking",     lambda m: {}),
    (r"^a thin watch bill",                 lambda m: {}),
]


def lambda_group(i):
    # placeholder replaced below; speedOrder needs the captured word
    return None


def apply_phrase(phrase, spend, notes):
    low = phrase.strip()
    if not low:
        return True
    for pattern, fn in PHRASES:
        m = re.match(pattern, low, re.I)
        if not m:
            continue
        add = fn(m)
        if add is None:
            add = {}
        if "speedOrder" in add and add["speedOrder"] is None:
            add["speedOrder"] = m.group(1).lower()
        for k, v in add.items():
            if k == "special":
                spend.setdefault("special", []).append(v)
            elif k in ("fight", "readinessDelay"):
                spend[k] = True
            elif k in ("speedOrder", "module", "yieldScale", "gambleHull"):
                spend[k] = v
            else:
                spend[k] = spend.get(k, 0) + v
        notes.append(low)
        return True
    return False


LEAVE = re.compile(
    r"^(leave|pass|decline|refuse|ignore|steer|stand off|carry on|press on|hold "
    r"course|hold station|hold the|write them off|stay silent|note it|keep |run |"
    r"wait|watch it|avoid|skirt|go the long way|clear the area|turn back|"
    r"accept the (stability )?loss|limp on|do nothing)",
    re.I,
)

YIELD_BY_FAMILY = {
    "salvage": "salvage",
    "rescue": "crew",
    "decision": "standing",
    "hazard": "none",
    "quiet": "none",
    "combat": "none",
}

GATES = [
    (r"compatible calibre",        {"module": "compatible_shells"}),
    (r"storage room",              {"cargo": 1}),
    (r"radar tier 2",              {"module": "radar_2"}),
    (r"sonar tier 2",              {"module": "sonar_2"}),
    (r"AA tier 2",                 {"module": "aa_2"}),
    (r"sea boat|serviceable boat", {"module": "sea_boat"}),
    (r"workshop",                  {"module": "workshop"}),
    (r"diver|grapnel",             {"module": "diver"}),
    (r"specialist team",           {"module": "specialist_team"}),
    (r"torpedo tubes",             {"module": "torpedo_tubes"}),
    (r"boarding party",            {"module": "boarding_party"}),
    (r"spare radio",               {"module": "spare_radio"}),
    (r"empty active slot",         {"teamSlot": 1}),
    (r"accommodation slot",        {"accommodation": 1}),
    (r"more than one active team|spare team", {"teams": 2}),
    (r"medical ≥ (\d+)",           None),
    (r"parts ≥ (\d+)",             None),
]


def parse_gate(text):
    inner = text.strip("*()")
    # The catalog distinguishes a requirement from a hint: "(needs a sea boat)"
    # gates the option, "(smoke gear helps)" does not. A hint that disabled the
    # option would be a gate the author did not write.
    if re.search(r"\bhelps?\b", inner, re.I):
        return {}, inner
    inner = re.sub(r"^needs\s+", "", inner, flags=re.I)
    req = {}
    m = re.search(r"medical ≥ (\d+)", text)
    if m:
        req.setdefault("stock", {})["medical"] = int(m.group(1))
    m = re.search(r"parts ≥ (\d+)", text)
    if m:
        req.setdefault("stock", {})["parts"] = int(m.group(1))
    for pattern, mapped in GATES:
        if mapped and re.search(pattern, text, re.I):
            req.update(mapped)
    if not req:
        req["unmodelled"] = inner
    return req, inner


def slug(label):
    s = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
    return s[:32]


def main():
    text = CATALOG.read_text(encoding="utf-8")
    events = []
    current = None
    unmapped = []

    for lineno, line in enumerate(text.splitlines(), 1):
        m = EVENT_RE.match(line)
        if m:
            eid, title = m.group(1), m.group(2)
            current = {"id": eid, "title": title, "options": [], "line": lineno}
            events.append(current)
            continue
        if current is None:
            continue

        metas = META_RE.findall(line)
        if metas and not line.startswith("-"):
            for key, val in metas:
                key = key.strip()
                val = val.strip()
                if key == "family":
                    current["family"] = val
                elif key == "shape":
                    current["shape"] = val
                elif key == "sectors":
                    lo, hi = val.split("-")
                    current["sectors"] = [int(lo), int(hi)]
                elif key == "slots":
                    current["slots"] = [] if val == "—" else [s.strip() for s in val.split(",")]
                elif key == "requires flag":
                    current["requiresFlag"] = val
                elif key == "arrival effect":
                    current["arrivalEffect"] = val
                elif key == "requires":
                    current["requiresModule"] = val.replace(" fit", "").strip()
                elif key in ("navy", "taxes", "tasking", "engages", "on trigger", "on accept"):
                    current.setdefault("meta", {})[key] = val
            continue

        m = OPTION_RE.match(line)
        if not m:
            continue
        label = m.group("label").strip()
        body = m.group("body")
        if not body.lower().startswith("spends:"):
            continue
        clause = body[len("spends:"):].strip()

        spend = {}
        notes = []
        for phrase in clause.split(","):
            if not apply_phrase(phrase, spend, notes):
                unmapped.append(f"{current['id']} · {label}: {phrase.strip()!r}")

        option = {"id": slug(label), "label": label}
        if m.group("gate"):
            req, inner = parse_gate(m.group("gate"))
            option["requires"] = req
            option["gateText"] = inner
        else:
            option["requires"] = {}

        fight = spend.pop("fight", False)
        speed = spend.pop("speedOrder", None)
        module = spend.pop("module", None)
        readiness = spend.pop("readinessDelay", False)
        yield_scale = spend.pop("yieldScale", None)
        gamble = spend.pop("gambleHull", None)
        team_health = spend.pop("teamHealth", None)
        wear = spend.pop("systemWear", None)
        special = spend.pop("special", None)

        option["spend"] = spend
        if special:
            option["special"] = special
        if speed:
            option["speedOrder"] = speed
        if module:
            option["spendModule"] = module
        if readiness:
            option["readinessDelay"] = True
        if gamble:
            option["gambleHull"] = gamble
        if team_health:
            option["teamHealth"] = team_health
        if wear:
            option["systemWear"] = wear
        if fight:
            option["leadsToFight"] = True
        if yield_scale:
            option["yieldScale"] = yield_scale

        family = current.get("family", "quiet")
        shape = current.get("shape", "")
        if LEAVE.match(label) or (not spend and not fight and not special):
            option["yields"] = "none"
        elif shape == "information":
            # The decision shape names the payout more precisely than the
            # family does: EVT-12 is a salvage-family event that pays in a
            # revealed route, not in stores.
            option["yields"] = "information"
        elif shape == "standing":
            option["yields"] = "standing"
        else:
            option["yields"] = YIELD_BY_FAMILY.get(family, "none")
        current["options"].append(option)

    if unmapped:
        print("unmapped spend phrases:", file=sys.stderr)
        for u in unmapped:
            print("  " + u, file=sys.stderr)
        return 1

    kept = [e for e in events if e["id"].startswith("EVT")]
    for e in kept:
        e.pop("line", None)
        e.pop("meta", None)
        e.setdefault("slots", [])
        e.setdefault("sectors", [1, 6])

    skipped = [e["id"] for e in events if not e["id"].startswith("EVT")]
    payload = {
        "_generated_by": "scripts/build-events.py from flow/CATALOG-EVENTS.md. Do not edit by hand.",
        "_magnitudes": "STUB OPEN-E1: every number here comes from the phrase table in "
                       "scripts/build-events.py, not from the catalog and not from research.",
        "_skipped": f"Faction missions not in the first playable (BUILD.md section 9): {', '.join(skipped)}",
        "events": kept,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    total = sum(len(e["options"]) for e in kept)
    print(f"ok   {len(kept)} events, {total} options -> {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
