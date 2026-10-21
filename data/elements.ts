import type {
  ChemicalElement,
  ElementBlock,
  ElementCategory,
  StandardPhase,
} from "@/domain/elements/types";

/** [symbol, name, atomic mass] indexed by atomic number − 1. */
const RAW: ReadonlyArray<readonly [string, string, number]> = [
  ["H", "Hydrogen", 1.008],
  ["He", "Helium", 4.0026],
  ["Li", "Lithium", 6.94],
  ["Be", "Beryllium", 9.0122],
  ["B", "Boron", 10.81],
  ["C", "Carbon", 12.011],
  ["N", "Nitrogen", 14.007],
  ["O", "Oxygen", 15.999],
  ["F", "Fluorine", 18.998],
  ["Ne", "Neon", 20.18],
  ["Na", "Sodium", 22.99],
  ["Mg", "Magnesium", 24.305],
  ["Al", "Aluminum", 26.982],
  ["Si", "Silicon", 28.085],
  ["P", "Phosphorus", 30.974],
  ["S", "Sulfur", 32.06],
  ["Cl", "Chlorine", 35.45],
  ["Ar", "Argon", 39.948],
  ["K", "Potassium", 39.098],
  ["Ca", "Calcium", 40.078],
  ["Sc", "Scandium", 44.956],
  ["Ti", "Titanium", 47.867],
  ["V", "Vanadium", 50.942],
  ["Cr", "Chromium", 51.996],
  ["Mn", "Manganese", 54.938],
  ["Fe", "Iron", 55.845],
  ["Co", "Cobalt", 58.933],
  ["Ni", "Nickel", 58.693],
  ["Cu", "Copper", 63.546],
  ["Zn", "Zinc", 65.38],
  ["Ga", "Gallium", 69.723],
  ["Ge", "Germanium", 72.63],
  ["As", "Arsenic", 74.922],
  ["Se", "Selenium", 78.971],
  ["Br", "Bromine", 79.904],
  ["Kr", "Krypton", 83.798],
  ["Rb", "Rubidium", 85.468],
  ["Sr", "Strontium", 87.62],
  ["Y", "Yttrium", 88.906],
  ["Zr", "Zirconium", 91.224],
  ["Nb", "Niobium", 92.906],
  ["Mo", "Molybdenum", 95.95],
  ["Tc", "Technetium", 98],
  ["Ru", "Ruthenium", 101.07],
  ["Rh", "Rhodium", 102.91],
  ["Pd", "Palladium", 106.42],
  ["Ag", "Silver", 107.87],
  ["Cd", "Cadmium", 112.41],
  ["In", "Indium", 114.82],
  ["Sn", "Tin", 118.71],
  ["Sb", "Antimony", 121.76],
  ["Te", "Tellurium", 127.6],
  ["I", "Iodine", 126.9],
  ["Xe", "Xenon", 131.29],
  ["Cs", "Cesium", 132.91],
  ["Ba", "Barium", 137.33],
  ["La", "Lanthanum", 138.91],
  ["Ce", "Cerium", 140.12],
  ["Pr", "Praseodymium", 140.91],
  ["Nd", "Neodymium", 144.24],
  ["Pm", "Promethium", 145],
  ["Sm", "Samarium", 150.36],
  ["Eu", "Europium", 151.96],
  ["Gd", "Gadolinium", 157.25],
  ["Tb", "Terbium", 158.93],
  ["Dy", "Dysprosium", 162.5],
  ["Ho", "Holmium", 164.93],
  ["Er", "Erbium", 167.26],
  ["Tm", "Thulium", 168.93],
  ["Yb", "Ytterbium", 173.05],
  ["Lu", "Lutetium", 174.97],
  ["Hf", "Hafnium", 178.49],
  ["Ta", "Tantalum", 180.95],
  ["W", "Tungsten", 183.84],
  ["Re", "Rhenium", 186.21],
  ["Os", "Osmium", 190.23],
  ["Ir", "Iridium", 192.22],
  ["Pt", "Platinum", 195.08],
  ["Au", "Gold", 196.97],
  ["Hg", "Mercury", 200.59],
  ["Tl", "Thallium", 204.38],
  ["Pb", "Lead", 207.2],
  ["Bi", "Bismuth", 208.98],
  ["Po", "Polonium", 209],
  ["At", "Astatine", 210],
  ["Rn", "Radon", 222],
  ["Fr", "Francium", 223],
  ["Ra", "Radium", 226],
  ["Ac", "Actinium", 227],
  ["Th", "Thorium", 232.04],
  ["Pa", "Protactinium", 231.04],
  ["U", "Uranium", 238.03],
  ["Np", "Neptunium", 237],
  ["Pu", "Plutonium", 244],
  ["Am", "Americium", 243],
  ["Cm", "Curium", 247],
  ["Bk", "Berkelium", 247],
  ["Cf", "Californium", 251],
  ["Es", "Einsteinium", 252],
  ["Fm", "Fermium", 257],
  ["Md", "Mendelevium", 258],
  ["No", "Nobelium", 259],
  ["Lr", "Lawrencium", 266],
  ["Rf", "Rutherfordium", 267],
  ["Db", "Dubnium", 268],
  ["Sg", "Seaborgium", 269],
  ["Bh", "Bohrium", 270],
  ["Hs", "Hassium", 269],
  ["Mt", "Meitnerium", 278],
  ["Ds", "Darmstadtium", 281],
  ["Rg", "Roentgenium", 282],
  ["Cn", "Copernicium", 285],
  ["Nh", "Nihonium", 286],
  ["Fl", "Flerovium", 289],
  ["Mc", "Moscovium", 290],
  ["Lv", "Livermorium", 293],
  ["Ts", "Tennessine", 294],
  ["Og", "Oganesson", 294],
];

const ALT_NAMES: Readonly<Record<number, readonly string[]>> = {
  13: ["Aluminium"],
  16: ["Sulphur"],
  55: ["Caesium"],
};

const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

const CATEGORY_MEMBERS: Readonly<Record<ElementCategory, readonly number[]>> = {
  "alkali-metal": [3, 11, 19, 37, 55, 87],
  "alkaline-earth-metal": [4, 12, 20, 38, 56, 88],
  "transition-metal": [
    ...range(21, 30),
    ...range(39, 48),
    ...range(72, 80),
    ...range(104, 108),
  ],
  "post-transition-metal": [13, 31, 49, 50, 81, 82, 83, 84],
  metalloid: [5, 14, 32, 33, 51, 52, 85],
  "reactive-nonmetal": [1, 6, 7, 8, 9, 15, 16, 17, 34, 35, 53],
  "noble-gas": [2, 10, 18, 36, 54, 86],
  lanthanide: range(57, 71),
  actinide: range(89, 103),
  unknown: range(109, 118),
};

const CATEGORY_BY_NUMBER = new Map<number, ElementCategory>(
  (Object.entries(CATEGORY_MEMBERS) as [ElementCategory, readonly number[]][]).flatMap(
    ([category, numbers]) => numbers.map((n) => [n, category] as const),
  ),
);

const GASES = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86]);
const LIQUIDS = new Set([35, 80]);

function phaseOf(n: number): StandardPhase {
  if (GASES.has(n)) return "gas";
  if (LIQUIDS.has(n)) return "liquid";
  return n >= 100 ? "unknown" : "solid";
}

function isMostStableIsotopeMass(n: number): boolean {
  return n === 43 || n === 61 || (n >= 84 && n <= 89) || n >= 93;
}

const PERIOD_STARTS = [1, 3, 11, 19, 37, 55, 87] as const;

interface Placement {
  period: number;
  group: number | null;
  block: ElementBlock;
  position: { row: number; column: number };
}

/** Derives period, group, block, and grid placement from the atomic number. */
export function placeElement(n: number): Placement {
  let period = 1;
  for (let p = PERIOD_STARTS.length - 1; p >= 0; p--) {
    if (n >= PERIOD_STARTS[p]!) {
      period = p + 1;
      break;
    }
  }
  const offset = n - PERIOD_STARTS[period - 1]!;
  const main = (group: number, block: ElementBlock): Placement => ({
    period,
    group,
    block,
    position: { row: period, column: group },
  });

  if (period === 1) return main(n === 1 ? 1 : 18, "s");
  if (period <= 3) return offset < 2 ? main(offset + 1, "s") : main(offset + 11, "p");
  if (period <= 5) {
    const group = offset + 1;
    return main(group, offset < 2 ? "s" : offset < 12 ? "d" : "p");
  }
  if (offset < 2) return main(offset + 1, "s");
  if (offset <= 16) {
    return { period, group: null, block: "f", position: { row: period + 3, column: offset + 1 } };
  }
  return main(offset - 13, offset <= 25 ? "d" : "p");
}

export const ELEMENTS: readonly ChemicalElement[] = RAW.map(([symbol, name, atomicMass], index) => {
  const atomicNumber = index + 1;
  const category = CATEGORY_BY_NUMBER.get(atomicNumber);
  if (!category) throw new Error(`Element ${atomicNumber} has no category`);
  return {
    atomicNumber,
    symbol,
    name,
    altNames: ALT_NAMES[atomicNumber] ?? [],
    atomicMass,
    massIsMostStableIsotope: isMostStableIsotopeMass(atomicNumber),
    category,
    phase: phaseOf(atomicNumber),
    ...placeElement(atomicNumber),
  };
});
