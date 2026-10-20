/**
 * Complete IUPAC 118 Periodic Table Elements Dataset
 * Includes exact grid coordinates, electron shells, subshell configs,
 * physical properties, and concise chemistry facts.
 */
(function () {
  'use strict';

  const CATEGORIES = {
    'alkali-metal': {
      id: 'alkali-metal',
      label: 'Alkali Metal',
      short: 'Alkali',
      color: '#f43f5e'
    },
    'alkaline-earth': {
      id: 'alkaline-earth',
      label: 'Alkaline Earth Metal',
      short: 'Alk. Earth',
      color: '#fb923c'
    },
    'transition-metal': {
      id: 'transition-metal',
      label: 'Transition Metal',
      short: 'Transition',
      color: '#38bdf8'
    },
    'post-transition': {
      id: 'post-transition',
      label: 'Post-Transition Metal',
      short: 'Post-Trans.',
      color: '#34d399'
    },
    'metalloid': {
      id: 'metalloid',
      label: 'Metalloid',
      short: 'Metalloid',
      color: '#eab308'
    },
    'nonmetal': {
      id: 'nonmetal',
      label: 'Reactive Nonmetal',
      short: 'Nonmetal',
      color: '#22c55e'
    },
    'halogen': {
      id: 'halogen',
      label: 'Halogen',
      short: 'Halogen',
      color: '#14b8a6'
    },
    'noble-gas': {
      id: 'noble-gas',
      label: 'Noble Gas',
      short: 'Noble Gas',
      color: '#a855f7'
    },
    'lanthanide': {
      id: 'lanthanide',
      label: 'Lanthanide',
      short: 'Lanthanide',
      color: '#ec4899'
    },
    'actinide': {
      id: 'actinide',
      label: 'Actinide',
      short: 'Actinide',
      color: '#f59e0b'
    }
  };

  // Compact tuple format:
  // [z, symbol, name, mass, period, group, gridRow, gridCol, block, category, phase, meltK, boilK, electronegativity, shells, config, year, fact]
  const RAW_ELEMENTS = [
    [1, 'H', 'Hydrogen', '1.008', 1, 1, 1, 1, 's', 'nonmetal', 'Gas', 13.99, 20.27, 2.20, [1], '1s¹', '1766', 'Most abundant element in the universe; powers stars via nuclear fusion.'],
    [2, 'He', 'Helium', '4.0026', 1, 18, 1, 18, 's', 'noble-gas', 'Gas', 0.95, 4.22, null, [2], '1s²', '1868', 'Discovered in the solar spectrum before being found on Earth; never freezes at 1 atm.'],

    [3, 'Li', 'Lithium', '6.94', 2, 1, 2, 1, 's', 'alkali-metal', 'Solid', 453.65, 1603, 0.98, [2, 1], '[He] 2s¹', '1817', 'Lightest solid metal; essential cathode/electrolyte element in rechargeable batteries.'],
    [4, 'Be', 'Beryllium', '9.0122', 2, 2, 2, 2, 's', 'alkaline-earth', 'Solid', 1560, 2742, 1.57, [2, 2], '[He] 2s²', '1798', 'Used in James Webb Space Telescope mirrors due to extreme stiffness and low weight.'],
    [5, 'B', 'Boron', '10.81', 2, 13, 2, 13, 'p', 'metalloid', 'Solid', 2349, 4200, 2.04, [2, 3], '[He] 2s² 2p¹', '1808', 'Gives borosilicate laboratory glassware superior thermal shock resistance.'],
    [6, 'C', 'Carbon', '12.011', 2, 14, 2, 14, 'p', 'nonmetal', 'Solid', 3800, 4098, 2.55, [2, 4], '[He] 2s² 2p²', 'Ancient', 'Backbone of all organic molecules; forms diamond, graphite, graphene, and fullerenes.'],
    [7, 'N', 'Nitrogen', '14.007', 2, 15, 2, 15, 'p', 'nonmetal', 'Gas', 63.15, 77.36, 3.04, [2, 5], '[He] 2s² 2p³', '1772', 'Makes up ~78% of Earth’s atmosphere; vital component of DNA and amino acids.'],
    [8, 'O', 'Oxygen', '15.999', 2, 16, 2, 16, 'p', 'nonmetal', 'Gas', 54.36, 90.20, 3.44, [2, 6], '[He] 2s² 2p⁴', '1774', 'Essential for cellular respiration and combustion; most abundant element in Earth’s crust.'],
    [9, 'F', 'Fluorine', '18.998', 2, 17, 2, 17, 'p', 'halogen', 'Gas', 53.48, 85.03, 3.98, [2, 7], '[He] 2s² 2p⁵', '1886', 'Most electronegative and chemically reactive of all elements; strengthens tooth enamel as fluoride.'],
    [10, 'Ne', 'Neon', '20.180', 2, 18, 2, 18, 'p', 'noble-gas', 'Gas', 24.56, 27.10, null, [2, 8], '[He] 2s² 2p⁶', '1898', 'Emits an iconic bright reddish-orange glow in high-voltage discharge tubes.'],

    [11, 'Na', 'Sodium', '22.990', 3, 1, 3, 1, 's', 'alkali-metal', 'Solid', 370.94, 1156, 0.93, [2, 8, 1], '[Ne] 3s¹', '1807', 'Soft silvery metal that reacts vigorously with water; vital electrolyte for nerve impulses.'],
    [12, 'Mg', 'Magnesium', '24.305', 3, 2, 3, 2, 's', 'alkaline-earth', 'Solid', 923, 1363, 1.31, [2, 8, 2], '[Ne] 3s²', '1755', 'Central atom in every chlorophyll molecule enabling photosynthesis in green plants.'],
    [13, 'Al', 'Aluminium', '26.982', 3, 13, 3, 13, 'p', 'post-transition', 'Solid', 933.47, 2743, 1.61, [2, 8, 3], '[Ne] 3s² 3p¹', '1825', 'Most abundant metal in Earth’s crust; protected by a self-healing oxide film.'],
    [14, 'Si', 'Silicon', '28.085', 3, 14, 3, 14, 'p', 'metalloid', 'Solid', 1687, 3538, 1.90, [2, 8, 4], '[Ne] 3s² 3p²', '1824', 'Foundation of modern microchips, solar photovoltaic cells, and quartz glass.'],
    [15, 'P', 'Phosphorus', '30.974', 3, 15, 3, 15, 'p', 'nonmetal', 'Solid', 317.3, 553.7, 2.19, [2, 8, 5], '[Ne] 3s² 3p³', '1669', 'Key part of ATP energy currency in cells; first isolated from glowing white distillates.'],
    [16, 'S', 'Sulfur', '32.06', 3, 16, 3, 16, 'p', 'nonmetal', 'Solid', 388.36, 717.8, 2.58, [2, 8, 6], '[Ne] 3s² 3p⁴', 'Ancient', 'Bright yellow nonmetal used to vulcanize rubber and manufacture sulfuric acid.'],
    [17, 'Cl', 'Chlorine', '35.45', 3, 17, 3, 17, 'p', 'halogen', 'Gas', 171.6, 239.11, 3.16, [2, 8, 7], '[Ne] 3s² 3p⁵', '1774', 'Greenish-yellow halogen gas widely used to disinfect drinking water worldwide.'],
    [18, 'Ar', 'Argon', '39.948', 3, 18, 3, 18, 'p', 'noble-gas', 'Gas', 83.81, 87.30, null, [2, 8, 8], '[Ne] 3s² 3p⁶', '1894', 'Third most abundant atmospheric gas; provides inert shielding in arc welding and bulbs.'],

    [19, 'K', 'Potassium', '39.098', 4, 1, 4, 1, 's', 'alkali-metal', 'Solid', 336.7, 1032, 0.82, [2, 8, 8, 1], '[Ar] 4s¹', '1807', 'Burns with a lilac flame in water; critical nutrient for plant growth and heart rhythm.'],
    [20, 'Ca', 'Calcium', '40.078', 4, 2, 4, 2, 's', 'alkaline-earth', 'Solid', 1115, 1757, 1.00, [2, 8, 8, 2], '[Ar] 4s²', '1808', 'Structural element of bones, teeth, limestone, marble, and Portland cement.'],
    [21, 'Sc', 'Scandium', '44.956', 4, 3, 4, 3, 'd', 'transition-metal', 'Solid', 1814, 3109, 1.36, [2, 8, 9, 2], '[Ar] 3d¹ 4s²', '1879', 'Predicted by Mendeleev as eka-boron; strengthens lightweight aerospace aluminium alloys.'],
    [22, 'Ti', 'Titanium', '47.867', 4, 4, 4, 4, 'd', 'transition-metal', 'Solid', 1941, 3560, 1.54, [2, 8, 10, 2], '[Ar] 3d² 4s²', '1791', 'As strong as steel at nearly half the weight; biocompatible for surgical implants.'],
    [23, 'V', 'Vanadium', '50.942', 4, 5, 4, 5, 'd', 'transition-metal', 'Solid', 2183, 3680, 1.63, [2, 8, 11, 2], '[Ar] 3d³ 4s²', '1801', 'Displays vivid rainbow colors across its +2, +3, +4, and +5 oxidation states.'],
    [24, 'Cr', 'Chromium', '51.996', 4, 6, 4, 6, 'd', 'transition-metal', 'Solid', 2180, 2944, 1.66, [2, 8, 13, 1], '[Ar] 3d⁵ 4s¹', '1797', 'Makes stainless steel corrosion-resistant and gives rubies their deep red color.'],
    [25, 'Mn', 'Manganese', '54.938', 4, 7, 4, 7, 'd', 'transition-metal', 'Solid', 1519, 2334, 1.55, [2, 8, 13, 2], '[Ar] 3d⁵ 4s²', '1774', 'Essential cofactor in Photosystem II that splits water molecules to release oxygen.'],
    [26, 'Fe', 'Iron', '55.845', 4, 8, 4, 8, 'd', 'transition-metal', 'Solid', 1811, 3134, 1.83, [2, 8, 14, 2], '[Ar] 3d⁶ 4s²', 'Ancient', 'Forms Earth’s magnetic core, steel infrastructure, and oxygen-carrying hemoglobin.'],
    [27, 'Co', 'Cobalt', '58.933', 4, 9, 4, 9, 'd', 'transition-metal', 'Solid', 1768, 3200, 1.88, [2, 8, 15, 2], '[Ar] 3d⁷ 4s²', '1735', 'Ferromagnetic metal famous for deep cobalt-blue pigments and Vitamin B12 center.'],
    [28, 'Ni', 'Nickel', '58.693', 4, 10, 4, 10, 'd', 'transition-metal', 'Solid', 1728, 3003, 1.91, [2, 8, 16, 2], '[Ar] 3d⁸ 4s²', '1751', 'Abundant in iron meteorites; key catalyst in hydrogenation and superalloys.'],
    [29, 'Cu', 'Copper', '63.546', 4, 11, 4, 11, 'd', 'transition-metal', 'Solid', 1357.77, 2835, 1.90, [2, 8, 18, 1], '[Ar] 3d¹⁰ 4s¹', 'Ancient', 'Distinctive reddish metal with exceptional electrical and thermal conductivity.'],
    [30, 'Zn', 'Zinc', '65.38', 4, 12, 4, 12, 'd', 'transition-metal', 'Solid', 692.68, 1180, 1.65, [2, 8, 18, 2], '[Ar] 3d¹⁰ 4s²', 'Ancient', 'Galvanizes steel against rust and activates over 300 human enzymes.'],
    [31, 'Ga', 'Gallium', '69.723', 4, 13, 4, 13, 'p', 'post-transition', 'Solid', 302.91, 2673, 1.81, [2, 8, 18, 3], '[Ar] 3d¹⁰ 4s² 4p¹', '1875', 'Melts right in the palm of a warm hand (29.76 °C); powers blue/white GaN LEDs.'],
    [32, 'Ge', 'Germanium', '72.630', 4, 14, 4, 14, 'p', 'metalloid', 'Solid', 1211.4, 3106, 2.01, [2, 8, 18, 4], '[Ar] 3d¹⁰ 4s² 4p²', '1886', 'Used in the very first transistor (1947), fiber optics, and infrared night lenses.'],
    [33, 'As', 'Arsenic', '74.922', 4, 15, 4, 15, 'p', 'metalloid', 'Solid', 1090, 887, 2.18, [2, 8, 18, 5], '[Ar] 3d¹⁰ 4s² 4p³', '1250', 'Sublimes directly from solid to gas at atmospheric pressure; used in GaAs solar cells.'],
    [34, 'Se', 'Selenium', '78.971', 4, 16, 4, 16, 'p', 'nonmetal', 'Solid', 494, 958, 2.55, [2, 8, 18, 6], '[Ar] 3d¹⁰ 4s² 4p⁴', '1817', 'Photoconductive nonmetal whose electrical resistance drops sharply when exposed to light.'],
    [35, 'Br', 'Bromine', '79.904', 4, 17, 4, 17, 'p', 'halogen', 'Liquid', 265.8, 332.0, 2.96, [2, 8, 18, 7], '[Ar] 3d¹⁰ 4s² 4p⁵', '1826', 'Only nonmetallic element that is a liquid at standard room temperature.'],
    [36, 'Kr', 'Krypton', '83.798', 4, 18, 4, 18, 'p', 'noble-gas', 'Gas', 115.78, 119.93, 3.00, [2, 8, 18, 8], '[Ar] 3d¹⁰ 4s² 4p⁶', '1898', 'Its spectral line once defined the international standard meter from 1960 to 1983.'],

    [37, 'Rb', 'Rubidium', '85.468', 5, 1, 5, 1, 's', 'alkali-metal', 'Solid', 312.45, 961, 0.82, [2, 8, 18, 8, 1], '[Kr] 5s¹', '1861', 'Used in ultra-precise GPS atomic clocks and deep red-violet fireworks.'],
    [38, 'Sr', 'Strontium', '87.62', 5, 2, 5, 2, 's', 'alkaline-earth', 'Solid', 1050, 1650, 0.95, [2, 8, 18, 8, 2], '[Kr] 5s²', '1790', 'Produces brilliant crimson-red flames in flares and pyrotechnics.'],
    [39, 'Y', 'Yttrium', '88.906', 5, 3, 5, 3, 'd', 'transition-metal', 'Solid', 1799, 3203, 1.22, [2, 8, 18, 9, 2], '[Kr] 4d¹ 5s²', '1794', 'Used in YAG medical lasers and high-temperature YBCO superconductors.'],
    [40, 'Zr', 'Zirconium', '91.224', 5, 4, 5, 4, 'd', 'transition-metal', 'Solid', 2128, 4650, 1.33, [2, 8, 18, 10, 2], '[Kr] 4d² 5s²', '1789', 'Barely absorbs neutrons, making it ideal cladding for nuclear fuel rods.'],
    [41, 'Nb', 'Niobium', '92.906', 5, 5, 5, 5, 'd', 'transition-metal', 'Solid', 2750, 5017, 1.60, [2, 8, 18, 12, 1], '[Kr] 4d⁴ 5s¹', '1801', 'Superconducting Nb-Ti magnets power hospital MRI scanners and CERN colliders.'],
    [42, 'Mo', 'Molybdenum', '95.95', 5, 6, 5, 6, 'd', 'transition-metal', 'Solid', 2896, 4912, 2.16, [2, 8, 18, 13, 1], '[Kr] 4d⁵ 5s¹', '1781', 'Vital in nitrogenase enzymes that allow bacteria to fix atmospheric nitrogen.'],
    [43, 'Tc', 'Technetium', '[98]', 5, 7, 5, 7, 'd', 'transition-metal', 'Solid', 2430, 4538, 1.90, [2, 8, 18, 13, 2], '[Kr] 4d⁵ 5s²', '1937', 'Lightest element with no stable isotopes; widely used in nuclear medical imaging.'],
    [44, 'Ru', 'Ruthenium', '101.07', 5, 8, 5, 8, 'd', 'transition-metal', 'Solid', 2607, 4423, 2.20, [2, 8, 18, 15, 1], '[Kr] 4d⁷ 5s¹', '1844', 'Hardens platinum contacts and enables Nobel-winning Grubbs metathesis catalysts.'],
    [45, 'Rh', 'Rhodium', '102.91', 5, 9, 5, 9, 'd', 'transition-metal', 'Solid', 2237, 3968, 2.28, [2, 8, 18, 16, 1], '[Kr] 4d⁸ 5s¹', '1803', 'One of the rarest precious metals; converts toxic NOx exhaust in catalytic converters.'],
    [46, 'Pd', 'Palladium', '106.42', 5, 10, 5, 10, 'd', 'transition-metal', 'Solid', 1828.05, 3236, 2.20, [2, 8, 18, 18], '[Kr] 4d¹⁰', '1803', 'Can absorb up to 900 times its own volume of hydrogen gas like a metallic sponge.'],
    [47, 'Ag', 'Silver', '107.87', 5, 11, 5, 11, 'd', 'transition-metal', 'Solid', 1234.93, 2435, 1.93, [2, 8, 18, 18, 1], '[Kr] 4d¹⁰ 5s¹', 'Ancient', 'Possesses the highest electrical conductivity, thermal conductivity, and reflectivity of any metal.'],
    [48, 'Cd', 'Cadmium', '112.41', 5, 12, 5, 12, 'd', 'transition-metal', 'Solid', 594.22, 1040, 1.69, [2, 8, 18, 18, 2], '[Kr] 4d¹⁰ 5s²', '1817', 'Forms brilliant yellow/red quantum dots and classic artists’ cadmium pigments.'],
    [49, 'In', 'Indium', '114.82', 5, 13, 5, 13, 'p', 'post-transition', 'Solid', 429.75, 2345, 1.78, [2, 8, 18, 18, 3], '[Kr] 4d¹⁰ 5s² 5p¹', '1863', 'Indium tin oxide (ITO) makes smartphone touchscreens both transparent and conductive.'],
    [50, 'Sn', 'Tin', '118.71', 5, 14, 5, 14, 'p', 'post-transition', 'Solid', 505.08, 2875, 1.96, [2, 8, 18, 18, 4], '[Kr] 4d¹⁰ 5s² 5p²', 'Ancient', 'Alloyed with copper to usher in the Bronze Age; emits a faint “tin cry” when bent.'],
    [51, 'Sb', 'Antimony', '121.76', 5, 15, 5, 15, 'p', 'metalloid', 'Solid', 903.78, 1860, 2.05, [2, 8, 18, 18, 5], '[Kr] 4d¹⁰ 5s² 5p³', 'Ancient', 'Expands slightly as it freezes from liquid to solid, sharpening cast metal type.'],
    [52, 'Te', 'Tellurium', '127.60', 5, 16, 5, 16, 'p', 'metalloid', 'Solid', 722.66, 1261, 2.10, [2, 8, 18, 18, 6], '[Kr] 4d¹⁰ 5s² 5p⁴', '1782', 'Used in high-efficiency CdTe thin-film solar panels and rewritable optical discs.'],
    [53, 'I', 'Iodine', '126.90', 5, 17, 5, 17, 'p', 'halogen', 'Solid', 386.85, 457.4, 2.66, [2, 8, 18, 18, 7], '[Kr] 4d¹⁰ 5s² 5p⁵', '1811', 'Lustrous dark-violet solid that sublimes into violet vapor; essential for thyroid hormones.'],
    [54, 'Xe', 'Xenon', '131.29', 5, 18, 5, 18, 'p', 'noble-gas', 'Gas', 161.4, 165.05, 2.60, [2, 8, 18, 18, 8], '[Kr] 4d¹⁰ 5s² 5p⁶', '1898', 'Propels deep-space ion thrusters and formed the first true noble gas compound in 1962.'],

    [55, 'Cs', 'Caesium', '132.91', 6, 1, 6, 1, 's', 'alkali-metal', 'Solid', 301.7, 944, 0.79, [2, 8, 18, 18, 8, 1], '[Xe] 6s¹', '1860', 'Hyperfine transitions of Cs-133 atoms define the exact length of 1 SI second.'],
    [56, 'Ba', 'Barium', '137.33', 6, 2, 6, 2, 's', 'alkaline-earth', 'Solid', 1000, 2118, 0.89, [2, 8, 18, 18, 8, 2], '[Xe] 6s²', '1808', 'Barium sulfate provides safe X-ray contrast imaging of the digestive tract.'],

    // Lanthanides (57-71 -> gridRow 9, gridCol 4..18)
    [57, 'La', 'Lanthanum', '138.91', 6, 3, 9, 4, 'f', 'lanthanide', 'Solid', 1193, 3737, 1.10, [2, 8, 18, 18, 9, 2], '[Xe] 5d¹ 6s²', '1839', 'Gives high-refractive-index camera lenses crisp clarity and powers hybrid car NiMH batteries.'],
    [58, 'Ce', 'Cerium', '140.12', 6, 3, 9, 5, 'f', 'lanthanide', 'Solid', 1068, 3716, 1.12, [2, 8, 18, 19, 9, 2], '[Xe] 4f¹ 5d¹ 6s²', '1803', 'Most abundant rare-earth element; sparks readily when struck in ferrocerium flints.'],
    [59, 'Pr', 'Praseodymium', '140.91', 6, 3, 9, 6, 'f', 'lanthanide', 'Solid', 1208, 3403, 1.13, [2, 8, 18, 21, 8, 2], '[Xe] 4f³ 6s²', '1885', 'Tints welder’s protective goggles to block harsh yellow sodium glare.'],
    [60, 'Nd', 'Neodymium', '144.24', 6, 3, 9, 7, 'f', 'lanthanide', 'Solid', 1297, 3347, 1.14, [2, 8, 18, 22, 8, 2], '[Xe] 4f⁴ 6s²', '1885', 'NdFeB magnets are the strongest permanent magnets known, driving EV motors and headphones.'],
    [61, 'Pm', 'Promethium', '[145]', 6, 3, 9, 8, 'f', 'lanthanide', 'Solid', 1315, 3273, 1.13, [2, 8, 18, 23, 8, 2], '[Xe] 4f⁵ 6s²', '1945', 'Only naturally radioactive lanthanide; powers miniature long-life nuclear batteries.'],
    [62, 'Sm', 'Samarium', '150.36', 6, 3, 9, 9, 'f', 'lanthanide', 'Solid', 1345, 2173, 1.17, [2, 8, 18, 24, 8, 2], '[Xe] 4f⁶ 6s²', '1879', 'Samarium-cobalt magnets keep their magnetism even at glowing-red temperatures.'],
    [63, 'Eu', 'Europium', '151.96', 6, 3, 9, 10, 'f', 'lanthanide', 'Solid', 1099, 1802, 1.20, [2, 8, 18, 25, 8, 2], '[Xe] 4f⁷ 6s²', '1901', 'Fluoresces vivid red and blue under UV light to prevent euro banknote counterfeiting.'],
    [64, 'Gd', 'Gadolinium', '157.25', 6, 3, 9, 11, 'f', 'lanthanide', 'Solid', 1585, 3546, 1.20, [2, 8, 18, 25, 9, 2], '[Xe] 4f⁷ 5d¹ 6s²', '1880', 'Seven unpaired 4f electrons make chelated Gd(III) an exceptional MRI contrast agent.'],
    [65, 'Tb', 'Terbium', '158.93', 6, 3, 9, 12, 'f', 'lanthanide', 'Solid', 1629, 3503, 1.20, [2, 8, 18, 27, 8, 2], '[Xe] 4f⁹ 6s²', '1843', 'Emits brilliant green luminescence in display phosphors and sonar actuators.'],
    [66, 'Dy', 'Dysprosium', '162.50', 6, 3, 9, 13, 'f', 'lanthanide', 'Solid', 1680, 2840, 1.22, [2, 8, 18, 28, 8, 2], '[Xe] 4f¹⁰ 6s²', '1886', 'Added to wind-turbine magnets to prevent demagnetization under high heat.'],
    [67, 'Ho', 'Holmium', '164.93', 6, 3, 9, 14, 'f', 'lanthanide', 'Solid', 1734, 2993, 1.23, [2, 8, 18, 29, 8, 2], '[Xe] 4f¹¹ 6s²', '1878', 'Has the highest magnetic moment of any naturally occurring element; used in surgical lasers.'],
    [68, 'Er', 'Erbium', '167.26', 6, 3, 9, 15, 'f', 'lanthanide', 'Solid', 1802, 3141, 1.24, [2, 8, 18, 30, 8, 2], '[Xe] 4f¹² 6s²', '1843', 'Erbium-doped optical amplifiers boost laser light pulses across undersea internet cables.'],
    [69, 'Tm', 'Thulium', '168.93', 6, 3, 9, 16, 'f', 'lanthanide', 'Solid', 1818, 2223, 1.25, [2, 8, 18, 31, 8, 2], '[Xe] 4f¹³ 6s²', '1879', 'Least abundant stable lanthanide; powers portable medical X-ray sources.'],
    [70, 'Yb', 'Ytterbium', '173.05', 6, 3, 9, 17, 'f', 'lanthanide', 'Solid', 1097, 1469, 1.10, [2, 8, 18, 32, 8, 2], '[Xe] 4f¹⁴ 6s²', '1878', 'Ytterbium optical lattice clocks stay accurate to within one second over the age of the universe.'],
    [71, 'Lu', 'Lutetium', '174.97', 6, 3, 9, 18, 'd', 'lanthanide', 'Solid', 1925, 3675, 1.27, [2, 8, 18, 32, 9, 2], '[Xe] 4f¹⁴ 5d¹ 6s²', '1907', 'Densest and hardest lanthanide; Lu-177 is used in targeted cancer radiotherapy.'],

    // Period 6 d- and p-blocks (72-86 -> gridRow 6, gridCol 4..18)
    [72, 'Hf', 'Hafnium', '178.49', 6, 4, 6, 4, 'd', 'transition-metal', 'Solid', 2506, 4876, 1.30, [2, 8, 18, 32, 10, 2], '[Xe] 4f¹⁴ 5d² 6s²', '1923', 'Hafnium oxide serves as the microscopic gate insulator inside modern CPU transistors.'],
    [73, 'Ta', 'Tantalum', '180.95', 6, 5, 6, 5, 'd', 'transition-metal', 'Solid', 3290, 5731, 1.50, [2, 8, 18, 32, 11, 2], '[Xe] 4f¹⁴ 5d³ 6s²', '1802', 'Virtually immune to acid corrosion; forms ultra-compact capacitors in smartphones.'],
    [74, 'W', 'Tungsten', '183.84', 6, 6, 6, 6, 'd', 'transition-metal', 'Solid', 3695, 6203, 2.36, [2, 8, 18, 32, 12, 2], '[Xe] 4f¹⁴ 5d⁴ 6s²', '1783', 'Highest melting point (3422 °C) of all pure metals; symbol W comes from Wolfram.'],
    [75, 'Re', 'Rhenium', '186.21', 6, 7, 6, 7, 'd', 'transition-metal', 'Solid', 3459, 5869, 1.90, [2, 8, 18, 32, 13, 2], '[Xe] 4f¹⁴ 5d⁵ 6s²', '1925', 'Enables jet engine turbine blades to withstand extreme heat without creeping.'],
    [76, 'Os', 'Osmium', '190.23', 6, 8, 6, 8, 'd', 'transition-metal', 'Solid', 3306, 5285, 2.20, [2, 8, 18, 32, 14, 2], '[Xe] 4f¹⁴ 5d⁶ 6s²', '1803', 'Densest naturally occurring element on Earth at 22.59 g/cm³—twice as dense as lead.'],
    [77, 'Ir', 'Iridium', '192.22', 6, 9, 6, 9, 'd', 'transition-metal', 'Solid', 2719, 4403, 2.20, [2, 8, 18, 32, 15, 2], '[Xe] 4f¹⁴ 5d⁷ 6s²', '1803', 'Global iridium-rich clay layer revealed the asteroid impact that ended the dinosaur era.'],
    [78, 'Pt', 'Platinum', '195.08', 6, 10, 6, 10, 'd', 'transition-metal', 'Solid', 2041.4, 4098, 2.28, [2, 8, 18, 32, 17, 1], '[Xe] 4f¹⁴ 5d⁹ 6s¹', '1735', 'Noble catalyst powering hydrogen fuel cells, lab electrodes, and chemotherapy drugs.'],
    [79, 'Au', 'Gold', '196.97', 6, 11, 6, 11, 'd', 'transition-metal', 'Solid', 1337.33, 3243, 2.54, [2, 8, 18, 32, 18, 1], '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', 'Ancient', 'Most malleable metal; a single gram can be beaten into a sheet one square meter wide.'],
    [80, 'Hg', 'Mercury', '200.59', 6, 12, 6, 12, 'd', 'transition-metal', 'Liquid', 234.32, 629.88, 2.00, [2, 8, 18, 32, 18, 2], '[Xe] 4f¹⁴ 5d¹⁰ 6s²', 'Ancient', 'Only metal that is a liquid at standard room temperature; symbol Hg from hydrargyrum.'],
    [81, 'Tl', 'Thallium', '204.38', 6, 13, 6, 13, 'p', 'post-transition', 'Solid', 577, 1746, 1.62, [2, 8, 18, 32, 18, 3], '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', '1861', 'Named from Greek thallos (“green shoot”) for its unmistakable bright green emission line.'],
    [82, 'Pb', 'Lead', '207.2', 6, 14, 6, 14, 'p', 'post-transition', 'Solid', 600.61, 2022, 1.87, [2, 8, 18, 32, 18, 4], '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', 'Ancient', 'Dense radiation-shielding metal; final stable endpoint of heavy uranium decay chains.'],
    [83, 'Bi', 'Bismuth', '208.98', 6, 15, 6, 15, 'p', 'post-transition', 'Solid', 544.7, 1837, 2.02, [2, 8, 18, 32, 18, 5], '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', '1753', 'Grows stunning iridescent hopper crystals and is the most strongly diamagnetic metal.'],
    [84, 'Po', 'Polonium', '[209]', 6, 16, 6, 16, 'p', 'post-transition', 'Solid', 527, 1235, 2.00, [2, 8, 18, 32, 18, 6], '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', '1898', 'Discovered by Marie and Pierre Curie and named in honor of Marie’s native Poland.'],
    [85, 'At', 'Astatine', '[210]', 6, 17, 6, 17, 'p', 'halogen', 'Solid', 575, 610, 2.20, [2, 8, 18, 32, 18, 7], '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', '1940', 'Rarest naturally occurring element in Earth’s crust—fewer than a few grams exist at once.'],
    [86, 'Rn', 'Radon', '[222]', 6, 18, 6, 18, 'p', 'noble-gas', 'Gas', 202, 211.5, 2.20, [2, 8, 18, 32, 18, 8], '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', '1900', 'Dense, colorless radioactive noble gas formed naturally from underground radium decay.'],

    [87, 'Fr', 'Francium', '[223]', 7, 1, 7, 1, 's', 'alkali-metal', 'Solid', 300, 950, 0.70, [2, 8, 18, 32, 18, 8, 1], '[Rn] 7s¹', '1939', 'Second rarest natural element; its longest-lived isotope decays with a 22-minute half-life.'],
    [88, 'Ra', 'Radium', '[226]', 7, 2, 7, 2, 's', 'alkaline-earth', 'Solid', 973, 2010, 0.90, [2, 8, 18, 32, 18, 8, 2], '[Rn] 7s²', '1898', 'Glows faint blue in the dark due to intense radioactivity exciting surrounding air nitrogen.'],

    // Actinides (89-103 -> gridRow 10, gridCol 4..18)
    [89, 'Ac', 'Actinium', '[227]', 7, 3, 10, 4, 'f', 'actinide', 'Solid', 1323, 3471, 1.10, [2, 8, 18, 32, 18, 9, 2], '[Rn] 6d¹ 7s²', '1899', 'Gives its name to the actinide series; Ac-225 is prized in targeted alpha cancer therapy.'],
    [90, 'Th', 'Thorium', '232.04', 7, 3, 10, 5, 'f', 'actinide', 'Solid', 2115, 5061, 1.30, [2, 8, 18, 32, 18, 10, 2], '[Rn] 6d² 7s²', '1829', 'Abundant fertile nuclear fuel with huge reserves in India’s monazite coastal sands.'],
    [91, 'Pa', 'Protactinium', '231.04', 7, 3, 10, 6, 'f', 'actinide', 'Solid', 1841, 4300, 1.50, [2, 8, 18, 32, 20, 9, 2], '[Rn] 5f² 6d¹ 7s²', '1913', 'Decays directly into actinium (hence “parent of actinium”) and dates ancient ocean sediments.'],
    [92, 'U', 'Uranium', '238.03', 7, 3, 10, 7, 'f', 'actinide', 'Solid', 1405.3, 4404, 1.38, [2, 8, 18, 32, 21, 9, 2], '[Rn] 5f³ 6d¹ 7s²', '1789', 'Primary fuel of commercial nuclear power reactors via fissionable isotope U-235.'],
    [93, 'Np', 'Neptunium', '[237]', 7, 3, 10, 8, 'f', 'actinide', 'Solid', 917, 4273, 1.36, [2, 8, 18, 32, 22, 9, 2], '[Rn] 5f⁴ 6d¹ 7s²', '1940', 'First synthetic transuranium element discovered, named after planet Neptune beyond Uranus.'],
    [94, 'Pu', 'Plutonium', '[244]', 7, 3, 10, 9, 'f', 'actinide', 'Solid', 912.5, 3505, 1.28, [2, 8, 18, 32, 24, 8, 2], '[Rn] 5f⁶ 7s²', '1940', 'Pu-238 radioisotope heaters have kept Voyager, Curiosity, and Perseverance running for decades.'],
    [95, 'Am', 'Americium', '[243]', 7, 3, 10, 10, 'f', 'actinide', 'Solid', 1449, 2880, 1.13, [2, 8, 18, 32, 25, 8, 2], '[Rn] 5f⁷ 7s²', '1944', 'Tiny micrograms of Am-241 inside household smoke detectors save thousands of lives yearly.'],
    [96, 'Cm', 'Curium', '[247]', 7, 3, 10, 11, 'f', 'actinide', 'Solid', 1613, 3383, 1.28, [2, 8, 18, 32, 25, 9, 2], '[Rn] 5f⁷ 6d¹ 7s²', '1944', 'Used on Mars rovers in alpha-particle X-ray spectrometers to analyze Martian rocks.'],
    [97, 'Bk', 'Berkelium', '[247]', 7, 3, 10, 12, 'f', 'actinide', 'Solid', 1259, 2900, 1.30, [2, 8, 18, 32, 27, 8, 2], '[Rn] 5f⁹ 7s²', '1949', 'Synthesized at UC Berkeley; served as the crucial target atom to discover Tennessine (117).'],
    [98, 'Cf', 'Californium', '[251]', 7, 3, 10, 13, 'f', 'actinide', 'Solid', 1173, 1743, 1.30, [2, 8, 18, 32, 28, 8, 2], '[Rn] 5f¹⁰ 7s²', '1950', 'Powerful neutron emitter used to start nuclear reactors and scan oil wells.'],
    [99, 'Es', 'Einsteinium', '[252]', 7, 3, 10, 14, 'f', 'actinide', 'Solid', 1133, 1269, 1.30, [2, 8, 18, 32, 29, 8, 2], '[Rn] 5f¹¹ 7s²', '1952', 'First detected in microscopic coral debris after the 1952 Ivy Mike thermonuclear test.'],
    [100, 'Fm', 'Fermium', '[257]', 7, 3, 10, 15, 'f', 'actinide', 'Solid', 1800, null, 1.30, [2, 8, 18, 32, 30, 8, 2], '[Rn] 5f¹² 7s²', '1952', 'Heaviest element that can be formed by neutron bombardment of lighter elements.'],
    [101, 'Md', 'Mendelevium', '[258]', 7, 3, 10, 16, 'f', 'actinide', 'Solid', 1100, null, 1.30, [2, 8, 18, 32, 31, 8, 2], '[Rn] 5f¹³ 7s²', '1955', 'Named in honor of Dmitri Mendeleev, creator of the Periodic Table of Elements.'],
    [102, 'No', 'Nobelium', '[259]', 7, 3, 10, 17, 'f', 'actinide', 'Solid', 1100, null, 1.30, [2, 8, 18, 32, 32, 8, 2], '[Rn] 5f¹⁴ 7s²', '1966', 'Unusually stable in the +2 oxidation state because of its completely filled 5f¹⁴ shell.'],
    [103, 'Lr', 'Lawrencium', '[266]', 7, 3, 10, 18, 'd', 'actinide', 'Solid', 1900, null, 1.30, [2, 8, 18, 32, 32, 8, 3], '[Rn] 5f¹⁴ 7s² 7p¹', '1961', 'Final actinide; relativistic effects push its outer electron into the 7p¹ orbital.'],

    // Period 7 superheavy elements (104-118 -> gridRow 7, gridCol 4..18)
    [104, 'Rf', 'Rutherfordium', '[267]', 7, 4, 7, 4, 'd', 'transition-metal', 'Solid', 2400, 5800, null, [2, 8, 18, 32, 32, 10, 2], '[Rn] 5f¹⁴ 6d² 7s²', '1964', 'First transactinide element, named after atomic nucleus pioneer Ernest Rutherford.'],
    [105, 'Db', 'Dubnium', '[268]', 7, 5, 7, 5, 'd', 'transition-metal', 'Solid', null, null, null, [2, 8, 18, 32, 32, 11, 2], '[Rn] 5f¹⁴ 6d³ 7s²', '1968', 'Named after the Joint Institute for Nuclear Research in Dubna, Russia.'],
    [106, 'Sg', 'Seaborgium', '[269]', 7, 6, 7, 6, 'd', 'transition-metal', 'Solid', null, null, null, [2, 8, 18, 32, 32, 12, 2], '[Rn] 5f¹⁴ 6d⁴ 7s²', '1974', 'Only element named after a living scientist at the time—actinide pioneer Glenn T. Seaborg.'],
    [107, 'Bh', 'Bohrium', '[270]', 7, 7, 7, 7, 'd', 'transition-metal', 'Solid', null, null, null, [2, 8, 18, 32, 32, 13, 2], '[Rn] 5f¹⁴ 6d⁵ 7s²', '1981', 'Named after Niels Bohr, whose quantized shell model explained atomic spectra.'],
    [108, 'Hs', 'Hassium', '[277]', 7, 8, 7, 8, 'd', 'transition-metal', 'Solid', null, null, null, [2, 8, 18, 32, 32, 14, 2], '[Rn] 5f¹⁴ 6d⁶ 7s²', '1984', 'Forms volatile HsO₄ tetroxide just like osmium directly above it in Group 8.'],
    [109, 'Mt', 'Meitnerium', '[278]', 7, 9, 7, 9, 'd', 'transition-metal', 'Solid', null, null, null, [2, 8, 18, 32, 32, 15, 2], '[Rn] 5f¹⁴ 6d⁷ 7s²', '1982', 'Honors physicist Lise Meitner, who co-discovered and theoretically explained nuclear fission.'],
    [110, 'Ds', 'Darmstadtium', '[281]', 7, 10, 7, 10, 'd', 'transition-metal', 'Solid', null, null, null, [2, 8, 18, 32, 32, 17, 1], '[Rn] 5f¹⁴ 6d⁹ 7s¹', '1994', 'Synthesized atom-by-atom via heavy ion fusion at GSI in Darmstadt, Germany.'],
    [111, 'Rg', 'Roentgenium', '[282]', 7, 11, 7, 11, 'd', 'transition-metal', 'Solid', null, null, null, [2, 8, 18, 32, 32, 18, 1], '[Rn] 5f¹⁴ 6d¹⁰ 7s¹', '1994', 'Honors Wilhelm Conrad Röntgen on the centenary era of his discovery of X-rays.'],
    [112, 'Cn', 'Copernicium', '[285]', 7, 12, 7, 12, 'd', 'transition-metal', 'Gas', null, 357, null, [2, 8, 18, 32, 32, 18, 2], '[Rn] 5f¹⁴ 6d¹⁰ 7s²', '1996', 'Strong relativistic contraction makes this Group 12 metal behave almost like a volatile gas.'],
    [113, 'Nh', 'Nihonium', '[286]', 7, 13, 7, 13, 'p', 'post-transition', 'Solid', null, null, null, [2, 8, 18, 32, 32, 18, 3], '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', '2004', 'First chemical element discovered in Asia (RIKEN, Japan; “Nihon” means Japan).'],
    [114, 'Fl', 'Flerovium', '[289]', 7, 14, 7, 14, 'p', 'post-transition', 'Solid', null, null, null, [2, 8, 18, 32, 32, 18, 4], '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', '1999', 'Sits near the predicted nuclear “Island of Stability” around neutron number 184.'],
    [115, 'Mc', 'Moscovium', '[290]', 7, 15, 7, 15, 'p', 'post-transition', 'Solid', null, null, null, [2, 8, 18, 32, 32, 18, 5], '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', '2003', 'Superheavy p-block element produced by bombarding americium-243 with calcium-48 ions.'],
    [116, 'Lv', 'Livermorium', '[293]', 7, 16, 7, 16, 'p', 'post-transition', 'Solid', null, null, null, [2, 8, 18, 32, 32, 18, 6], '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', '2000', 'Named after Lawrence Livermore National Laboratory for joint superheavy synthesis work.'],
    [117, 'Ts', 'Tennessine', '[294]', 7, 17, 7, 17, 'p', 'halogen', 'Solid', null, null, null, [2, 8, 18, 32, 32, 18, 7], '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', '2010', 'Second-heaviest known element; heaviest member of Group 17 (the halogens).'],
    [118, 'Og', 'Oganesson', '[294]', 7, 18, 7, 18, 'p', 'noble-gas', 'Solid', null, null, null, [2, 8, 18, 32, 32, 18, 8], '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', '2002', 'Completes the 7th period of the Periodic Table; named after physicist Yuri Oganessian.']
  ];

  const ELEMENTS = RAW_ELEMENTS.map((item) => ({
    z: item[0],
    symbol: item[1],
    name: item[2],
    mass: item[3],
    period: item[4],
    group: item[5],
    gridRow: item[6],
    gridCol: item[7],
    block: item[8],
    category: item[9],
    categoryLabel: CATEGORIES[item[9]].label,
    phase: item[10],
    meltK: item[11],
    boilK: item[12],
    electronegativity: item[13],
    shells: item[14],
    config: item[15],
    year: item[16],
    fact: item[17]
  }));

  window.PERIODIC_DATA = {
    CATEGORIES,
    ELEMENTS
  };
})();
