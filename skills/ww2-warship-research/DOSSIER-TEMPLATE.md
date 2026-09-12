# Dossier template

One folder per class at `warships/<nation>/<class-slug>/`. Nation slugs: `united-states`, `united-kingdom`, `japan`, `germany`, `italy`, `france`, `soviet-union`, and the country name in lowercase kebab-case for any other. Class slug is the class name in lowercase kebab-case with the type appended when the name alone is ambiguous: `iowa-class`, `king-george-v-class`, `yamato-class`, `bismarck-class`.

## File set

| File | Holds |
|---|---|
| `meta.json` | Machine-readable identity the index is built from. Schema under "meta.json" below. |
| `README.md` | Class overview: type, nation, ships in class with hull numbers and dates, design lineage, what makes the class distinct, and a facet-by-facet status table (covered / gap / not yet researched). |
| `01-hull-and-armor.md` | Hull form and dimensions; displacement by condition; armor scheme with thickness, material, and inclination per element; torpedo defense system; stability and metacentric height; weight breakdown by group (hull, armor, machinery, armament, fuel, stores) when a source gives one. |
| `02-propulsion-and-power.md` | Boilers (count, maker, type, pressure, temperature); turbines (maker, type, rated shaft horsepower); reduction gears; shafts and propellers; designed and trial speeds; electrical plant (generator count, type, kW, voltage); steering gear; distilling plant; fuel type, bunkerage, endurance at stated speeds; underway replenishment arrangements. |
| `03-armament-and-ammunition.md` | Each battery in turn (main, secondary, anti-aircraft by date, torpedoes, aircraft): gun model, mount or turret design, elevation and train limits and rates, rate of fire, projectiles with weights, propellant charges. The loading cycle step by step from magazine to breech, naming each hoist, flat, and interlock. Magazine and shell-room layout and stowage counts. |
| `04-sensors-fire-control-and-communications.md` | Directors and rangefinders; fire-control computers and stable elements; plotting rooms; radar sets by date with function; sonar or its documented absence; radio equipment; antenna arrangement; IFF; combat information center or equivalent. |
| `05-compartments-and-deck-plans.md` | Deck naming and numbering convention; watertight subdivision (bulkhead count, compartment numbering system); principal spaces by deck as listed in the general plans; location of magazines, machinery spaces, plot, CIC, sick bay, galleys, berthing, stores; superstructure levels and what each holds. |
| `06-crew-and-daily-life.md` | Complement by date, split officers and enlisted; berthing arrangements and bunk types; messing system, galleys, bakery, ice cream plant if any; ration scale and documented menus; fresh water allowance; laundry, barber, ship's store, post office, sick bay capacity, chapel; watch bill and daily routine. |
| `07-operations-and-doctrine.md` | Watch system; general quarters and battle stations organization; gunnery procedure from target detection to salvo; damage control organization and repair parties; shore bombardment procedure; fleet doctrine documents that governed the ship; underway refueling procedure. |
| `08-service-history.md` | Timeline only: laid down, launched, commissioned, campaigns, damage taken, refits, fate. Kept short. |
| `ships/<ship-slug>.md` | Only where a ship in the class differed from the class baseline, or where a ship-specific document (a war diary, a damage report, a general plans booklet) was found. |
| `sources.md` | Numbered `S1..Sn`. Each entry: title, author or institution, publisher or site, date, URL, tier (1 to 3), access date, and any page range used. |
| `gaps.md` | One entry per sub-facet with no source: the sub-facet, the queries run, the registry sources checked, the date. |
| `images/` | Downloaded plans, photographs, diagrams. |
| `images/CREDITS.md` | One row per file: filename, description, source URL, collection or photographer, license, original caption. |

## meta.json

```json
{
  "class": "Iowa class",
  "type": "battleship",
  "ships": [
    {"name": "Iowa", "hull": "BB-61", "aliases": [], "file": "ships/iowa-bb-61.md"}
  ],
  "weapons": [
    {"designation": "16-inch/50 Mark 7", "role": "main battery", "file": "03-armament-and-ammunition.md", "anchor": "main-battery-16-inch50-mark-7"}
  ]
}
```

`ships[].aliases` holds renamings and pre-war names (Littorio became Italia; Marat was Petropavlovsk). `weapons[].anchor` is the GitHub anchor of the heading in the named file (lowercase, punctuation removed, spaces to hyphens); leave it out if the file has no matching heading. Every gun, mount, torpedo, or aircraft type with its own heading in facet 03 gets a row.

## Section skeleton inside each facet file

```markdown
# <Class> class: <facet title>

Status: covered | partial (see gaps.md) | gap

## <sub-facet>

<prose and tables, every claim cited [Sn]>

## Conflicts between sources

<each disagreement, both values, both citations; or "None found">

## Gaps

<sub-facets with no source, pointer to gaps.md; or "None">
```

## Citation form

- Inline: `[S3]`, `[S3, p. 45]`, `[S3, sheet 4]`, `[S3, §2.1]`.
- A table gets a citation in its caption line above it or a `Source` column.
- A paragraph drawn wholly from one source may carry one citation at its end.

## Bibliographic lines

A line that carries a number but makes no claim about a ship (naming the report a facet rests on, pointing at another facet) ends with `<!-- no-claim -->`. `scripts/verify.py` skips those lines and prints how many each class uses, so a reviewer can audit them. A line stating a fact about a ship gets a citation, never this marker.

## Numbers

State the unit the source used first. Convert in parentheses. Label the condition: `(as designed, 1938)`, `(as built, 1943)`, `(1945 refit)`, `(source undated)`.

## Image filenames

`<class-slug>-<subject>-<year-or-source-id>.<ext>`, for example `iowa-class-general-plans-inboard-profile-1944.jpg`.
