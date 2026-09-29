# ROZWÓJ 1.0 — MAPA ŹRÓDEŁ

Config źródłowy: `2026_09_02_09_08`

## Pety
- `PetUpgradeLibrary.json` — bazowe Damage / Health per rarity
- `EggLibrary.json` — HatchTime
- `AscensionConfigsLibrary.json` — A1/A2/A3 multipliers
- `ManualSpriteMapping.json` + `Pets/MegaPets/UltraPets/ApexPets.png` — grafiki

## Mounty
- `MountUpgradeLibrary.json` — bazowe Damage / Health
- `MountSummonConfig.json` — summon system
- `AscensionConfigsLibrary.json`
- `ManualSpriteMapping.json` + MountIcons sheets

## Skille
- `SkillPassiveLibrary.json` — pasywne Damage / Health za posiadanie skilla
- `SkillLibrary.json` — cooldown, duration, active Damage / Health
- `AscensionConfigsLibrary.json`
- `ManualSpriteMapping.json` + SkillIcons sheets

## Itemy
- `ItemBalancingLibrary.json` — bazowe staty Age/Tier
- dominująca wartość per Age jest użyta jako reprezentatywna wartość tieru,
  żeby nie mieszać wyjątkowych/hybrydowych wariantów itemów
- lokalne `*AgeItems.png` — grafiki

## Tech Tree
- `PlayerTechTreePositionLibrary.json` — kolejność i prerequisites
- `PlayerTechTreeNodeValuesLibrary.json` — aktualne wartości 1/5 → 5/5
- `PlayerTechTreeTierLibrary.json` — aktualny koszt i czas
- rekomendacje kolejności: przesłany `Tech Tree Guide.txt`
- jeżeli tekst poradnika i config różnią się, liczba na stronie pochodzi z configu

## Ascension
- `AscensionConfigsLibrary.json` — mnożniki mocy ×50 / ×2500 / ×125000
- koszty / recovery targets: oficjalny Discord Comprehensive Ascension Guide dostarczony przez użytkownika
- wykres używa prawdziwych raw statów i NIE wymusza, aby recovery rarity leżało dokładnie na starej mocy

## Koszty kuźni i progi tierów
- Koszty i czasy: ForgeData.png dostarczony przez użytkownika.
- Pierwszy poziom z co najmniej 4% szans na tier: https://github.com/1vcian/fm/blob/main/public/parsed_configs/2026_09_02_09_08/ItemAgeDropChancesLibrary.json
- Level w konfiguracji jest liczony od 0; Forge w interfejsie od 1.
- Tooltip sumuje ulepszenia od Forge 1 w bieżącym cyklu do pierwszego poziomu z co najmniej 4% szans na tier; Primitive od Forge 1 ma 100%; nie sumuje wcześniejszych cykli ani opłat Ascension.

## Koszty skilli
- SkillTickets.webp dostarczony przez użytkownika: Legendary 49 600, Ultimate 142 000, Mythic 269 600 Skill Tickets przed discount, próg 2%.
- Poziomy 24 / 45 / 74: https://github.com/1vcian/fm/blob/main/public/parsed_configs/2026_09_02_09_08/SkillSummonConfig.json (indeks + 1).
- Koszty z tego configu są o 4 320 niższe od arkusza. Kalkulator używa kwot z arkusza użytkownika; nie miesza ich z kosztami configu.

- Uzupełnienie: s1.png, s2.png, s3.png użytkownika, Skill Summon Cost and Summon Probabilities. Koszt w wierszu LvN dotyczy przejścia N → N+1. Sumowanie wierszy przed poziomem docelowym daje Common Lv1: 0 (100%), Rare Lv6: 1 200 (2%), Epic Lv14: 9 200 (2%). Potwierdza też sumy 49 600 / 142 000 / 269 600 dla wyższych rarity. Tabele użytkownika mają 2/4/6/... przywołań od Lv1; config ma 2/2/4/... — stąd wcześniejsza różnica.

## Koszty petów
- Eggshells.png użytkownika: Legendary 48 600, Ultimate 90 000, Mythic 147 500 Eggshells; nagłówek wskazuje około 7% szans na rarity (poradnik Legendary podaje 7,2%).
- Koszt po bonusie = baza / (1 + extra drop chance / 100), zaokrąglony do najbliższej liczby całkowitej, zgodnie z tabelą. Są to szacowane koszty dzięki dodatkowemu dropowi.
- Brak kosztów niższych rarity i poziomów Ultimate/Mythic w przesłanym arkuszu; nie dopisujemy niepotwierdzonych wartości.

- Uzupełnienie p1.png/p2.png/p3.png: koszty w wierszu LvN prowadzą do LvN+1. Sumy do poziomów: Common Lv1 0 (100%), Rare Lv6 1 400 (10%, pierwszy próg >=7%), Epic Lv13 5 400 (7,2%), Legendary Lv37 48 600 (7,2%), Ultimate Lv55 90 000 (7,2%), Mythic Lv80 147 500 (7,2%). Pełne tabele uzupełniają wcześniejsze brakujące poziomy i niższe rarity.

## Koszty mountów
- Clockwinders.png użytkownika: Epic 30 000, Legendary 46 000, Ultimate 63 000, Mythic 79 000 Clockwinders przy około 7% szans na rarity.
- Koszt = baza × (1 − discount/100) / (1 + extra drop chance/100), zaokrąglony do najbliższej liczby całkowitej. Oba bonusy są niezależne, tabela ilustruje wybrane pary.
- Arkusz nie podaje kosztów Common/Rare ani poziomów docelowych; nie dodajemy niepotwierdzonych danych.

- Uzupełnienie m1.png/m2.png/m3.png: każde przejście LvN → LvN+1 kosztuje 1 000 Clockwinders. Docelowe poziomy i sumy: Common Lv1 0 (100%), Rare Lv15 14 000 (9,9%, pierwszy próg >=7%), Epic Lv31 30 000 (7,2%), Legendary Lv47 46 000 (7,2%), Ultimate Lv64 63 000 (7,2%), Mythic Lv80 79 000 (7,2%). Pełne tabele uzupełniają wcześniej brakujące dane.

## Rotacja ilustracji kart
- visual-variants.js: lokalne przypisanie wszystkich ikon petów, mountów i skilli do rarity, z ManualSpriteMapping.json oraz SkillLibrary.json (2026_09_02_09_08) w repo 1vcian/fm.
- Przedmioty: item-variants.js zawiera 144 ręcznie sprawdzone prostokąty we wszystkich dziesięciu atlasach. Wyświetlane przez SVG z clipPath; bez edycji źródłowych grafik. Pominięto jednokolorowe maski efektów (Space, Interstellar, Multiverse, Underworld, Divine), które nie przedstawiają samodzielnych przedmiotów.
- Zmiana co 4 s, przenikanie 720 ms, przesunięcie fazy między kartami. Rotacja dotyczy wyłącznie ilustracji, nie statystyk. Pauza zapisywana lokalnie; ograniczenie ruchu i niewidoczne karty zatrzymują animacje.

- Pełny zestaw ikon: 25 petów, 15 mountów i 18 skilli na każdy etap A0–A3. Strzałki kart pozwalają obejrzeć cały zestaw także przy ograniczeniu ruchu. Ręczny wybór zatrzymuje daną kartę; ponowne włączenie rotacji usuwa ręczne wybory. Test: tests/artwork.cjs.

- Progi 4% przedmiotów: Medieval 4, Early-Modern 7, Modern 11, Space 15, Interstellar 19, Multiverse 22, Quantum 25, Underworld 30, Divine 35. Koszty i czasy sumowane do tych poziomów na obu wykresach.
