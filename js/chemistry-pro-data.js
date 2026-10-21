/**
 * Periodic Lab PRO v2.0 — Chemistry Intelligence, Trends, Formula Parser,
 * JEE/NEET Quiz Generator & Persistent Gamification Engine
 */
(function () {
  'use strict';

  // Verified Empirical/Calculated Atomic Radii (in picometers, Z = 1..118, index 0 = placeholder)
  const RADIUS_PM = [
    null,
    53, 31,
    167, 112, 87, 67, 56, 48, 42, 38,
    190, 145, 118, 111, 98, 88, 79, 71,
    243, 194, 184, 176, 171, 166, 161, 156, 152, 149, 145, 142, 136, 125, 114, 103, 94, 88,
    265, 219, 212, 206, 198, 190, 183, 178, 173, 169, 165, 161, 156, 145, 133, 123, 115, 108,
    298, 253,
    195, 185, 247, 206, 205, 238, 231, 233, 225, 228, 226, 226, 222, 222, 217,
    208, 200, 193, 188, 185, 180, 177, 174, 171, 156, 154, 143, 135, 127, 120,
    348, 283,
    195, 180, 180, 175, 175, 175, 175, 176, 170, 170, 170, 170, 170, 170, 171,
    150, 149, 143, 141, 134, 129, 128, 121, 122, 136, 143, 162, 175, 165, 157
  ];

  // Verified NIST 1st Ionization Energies (in kJ/mol, Z = 1..118)
  const IONIZATION_KJ = [
    null,
    1312, 2372,
    520, 900, 801, 1086, 1402, 1314, 1681, 2081,
    496, 738, 578, 786, 1012, 1000, 1251, 1521,
    419, 590, 633, 659, 651, 653, 717, 762, 760, 737, 745, 906, 579, 762, 947, 941, 1140, 1351,
    403, 550, 600, 640, 652, 684, 702, 710, 720, 804, 731, 868, 558, 709, 834, 869, 1008, 1170,
    376, 503,
    538, 534, 527, 533, 536, 545, 547, 593, 566, 573, 581, 589, 597, 603, 524,
    659, 761, 770, 760, 840, 880, 870, 890, 1007, 589, 716, 703, 812, 890, 1037,
    380, 509,
    499, 587, 568, 598, 605, 585, 578, 581, 601, 608, 619, 627, 635, 642, 470,
    580, 665, 757, 740, 730, 800, 960, 1150, 1155, 705, 824, 540, 720, 743, 860
  ];

  // Key Oxidation States highlights
  const OXIDATION_MAP = {
    1: '-1, +1', 2: '0 (Inert)', 3: '+1', 4: '+2', 5: '+3', 6: '-4, +2, +4',
    7: '-3, +3, +5', 8: '-2 (OF₂: +2)', 9: '-1 ONLY!', 10: '0 (Inert)',
    11: '+1', 12: '+2', 13: '+3', 14: '-4, +2, +4', 15: '-3, +3, +5',
    16: '-2, +4, +6', 17: '-1, +1, +3, +5, +7', 18: '0',
    19: '+1', 20: '+2', 21: '+3 (Only!)', 22: '+2, +3, +4', 23: '+2, +3, +4, +5',
    24: '+2, +3, +6', 25: '+2, +4, +7 (Max in 3d!)', 26: '+2, +3', 27: '+2, +3',
    28: '+2', 29: '+1, +2', 30: '+2 (Only!)', 35: '-1, +1, +3, +5', 36: '0, +2',
    47: '+1', 50: '+2, +4', 53: '-1, +1, +5, +7', 54: '0, +2, +4, +6, +8',
    57: '+3', 58: '+3, +4', 63: '+2, +3', 64: '+3', 70: '+2, +3',
    74: '+4, +6', 76: '+4, +8 (Highest!)', 78: '+2, +4', 79: '+1, +3',
    80: '+1, +2', 82: '+2 (Inert Pair!), +4', 83: '+3 (Inert Pair!), +5', 92: '+3, +4, +5, +6'
  };

  // Famous Latin Names (huge exam favorite!)
  const LATIN_ORIGINS = [
    { z: 11, sym: 'Na', name: 'Sodium', latin: 'Natrium' },
    { z: 19, sym: 'K', name: 'Potassium', latin: 'Kalium' },
    { z: 26, sym: 'Fe', name: 'Iron', latin: 'Ferrum' },
    { z: 29, sym: 'Cu', name: 'Copper', latin: 'Cuprum' },
    { z: 47, sym: 'Ag', name: 'Silver', latin: 'Argentum' },
    { z: 50, sym: 'Sn', name: 'Tin', latin: 'Stannum' },
    { z: 51, sym: 'Sb', name: 'Antimony', latin: 'Stibium' },
    { z: 74, sym: 'W', name: 'Tungsten', latin: 'Wolfram' },
    { z: 79, sym: 'Au', name: 'Gold', latin: 'Aurum' },
    { z: 80, sym: 'Hg', name: 'Mercury', latin: 'Hydrargyrum' },
    { z: 82, sym: 'Pb', name: 'Lead', latin: 'Plumbum' }
  ];

  // 28 High-Yield NCERT / JEE / NEET Named Compounds Library
  const FAMOUS_COMPOUNDS = [
    {
      name: 'Sulphuric Acid (King of Chemicals)',
      formula: 'H2SO4',
      tag: 'Industrial',
      state: 'Oily Colourless Liquid',
      note: 'Contact Process (V₂O₅ catalyst) se banta hai; car batteries, fertilizers aur dehydrating agent mein sabse important acid!'
    },
    {
      name: 'Blue Vitriol (Neela Thotha)',
      formula: 'CuSO4.5H2O',
      tag: 'Hydrate Salt',
      state: 'Bright Blue Crystalline Solid',
      note: '4 water molecules Cu²⁺ se coordinate hote hain aur 1 water molecule H-bonded! Garam karne par white anhydrous CuSO₄ banta hai.'
    },
    {
      name: 'Green Vitriol (Hara Kasis)',
      formula: 'FeSO4.7H2O',
      tag: 'Hydrate Salt',
      state: 'Pale Blue-Green Crystals',
      note: 'Thermal decomposition par Fe₂O₃ + SO₂ + SO₃ deta hai (NCERT Class 10 & JEE classic reaction!).'
    },
    {
      name: 'Plaster of Paris (POP)',
      formula: 'CaSO4.0.5H2O',
      tag: 'Everyday',
      state: 'White Powder',
      note: 'Gypsum (CaSO₄·2H₂O) ko 373 K (100°C) par heat karne se banta hai; टूटी हड्डियों ke plaster aur statues mein use hota hai.'
    },
    {
      name: 'Gypsum',
      formula: 'CaSO4.2H2O',
      tag: 'Everyday',
      state: 'White Monoclinic Solid',
      note: 'Portland cement mein setting time slow karne ke liye milaya jaata hai.'
    },
    {
      name: 'Washing Soda',
      formula: 'Na2CO3.10H2O',
      tag: 'Everyday',
      state: 'White Crystalline Solid',
      note: 'Solvay Process se banta hai; water ki permanent hardness hatane aur glass/soap making mein kaam aata hai.'
    },
    {
      name: 'Baking Soda',
      formula: 'NaHCO3',
      tag: 'Everyday',
      state: 'White Powder (Mild Alkaline)',
      note: 'Cakes ko fluffy banata hai (CO₂ gas release hoti hai), antacid aur soda-acid fire extinguisher mein use hota hai.'
    },
    {
      name: 'Bleaching Powder',
      formula: 'CaOCl2',
      tag: 'Industrial',
      state: 'Yellowish-White Powder',
      note: 'Dry slaked lime Ca(OH)₂ par Cl₂ gas pass karne se banta hai; drinking water disinfect karne mein best.'
    },
    {
      name: 'Potassium Permanganate (Lal Dawa)',
      formula: 'KMnO4',
      tag: 'Lab Reagent',
      state: 'Dark Purple Crystals',
      note: 'Mn +7 state mein! Strong self-indicating oxidizing agent; purple colour charge-transfer (L→M) ki wajah se hota hai, d–d nahi!'
    },
    {
      name: 'Potassium Dichromate',
      formula: 'K2Cr2O7',
      tag: 'Lab Reagent',
      state: 'Bright Orange Crystals',
      note: 'Acidic medium mein Cr₂O₇²⁻ (orange) ⇌ basic medium mein CrO₄²⁻ (yellow)! Alcohol breathalyzer test ka reagent.'
    },
    {
      name: 'Mohr’s Salt (Double Salt)',
      formula: '(NH4)2Fe(SO4)2.6H2O',
      tag: 'Lab Reagent',
      state: 'Light Green Crystals',
      note: 'Primary standard redox titration reagent — normal FeSO₄ ki tarah hawa mein jaldi oxidize nahi hota!'
    },
    {
      name: 'Potash Alum (Phitkari)',
      formula: 'K2SO4.Al2(SO4)3.24H2O',
      tag: 'Hydrate Salt',
      state: 'Colourless Octahedral Crystals',
      note: 'Pani saaf karne (coagulation of muddy water) aur antiseptic aftershave mein sadiyon se istemal!'
    },
    {
      name: 'Potassium Ferrocyanide',
      formula: 'K4[Fe(CN)6]',
      tag: 'Coordination',
      state: 'Lemon Yellow Crystals',
      note: 'Coordination complex (Fe²⁺ d⁶ low-spin diamagnetic!); Fe³⁺ ke saath Prussian Blue colour test deta hai.'
    },
    {
      name: 'Cisplatin (Anti-Cancer Drug)',
      formula: '[Pt(NH3)2Cl2]',
      tag: 'Coordination',
      state: 'Yellow-Orange Solid',
      note: 'Square planar DSP² coordination complex — sirf cis-isomer tumors ki DNA replication rokta hai (NCERT Coordination VVIP!).'
    },
    {
      name: 'Laughing Gas (Nitrous Oxide)',
      formula: 'N2O',
      tag: 'Gas & Oxide',
      state: 'Colourless Neutral Gas',
      note: 'Neutral oxide (na acidic na basic, CO aur NO ke saath!); CO₂ ke isoelectronic (22 electrons) aur linear molecule.'
    },
    {
      name: 'Ammonia (Haber Process)',
      formula: 'NH3',
      tag: 'Industrial',
      state: 'Pungent Colourless Gas',
      note: 'Trigonal pyramidal (sp³, 107.8° bond angle); Fe catalyst + Mo promoter par N₂ + 3H₂ ⇌ 2NH₃ se banta hai.'
    },
    {
      name: 'Nitric Acid (Aqua Fortis)',
      formula: 'HNO3',
      tag: 'Industrial',
      state: 'Colourless Fuming Liquid',
      note: 'Ostwald Process (Pt/Rh gauze catalyst) se banta hai; 1 HNO₃ : 3 HCl milakar Aqua Regia बनता hai jo Gold घोल deta hai!'
    },
    {
      name: 'Glucose (Dextrose)',
      formula: 'C6H12O6',
      tag: 'Organic & Bio',
      state: 'Sweet White Solid',
      note: 'Aldohexose monosaccharide — living cells ka instant ATP energy source; exact Molar Mass = 180.156 g/mol!'
    },
    {
      name: 'Urea (Carbamide)',
      formula: 'CH4N2O',
      tag: 'Organic & Bio',
      state: 'White Prills / Solid',
      note: '1828 mein Friedrich Wöhler ne lab mein banaya pehla organic compound; ~46.6% high Nitrogen fertilizer!'
    },
    {
      name: 'Calcium Carbonate (Limestone / Marble)',
      formula: 'CaCO3',
      tag: 'Everyday',
      state: 'White Insoluble Solid',
      note: 'Exact Molar Mass ≈ 100.09 g/mol! Taj Mahal ka संगमरमर, chalk aur pearls sab CaCO₃ hain.'
    },
    {
      name: 'Caustic Soda',
      formula: 'NaOH',
      tag: 'Industrial',
      state: 'Deliquescent White Pellets',
      note: 'Chlor-alkali Castner-Kellner / membrane cell process se Cl₂ aur H₂ ke saath banta hai; Molar Mass = 40.00 g/mol.'
    },
    {
      name: ' Slaked Lime (Limewater)',
      formula: 'Ca(OH)2',
      tag: 'Lab Reagent',
      state: 'White Sparingly Soluble Solid',
      note: 'CO₂ gas pass karne par CaCO₃ banne se milky ho jaata hai; excess CO₂ par Ca(HCO₃)₂ banne se fir clear ho jaata hai!'
    },
    {
      name: 'Aspirin (Acetylsalicylic Acid)',
      formula: 'C9H8O4',
      tag: 'Organic & Bio',
      state: 'White Crystalline Tablet',
      note: 'Non-narcotic analgesic, antipyretic aur blood-thinning anti-platelet medicine.'
    },
    {
      name: 'Xenon Hexafluoroplatinate / XeF4',
      formula: 'XeF4',
      tag: 'Coordination',
      state: 'Colourless Crystalline Solid',
      note: 'Square planar VSEPR classic (sp³d², 4 bond pairs + 2 lone pairs = 0 dipole moment)!'
    }
  ];

  // Parse atomic mass string like "[244]" or "22.990" into clean float
  function numericMass(massStr) {
    if (typeof massStr === 'number') return massStr;
    const cleaned = String(massStr || '').replace(/[\[\]()]/g, '').trim();
    const val = parseFloat(cleaned);
    return Number.isFinite(val) ? val : 0;
  }

  // Full Chemical Formula Parser supporting hydrates (· or .), brackets [] & (), decimals like 0.5H2O
  function parseChemicalFormula(rawInput, elementsList) {
    const cleanInput = String(rawInput || '').trim().replace(/\s+/g, '');
    if (!cleanInput) {
      return { ok: false, error: 'Koi chemical formula type ya select karein (e.g. H2SO4, CuSO4.5H2O, KMnO4).' };
    }

    const bySym = new Map();
    elementsList.forEach((e) => bySym.set(e.symbol, e));

    // Split hydrate / double-salt segments cleanly:
    // Any middle-dot/bullet/*/+ splits segments, and an ASCII '.' splits segments whenever it follows
    // an element/group with optional integer subscript: e.g. CuSO4.5H2O, CaSO4.0.5H2O, (NH4)2Fe(SO4)2.6H2O
    const normalized = cleanInput
      .replace(/[·•*+]/g, '|')
      .replace(/([A-Za-z)\]]\d*)\./g, '$1|');
    const segments = normalized.split('|').filter(Boolean);

    const totalCounts = new Map();

    for (const segRaw of segments) {
      const seg = segRaw.replace(/_/g, '.');
      const coeffMatch = seg.match(/^(\d+(?:\.\d+)?)(.*)$/);
      let segMult = 1;
      let expr = seg;
      if (coeffMatch && coeffMatch[2]) {
        segMult = parseFloat(coeffMatch[1]);
        expr = coeffMatch[2];
      }

      const stack = [new Map()];
      let i = 0;
      while (i < expr.length) {
        const ch = expr[i];
        if (ch === '(' || ch === '[') {
          stack.push(new Map());
          i += 1;
        } else if (ch === ')' || ch === ']') {
          if (stack.length < 2) {
            return { ok: false, error: `Unmatched bracket "${ch}" in formula "${rawInput}".` };
          }
          const popped = stack.pop();
          i += 1;
          const numMatch = expr.slice(i).match(/^(\d+(?:\.\d+)?)/);
          let mult = 1;
          if (numMatch) {
            mult = parseFloat(numMatch[1]);
            i += numMatch[1].length;
          }
          const top = stack[stack.length - 1];
          popped.forEach((cnt, sym) => {
            top.set(sym, (top.get(sym) || 0) + cnt * mult);
          });
        } else if (/[A-Z]/.test(ch)) {
          const elMatch = expr.slice(i).match(/^([A-Z][a-z]{0,2})(\d+(?:\.\d+)?)?/);
          if (!elMatch) {
            return { ok: false, error: `Invalid symbol near "${expr.slice(i)}" in "${rawInput}".` };
          }
          const sym = elMatch[1];
          if (!bySym.has(sym)) {
            return { ok: false, error: `"${sym}" Periodic Table ka valid element symbol nahi hai (Case check karein, e.g. Co vs CO, Na vs NA).` };
          }
          const mult = elMatch[2] ? parseFloat(elMatch[2]) : 1;
          const top = stack[stack.length - 1];
          top.set(sym, (top.get(sym) || 0) + mult);
          i += elMatch[0].length;
        } else {
          return { ok: false, error: `Unexpected character "${ch}" in "${rawInput}".` };
        }
      }

      if (stack.length !== 1) {
        return { ok: false, error: `Open bracket "(" ya "[" close nahi hua hai ("${rawInput}").` };
      }

      stack[0].forEach((cnt, sym) => {
        totalCounts.set(sym, (totalCounts.get(sym) || 0) + cnt * segMult);
      });
    }

    if (totalCounts.size === 0) {
      return { ok: false, error: 'Formula mein koi valid element nahi mila.' };
    }

    let molarMass = 0;
    let totalAtoms = 0;
    const breakdown = [];

    totalCounts.forEach((count, sym) => {
      const el = bySym.get(sym);
      const unitMass = numericMass(el.mass);
      const subMass = unitMass * count;
      molarMass += subMass;
      totalAtoms += count;
      breakdown.push({
        z: el.z,
        symbol: sym,
        name: el.name,
        category: el.category,
        count,
        unitMass,
        subMass,
        percent: 0
      });
    });

    breakdown.forEach((item) => {
      item.percent = molarMass > 0 ? (item.subMass / molarMass) * 100 : 0;
    });
    breakdown.sort((a, b) => b.subMass - a.subMass);

    const matchedFamous = FAMOUS_COMPOUNDS.find(
      (c) => c.formula.toLowerCase() === cleanInput.toLowerCase()
    );

    return {
      ok: true,
      formula: cleanInput,
      molarMass,
      totalAtoms,
      elementTypes: breakdown.length,
      breakdown,
      famous: matchedFamous || null
    };
  }

  // Curated High-Yield JEE / NEET / NCERT Conceptual Questions
  const CURATED_QUESTIONS = [
    {
      cat: 'config',
      q: 'Chromium (Cr, Z = 24) ki ground-state electronic configuration kya hoti hai?',
      opts: ['[Ar] 3d⁵ 4s¹', '[Ar] 3d⁴ 4s²', '[Ar] 3d⁶ 4s⁰', '[Ar] 3d³ 4s²'],
      ans: 0,
      hint: 'Half-filled 3d⁵ subshell extra exchange energy stability deta hai!',
      exp: 'Cr (Z=24) classic exception hai: half-filled 3d⁵ aur 4s¹ symmetrical distribution + high exchange energy ki wajah se [Ar] 3d⁵ 4s¹ zyada stable hoti hai.'
    },
    {
      cat: 'config',
      q: 'Copper (Cu, Z = 29) ki sahi electronic configuration chuniye:',
      opts: ['[Ar] 3d¹⁰ 4s¹', '[Ar] 3d⁹ 4s²', '[Ar] 3d⁸ 4s²', '[Ar] 4s² 4p¹'],
      ans: 0,
      hint: 'Completely filled d¹⁰ subshell!',
      exp: 'Cu (Z=29) mein ek electron 4s se jump karke completely filled 3d¹⁰ subshell banata hai → [Ar] 3d¹⁰ 4s¹.'
    },
    {
      cat: 'config',
      q: '4d transition series mein kis element ke outer 5s orbital mein ZERO electron ([Kr] 4d¹⁰ 5s⁰) hote hain?',
      opts: ['Palladium (Pd, Z=46)', 'Silver (Ag, Z=47)', 'Rhodium (Rh, Z=45)', 'Cadmium (Cd, Z=48)'],
      ans: 0,
      hint: 'Unique d¹⁰ s⁰ configuration in Group 10!',
      exp: 'Palladium (Pd, Z=46) poori Periodic Table ka famous case hai jiski ground state [Kr] 4d¹⁰ (5s⁰) hoti hai!'
    },
    {
      cat: 'config',
      q: 'Gadolinium (Gd, Z = 64 — Lanthanide) ki sahi outer configuration kya hai?',
      opts: ['[Xe] 4f⁷ 5d¹ 6s²', '[Xe] 4f⁸ 6s²', '[Xe] 4f⁶ 5d² 6s²', '[Xe] 4f⁹ 6s¹'],
      ans: 0,
      hint: 'Half-filled 4f⁷ subshell stability!',
      exp: 'Gd (Z=64) mein half-filled 4f⁷ core preserve rakhne ke liye 8va electron 5d¹ mein jaata hai: [Xe] 4f⁷ 5d¹ 6s² (JEE/NEET super favorite!).'
    },
    {
      cat: 'trends',
      q: 'Poori Periodic Table mein SABSE ZYADA Electron Gain Enthalpy (most negative ΔegH) kis element ki hoti hai?',
      opts: ['Chlorine (Cl)', 'Fluorine (F)', 'Oxygen (O)', 'Bromine (Br)'],
      ans: 0,
      hint: 'Electronegativity F ki sabse zyada hai, par Electron Affinity mein 2p inter-electronic repulsion yaad karo!',
      exp: 'TRAP ALERT! Sabse zyada Electronegative Fluorine (3.98) hai, lekin SABSE ZYADA Electron Gain Enthalpy Chlorine (Cl) ki hoti hai kyunki chhote 2p subshell mein electron-electron repulsion zyada hota hai!'
    },
    {
      cat: 'trends',
      q: 'Room temperature (298 K) par Periodic Table mein kaunsa NON-METAL liquid state mein paya jaata hai?',
      opts: ['Bromine (Br)', 'Mercury (Hg)', 'Gallium (Ga)', 'Chlorine (Cl)'],
      ans: 0,
      hint: 'Non-metal pucha hai (Mercury metal hai)!',
      exp: 'Bromine (Br, Z=35) eklauta liquid NON-METAL hai room temperature par, jabki Mercury (Hg, Z=80) liquid METAL hai!'
    },
    {
      cat: 'trends',
      q: 'Hथेली (Palm / ~30 °C) par rakhte hi kaunse do metals pighal (melt ho) jaate hain?',
      opts: ['Gallium (Ga) & Caesium (Cs)', 'Sodium (Na) & Potassium (K)', 'Zinc (Zn) & Tin (Sn)', 'Silver (Ag) & Gold (Au)'],
      ans: 0,
      hint: 'Ga melting point ≈ 302.9 K (29.7 °C) & Cs ≈ 301.6 K!',
      exp: 'Gallium (Ga, 29.8 °C) aur Caesium (Cs, 28.4 °C) ka melting point body temperature (37 °C) se kam hota hai, isliye haath par pighal jaate hain!'
    },
    {
      cat: 'trends',
      q: 'Lithium (Li) Periodic Table mein kis element ke saath Diagonal Relationship dikhata hai?',
      opts: ['Magnesium (Mg)', 'Sodium (Na)', 'Aluminium (Al)', 'Calcium (Ca)'],
      ans: 0,
      hint: 'Period 2 Group 1 ↘ Period 3 Group 2 (similar charge/radius ratio)!',
      exp: 'Li ↔ Mg, Be ↔ Al, aur B ↔ Si similar polarizing power (charge / radius²) ki wajah se Diagonal Relationship dikhate hain!'
    },
    {
      cat: 'trends',
      q: 'Oxygen aur Nitrogen mein First Ionization Enthalpy (IE₁) kiski zyada hoti hai?',
      opts: ['Nitrogen (N > O)', 'Oxygen (O > N)', 'Dono barabar', 'Carbon (C > N)'],
      ans: 0,
      hint: 'N = 2p³ (half-filled stable!) vs O = 2p⁴!',
      exp: 'Nitrogen (1402 kJ/mol) > Oxygen (1314 kJ/mol), kyunki Nitrogen ka half-filled 2p³ orbital extra stable hota hai!'
    },
    {
      cat: 'trends',
      q: '3d Transition series mein HIGHEST oxidation state (+7) kaunsa element show karta hai?',
      opts: ['Manganese (Mn)', 'Chromium (Cr)', 'Iron (Fe)', 'Vanadium (V)'],
      ans: 0,
      hint: 'KMnO₄ mein Mn ki oxidation state nikalo!',
      exp: 'Manganese (Mn, [Ar] 3d⁵ 4s²) saare 7 outer electrons use karke +7 oxidation state (e.g. MnO₄⁻, Mn₂O₇) dikhata hai!'
    },
    {
      cat: 'trends',
      q: 'Poori Periodic Table mein HIGHEST known oxidation state (+8) kaunse elements show karte hain?',
      opts: ['Osmium (Os) & Ruthenium (Ru)', 'Fluorine (F) & Chlorine (Cl)', 'Gold (Au) & Platinum (Pt)', 'Uranium (U) & Thorium (Th)'],
      ans: 0,
      hint: 'OsO₄ aur RuO₄ volatile tetroxides!',
      exp: 'Osmium (OsO₄) aur Ruthenium (RuO₄) Group 8 mein +8 oxidation state dikhate hain!'
    },
    {
      cat: 'group',
      q: 'Atomic Number Z = 114 (Flerovium, Fl) ka official IUPAC systematic temporary naam kya tha?',
      opts: ['Ununquadium (Uuq)', 'Ununbium (Uub)', 'Ununtrium (Uut)', 'Ununhexium (Uuh)'],
      ans: 0,
      hint: '1 = un, 1 = un, 4 = quad + ium!',
      exp: 'IUPAC digit roots: 1 = un, 1 = un, 4 = quad + ium → Ununquadium (Uuq), jo Group 14 (Carbon family) mein aata hai!'
    },
    {
      cat: 'trends',
      q: 'Helium (He, 1s²) mein p-electrons ZERO hote hue bhi ise किस Block mein rakha gaya hai (configuration wise)?',
      opts: ['s-block configuration (placed in Group 18)', 'd-block', 'f-block', 'Group 2 Alkaline Earth'],
      ans: 0,
      hint: 'Electronic configuration 1s² hai par completely filled valence shell ki wajah se Noble Gases ke upar Group 18 mein hai!',
      exp: 'Helium ki configuration 1s² (strictly s-orbital) hai, lekin inert noble gas properties ki wajah se Group 18 ke top par rakha gaya hai.'
    }
  ];

  // Dynamic Question Generator combining Curated Bank + Infinite 118-Element Questions
  function generateQuizQuestion(category, elementsList, mnemonicsApi) {
    const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const effectiveCat =
      category === 'mixed'
        ? rand(['curated', 'atomic', 'config', 'group', 'trends', 'latin'])
        : category;

    if (effectiveCat === 'curated' || (effectiveCat === 'trends' && Math.random() < 0.65) || (effectiveCat === 'config' && Math.random() < 0.45)) {
      const pool = CURATED_QUESTIONS.filter((item) => category === 'mixed' || item.cat === category);
      if (pool.length > 0) {
        const picked = rand(pool);
        const correctText = picked.opts[picked.ans];
        const mixedOpts = shuffle(picked.opts);
        return {
          q: picked.q,
          opts: mixedOpts,
          ans: mixedOpts.indexOf(correctText),
          hint: picked.hint,
          exp: picked.exp
        };
      }
    }

    if (effectiveCat === 'latin' || (effectiveCat === 'atomic' && Math.random() < 0.28)) {
      const item = rand(LATIN_ORIGINS);
      const distractors = shuffle(LATIN_ORIGINS.filter((x) => x.z !== item.z)).slice(0, 3);
      const opts = shuffle([item, ...distractors].map((x) => `${x.name} (${x.sym})`));
      const targetAns = `${item.name} (${item.sym})`;
      return {
        q: `Latin naam "${item.latin}" se Periodic Table ka kaunsa chemical symbol aaya hai?`,
        opts,
        ans: opts.indexOf(targetAns),
        hint: `Atomic Number Z = ${item.z}`,
        exp: `"${item.latin}" Latin naam se ${item.name} ka symbol "${item.sym}" (Z = ${item.z}) rakha gaya hai!`
      };
    }

    if (effectiveCat === 'atomic') {
      const el = rand(elementsList);
      const askSymbol = Math.random() < 0.5;
      const nearby = shuffle(
        elementsList.filter((x) => x.z !== el.z && Math.abs(x.z - el.z) <= 12)
      ).slice(0, 3);
      if (askSymbol) {
        const ansText = `Z = ${el.z} (${el.symbol})`;
        const opts = shuffle([el, ...nearby].map((x) => `Z = ${x.z} (${x.symbol})`));
        const mnem = mnemonicsApi ? mnemonicsApi.getForElement(el.z) : null;
        return {
          q: `"${el.name}" ka sahi Atomic Number (Z) aur Symbol kya hai?`,
          opts,
          ans: opts.indexOf(ansText),
          hint: `Period ${el.period}, ${el.block}-block${mnem ? ` · Trick word: "${mnem.word}"` : ''}`,
          exp: `${el.name} (${el.symbol}) ka Atomic Number Z = ${el.z} hai (${el.categoryLabel}, Period ${el.period}, Group ${el.group}).`
        };
      }
      const ansText = `${el.name} (${el.symbol})`;
      const opts = shuffle([el, ...nearby].map((x) => `${x.name} (${x.symbol})`));
      return {
        q: `Atomic Number Z = ${el.z} Periodic Table mein kis element ka hai?`,
        opts,
        ans: opts.indexOf(ansText),
        hint: `Config: ${el.config} · ${el.categoryLabel}`,
        exp: `Z = ${el.z} element ${el.name} (${el.symbol}) hai — Period ${el.period}, Group ${el.group} (${el.config}).`
      };
    }

    if (effectiveCat === 'config') {
      const pool = elementsList.filter((e) => e.z <= 86);
      const el = rand(pool);
      const distractors = shuffle(
        pool.filter((x) => x.z !== el.z && x.config !== el.config && Math.abs(x.z - el.z) <= 8)
      ).slice(0, 3);
      const ansText = `${el.name} (${el.symbol})`;
      const opts = shuffle([el, ...distractors].map((x) => `${x.name} (${x.symbol})`));
      return {
        q: `Electronic configuration "${el.config}" ground state mein kis neutral atom ki hai?`,
        opts,
        ans: opts.indexOf(ansText),
        hint: `Shells: ${el.shells.join(' · ')} (${el.block}-block)`,
        exp: `${el.config} mein total ${el.z} electrons hain, jo ${el.name} (${el.symbol}, Z = ${el.z}) hai!`
      };
    }

    if (effectiveCat === 'trends') {
      const withEN = elementsList.filter((e) => typeof e.electronegativity === 'number' && e.z <= 56);
      const picked4 = shuffle(withEN).slice(0, 4);
      picked4.sort((a, b) => b.electronegativity - a.electronegativity);
      // Ensure strictly unique top element
      if (picked4[0].electronegativity === picked4[1].electronegativity) {
        return generateQuizQuestion('curated', elementsList, mnemonicsApi);
      }
      const winner = picked4[0];
      const ansText = `${winner.name} (${winner.symbol})`;
      const opts = shuffle(picked4.map((x) => `${x.name} (${x.symbol})`));
      return {
        q: 'In chaaron elements mein SABSE ZYADA Electronegativity (Pauling scale) kiski hai?',
        opts,
        ans: opts.indexOf(ansText),
        hint: 'Across a period Left → Right electronegativity badhti hai aur Group mein Top → Bottom ghat-ti hai!',
        exp: `${picked4.map((x) => `${x.symbol} (${x.electronegativity})`).join(' > ')} — isliye ${winner.name} (${winner.symbol}) sabse zyada electronegative hai!`
      };
    }

    // Group & Period identification
    const mainPool = elementsList.filter((e) => e.gridRow <= 7);
    const el = rand(mainPool);
    const ansText = `Period ${el.period}, Group ${el.group} (${el.block}-block)`;
    const wrongSet = new Set();
    while (wrongSet.size < 3) {
      const p = Math.min(7, Math.max(1, el.period + rand([-1, 0, 1])));
      const g = Math.min(18, Math.max(1, el.group + rand([-2, -1, 1, 2])));
      const blk = g <= 2 ? 's' : g >= 13 ? 'p' : 'd';
      const label = `Period ${p}, Group ${g} (${blk}-block)`;
      if (label !== ansText) wrongSet.add(label);
    }
    const opts = shuffle([ansText, ...Array.from(wrongSet)]);
    const mnem = mnemonicsApi ? mnemonicsApi.getForElement(el.z) : null;
    return {
      q: `${el.name} (${el.symbol}, Z = ${el.z}) Periodic Table mein kahan aata hai?`,
      opts,
      ans: opts.indexOf(ansText),
      hint: `Shells count = Period (${el.shells.length} shells)${mnem ? ` · Trick: "${mnem.word}"` : ''}`,
      exp: `${el.name} (${el.symbol}) mein ${el.shells.length} electron shells (${el.shells.join('-')}) hain → ${ansText}!`
    };
  }

  // Persistent Player Profile, Ranks & 12 Pro Achievements
  const RANKS = [
    { level: 1, xp: 0, title: 'Lab Cadet', icon: '🧪' },
    { level: 2, xp: 150, title: 'Proton Seeker', icon: '⚛️' },
    { level: 3, xp: 380, title: 'Orbital Scout', icon: '🛰️' },
    { level: 4, xp: 700, title: 'Valence Knight', icon: '⚔️' },
    { level: 5, xp: 1150, title: 'd-Block Specialist', icon: '🛡️' },
    { level: 6, xp: 1750, title: 'Quantum Alchemist', icon: '🔮' },
    { level: 7, xp: 2500, title: 'Noble Grandmaster', icon: '👑' },
    { level: 8, xp: 3500, title: 'Mendeleev Legend', icon: '🏆' }
  ];

  const ACHIEVEMENTS = [
    { id: 'first_atom', icon: '🌱', title: 'First Atom Placed', desc: 'Place your first Sahi element on the blank Periodic Table' },
    { id: 'streak_5', icon: '🔥', title: '5x Hot Streak', desc: 'Hit 5 consecutive right placements or quiz answers' },
    { id: 'streak_10', icon: '⚡', title: '10x Unstoppable', desc: 'Hit an electrifying 10x streak without a single mistake' },
    { id: 'solved_20', icon: '🎯', title: 'First 20 Master', desc: 'Accumulate 20 lifetime correct element placements' },
    { id: 'solved_118', icon: '🌌', title: '118 Periodic Conqueror', desc: 'Accumulate 118+ lifetime correct element placements' },
    { id: 'quiz_rookie', icon: '🧠', title: 'Quiz Challenger', desc: 'Answer 5 Rapid Quiz questions accurately' },
    { id: 'quiz_ace', icon: '🎓', title: 'JEE / NEET Topper', desc: 'Answer 25 Rapid Quiz questions accurately' },
    { id: 'compound_chef', icon: '⚗️', title: 'Molecular Architect', desc: 'Analyze 5 chemical formulas in the Compound Lab' },
    { id: 'trends_explorer', icon: '🌈', title: 'Trends Visualizer', desc: 'Explore Periodic Trends heatmaps in Study Mode' },
    { id: 'atom_comparator', icon: '⚖️', title: 'Head-to-Head Analyst', desc: 'Compare 2 elements side-by-side in the Bohr Inspector' },
    { id: 'challenge_winner', icon: '🏅', title: 'Board Finisher', desc: 'Complete a full Periodic Table scope challenge' },
    { id: 'level_5', icon: '👑', title: 'Senior Chemist (Lv.5)', desc: 'Reach Scientist Level 5 through total earned XP' }
  ];

  const PROFILE_KEY = 'pt_pro_profile_v2';

  function todayStamp() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function loadProfile() {
    const defaults = {
      xp: 0,
      elementsSolvedTotal: 0,
      quizCorrectTotal: 0,
      quizAttemptedTotal: 0,
      bestStreak: 0,
      compoundsAnalyzed: 0,
      challengesWon: 0,
      dailyStreak: 1,
      lastActiveDay: todayStamp(),
      badges: []
    };
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      const merged = Object.assign({}, defaults, parsed);
      const today = todayStamp();
      if (merged.lastActiveDay !== today) {
        const prev = new Date(merged.lastActiveDay + 'T00:00:00');
        const cur = new Date(today + 'T00:00:00');
        const diffDays = Math.round((cur - prev) / 86400000);
        merged.dailyStreak = diffDays === 1 ? (merged.dailyStreak || 1) + 1 : 1;
        merged.lastActiveDay = today;
      }
      return merged;
    } catch (_) {
      return defaults;
    }
  }

  function saveProfile(prof) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(prof));
    } catch (_) {}
  }

  function getRankInfo(xp) {
    let current = RANKS[0];
    let next = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].xp) {
        current = RANKS[i];
        next = RANKS[i + 1] || null;
      }
    }
    const span = next ? next.xp - current.xp : 1;
    const pct = next ? Math.min(100, Math.round(((xp - current.xp) / span) * 100)) : 100;
    return { current, next, pct };
  }

  window.CHEM_PRO = {
    RADIUS_PM,
    IONIZATION_KJ,
    OXIDATION_MAP,
    LATIN_ORIGINS,
    FAMOUS_COMPOUNDS,
    RANKS,
    ACHIEVEMENTS,
    numericMass,
    parseChemicalFormula,
    generateQuizQuestion,
    loadProfile,
    saveProfile,
    getRankInfo,
    getRadius(z) {
      return RADIUS_PM[z] || null;
    },
    getIonization(z) {
      return IONIZATION_KJ[z] || null;
    },
    getOxidation(z, el) {
      if (OXIDATION_MAP[z]) return OXIDATION_MAP[z];
      if (!el) return '—';
      if (el.group === 1) return '+1';
      if (el.group === 2) return '+2';
      if (el.group === 18) return '0';
      if (el.category === 'lanthanide') return '+3';
      if (el.category === 'actinide') return '+3, +4';
      return 'Variable';
    }
  };
})();
