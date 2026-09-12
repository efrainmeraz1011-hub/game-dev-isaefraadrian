# WWII warship dossiers

Source-cited reference on WWII warships for game design. Each class has a folder under its nation with the file set defined in `../skills/ww2-warship-research/DOSSIER-TEMPLATE.md`. Every fact carries a citation to that folder's `sources.md`; every facet with no source is listed in its `gaps.md`.

To add or extend a dossier, follow `../skills/ww2-warship-research/SKILL.md`.

## How to read a dossier

1. Start at the class `README.md` for the ships, dates, and the facet status table.
2. Open the numbered facet file you need. Facet numbers are fixed across every dossier:
   - 01 hull and armor
   - 02 propulsion and power (boilers, turbines, electrical plant, fuel, endurance)
   - 03 armament and ammunition (guns, turrets, the loading cycle, magazines)
   - 04 sensors, fire control, and communications
   - 05 compartments and deck plans
   - 06 crew and daily life (complement, berthing, messing, rations)
   - 07 operations and doctrine
   - 08 service history
3. Resolve any `[Sn]` in `sources.md`. Check `gaps.md` before assuming something was overlooked.
4. Images and their licenses are in `images/CREDITS.md`.

## Nations

- [United States](united-states/README.md)
- [United Kingdom](united-kingdom/README.md)
- [Japan](japan/README.md)
- [Germany](germany/README.md)
- [Italy](italy/README.md)
- [France](france/README.md)
- [Other navies holding battleships](other-navies.md)

## Coverage

Every dossier below passes `python3 scripts/verify.py`: each numbered claim carries a citation, every citation resolves, and every unsourced sub-facet sits in that class's `gaps.md`.

| Nation | Class | Ships | Facets | Gaps | Sources | Images | Updated |
|---|---|---|---|---|---|---|---|
| France | [Richelieu class](france/richelieu-class/README.md) | Richelieu, Jean Bart, Clemenceau, Gascogne | 8/8 | [10 recorded](france/richelieu-class/gaps.md) | 50 | 0 | 2026-09-12 |
| Germany | [Bismarck class](germany/bismarck-class/README.md) | Bismarck, Tirpitz | 8/8 | [33 recorded](germany/bismarck-class/gaps.md) | 38 | 0 | 2026-09-12 |
| Italy | [Littorio class](italy/littorio-class/README.md) | Littorio, Vittorio Veneto, Roma, Impero | 8/8 | [14 recorded](italy/littorio-class/gaps.md) | 34 | 7 | 2026-09-12 |
| Japan | [Yamato class](japan/yamato-class/README.md) | Yamato, Musashi, Shinano, No. 111 | 8/8 | [30 recorded](japan/yamato-class/gaps.md) | 37 | 14 | 2026-09-12 |
| United Kingdom | [King George V class](united-kingdom/king-george-v-class/README.md) | King George V, Prince of Wales, Duke of York, Anson, Howe | 8/8 | [10 recorded](united-kingdom/king-george-v-class/gaps.md) | 63 | 0 | 2026-09-12 |
| United States | [Iowa class](united-states/iowa-class/README.md) | Iowa, New Jersey, Missouri, Wisconsin, Illinois, Kentucky | 8/8 | [61 recorded](united-states/iowa-class/gaps.md) | 193 | 16 | 2026-09-12 |

Classes listed in a nation README without a dossier link are not yet researched. Ask for one by name and the skill builds it.
