// AtlasStat data — national indicators for 24 countries, 2024/2025.
// Figures are APPROXIMATE, compiled from public sources (UN World Population
// Prospects, World Bank, IMF) for illustration. They are rounded estimates,
// not official releases of any national statistics office. See About page.
// pop/gdp are 2025 values; pop2015/gdp2015 anchor the 2015-2025 trend series
// (linear interpolation in app.js); growth is the average annual rate 2015-25.
const COUNTRIES = [
  { code: 'CHN', name: 'China',        region: 'Asia',     pop: 1412, pop2015: 1379, popGrowth: 0.24, gdp: 18700, gdp2015: 11060, gdpGrowth: 5.4, gdppc: 13245, life: 79.0, age: 39.6, urban: 66, unemp: 5.1, infl: 0.2, co2: 8.0, net: 78, lit: 97, fert: 1.0 },
  { code: 'IND', name: 'India',        region: 'Asia',     pop: 1450, pop2015: 1315, popGrowth: 0.98, gdp: 3900,  gdp2015: 2100,  gdpGrowth: 6.3, gdppc: 2690,  life: 68.0, age: 28.7, urban: 36, unemp: 7.8, infl: 5.4, co2: 2.0, net: 52, lit: 77, fert: 2.0 },
  { code: 'USA', name: 'United States',region: 'Americas', pop: 340,  pop2015: 321,  popGrowth: 0.58, gdp: 29100, gdp2015: 18200, gdpGrowth: 4.8, gdppc: 85590, life: 79.0, age: 38.5, urban: 83, unemp: 4.0, infl: 2.9, co2: 14.0, net: 93, lit: 99, fert: 1.6 },
  { code: 'IDN', name: 'Indonesia',    region: 'Asia',     pop: 284,  pop2015: 258,  popGrowth: 0.96, gdp: 1400,  gdp2015: 860,   gdpGrowth: 5.0, gdppc: 4930,  life: 72.0, age: 30.5, urban: 58, unemp: 4.9, infl: 2.3, co2: 2.3, net: 66, lit: 96, fert: 2.1 },
  { code: 'PAK', name: 'Pakistan',     region: 'Asia',     pop: 251,  pop2015: 210,  popGrowth: 1.79, gdp: 370,   gdp2015: 270,   gdpGrowth: 3.2, gdppc: 1475,  life: 66.5, age: 22.5, urban: 38, unemp: 6.3, infl: 23.0, co2: 1.0, net: 36, lit: 58, fert: 3.4 },
  { code: 'NGA', name: 'Nigeria',      region: 'Africa',   pop: 233,  pop2015: 183,  popGrowth: 2.44, gdp: 190,   gdp2015: 490,   gdpGrowth: -9.0, gdppc: 815,   life: 54.0, age: 18.0, urban: 54, unemp: 5.4, infl: 33.0, co2: 0.6, net: 42, lit: 62, fert: 4.9 },
  { code: 'BRA', name: 'Brazil',       region: 'Americas', pop: 216,  pop2015: 204,  popGrowth: 0.57, gdp: 2170,  gdp2015: 1800,  gdpGrowth: 1.9, gdppc: 10045, life: 76.0, age: 34.0, urban: 87, unemp: 7.0, infl: 4.6, co2: 2.2, net: 81, lit: 94, fert: 1.6 },
  { code: 'BGD', name: 'Bangladesh',   region: 'Asia',     pop: 173,  pop2015: 157,  popGrowth: 0.97, gdp: 450,   gdp2015: 210,   gdpGrowth: 7.9, gdppc: 2600,  life: 74.0, age: 27.5, urban: 40, unemp: 4.5, infl: 9.7, co2: 0.6, net: 39, lit: 75, fert: 1.9 },
  { code: 'RUS', name: 'Russia',       region: 'Europe',   pop: 144,  pop2015: 144,  popGrowth: 0.00, gdp: 2000,  gdp2015: 1370,  gdpGrowth: 3.9, gdppc: 13890, life: 73.0, age: 40.0, urban: 75, unemp: 2.6, infl: 8.4, co2: 11.0, net: 90, lit: 100, fert: 1.4 },
  { code: 'MEX', name: 'Mexico',       region: 'Americas', pop: 130,  pop2015: 121,  popGrowth: 0.72, gdp: 1790,  gdp2015: 1160,  gdpGrowth: 4.4, gdppc: 13770, life: 75.0, age: 29.5, urban: 81, unemp: 2.7, infl: 5.5, co2: 3.6, net: 81, lit: 95, fert: 1.8 },
  { code: 'ETH', name: 'Ethiopia',     region: 'Africa',   pop: 130,  pop2015: 102,  popGrowth: 2.45, gdp: 160,   gdp2015: 65,    gdpGrowth: 9.4, gdppc: 1230,  life: 67.0, age: 19.0, urban: 22, unemp: 3.5, infl: 23.0, co2: 0.2, net: 19, lit: 52, fert: 3.9 },
  { code: 'JPN', name: 'Japan',        region: 'Asia',     pop: 124,  pop2015: 127,  popGrowth: -0.24, gdp: 4020, gdp2015: 4390,  gdpGrowth: -0.9, gdppc: 32420, life: 84.5, age: 49.0, urban: 92, unemp: 2.6, infl: 2.7, co2: 8.5, net: 93, lit: 99, fert: 1.2 },
  { code: 'PHL', name: 'Philippines',  region: 'Asia',     pop: 118,  pop2015: 103,  popGrowth: 1.36, gdp: 470,   gdp2015: 290,   gdpGrowth: 4.9, gdppc: 3980,  life: 72.0, age: 25.5, urban: 48, unemp: 4.0, infl: 3.2, co2: 1.3, net: 68, lit: 98, fert: 2.7 },
  { code: 'EGY', name: 'Egypt',        region: 'Africa',   pop: 113,  pop2015: 96,   popGrowth: 1.64, gdp: 380,   gdp2015: 330,   gdpGrowth: 1.4, gdppc: 3360,  life: 71.0, age: 24.5, urban: 43, unemp: 6.9, infl: 28.0, co2: 2.5, net: 72, lit: 71, fert: 2.7 },
  { code: 'COD', name: 'DR Congo',     region: 'Africa',   pop: 109,  pop2015: 82,   popGrowth: 2.89, gdp: 70,    gdp2015: 48,    gdpGrowth: 3.8, gdppc: 640,   life: 62.0, age: 17.0, urban: 46, unemp: 4.5, infl: 17.0, co2: 0.3, net: 27, lit: 77, fert: 5.7 },
  { code: 'VNM', name: 'Vietnam',      region: 'Asia',     pop: 101,  pop2015: 93,   popGrowth: 0.83, gdp: 460,   gdp2015: 195,   gdpGrowth: 8.9, gdppc: 4555,  life: 75.5, age: 32.5, urban: 39, unemp: 2.3, infl: 3.6, co2: 2.9, net: 79, lit: 96, fert: 1.9 },
  { code: 'IRN', name: 'Iran',         region: 'Asia',     pop: 90,   pop2015: 80,   popGrowth: 1.18, gdp: 400,   gdp2015: 420,   gdpGrowth: -0.5, gdppc: 4445,  life: 76.0, age: 32.5, urban: 76, unemp: 8.4, infl: 44.0, co2: 8.0, net: 79, lit: 86, fert: 1.7 },
  { code: 'TUR', name: 'Türkiye',      region: 'Europe',   pop: 86,   pop2015: 79,   popGrowth: 0.85, gdp: 1300,  gdp2015: 860,   gdpGrowth: 4.2, gdppc: 15115, life: 77.0, age: 32.5, urban: 77, unemp: 8.7, infl: 58.0, co2: 5.0, net: 87, lit: 97, fert: 1.6 },
  { code: 'DEU', name: 'Germany',      region: 'Europe',   pop: 84,   pop2015: 81,   popGrowth: 0.36, gdp: 4650,  gdp2015: 3350,  gdpGrowth: 3.3, gdppc: 55355, life: 81.0, age: 46.0, urban: 78, unemp: 3.4, infl: 2.5, co2: 7.5, net: 93, lit: 99, fert: 1.4 },
  { code: 'THA', name: 'Thailand',     region: 'Asia',     pop: 72,   pop2015: 69,   popGrowth: 0.43, gdp: 530,   gdp2015: 400,   gdpGrowth: 2.9, gdppc: 7360,  life: 77.0, age: 40.0, urban: 52, unemp: 1.1, infl: 0.4, co2: 3.8, net: 88, lit: 94, fert: 1.3 },
  { code: 'GBR', name: 'United Kingdom',region: 'Europe',  pop: 69,   pop2015: 65,   popGrowth: 0.60, gdp: 3600,  gdp2015: 2900,  gdpGrowth: 2.2, gdppc: 52170, life: 81.0, age: 40.5, urban: 84, unemp: 4.3, infl: 2.6, co2: 5.0, net: 97, lit: 99, fert: 1.5 },
  { code: 'FRA', name: 'France',       region: 'Europe',   pop: 66,   pop2015: 64,   popGrowth: 0.31, gdp: 3000,  gdp2015: 2420,  gdpGrowth: 2.2, gdppc: 45455, life: 83.0, age: 42.0, urban: 81, unemp: 7.4, infl: 2.3, co2: 4.5, net: 94, lit: 99, fert: 1.7 },
  { code: 'TZA', name: 'Tanzania',     region: 'Africa',   pop: 66,   pop2015: 52,   popGrowth: 2.41, gdp: 80,    gdp2015: 46,    gdpGrowth: 5.7, gdppc: 1210,  life: 66.0, age: 18.0, urban: 36, unemp: 2.6, infl: 3.0, co2: 0.2, net: 32, lit: 78, fert: 4.6 },
  { code: 'ZAF', name: 'South Africa', region: 'Africa',   pop: 63,   pop2015: 55,   popGrowth: 1.36, gdp: 380,   gdp2015: 330,   gdpGrowth: 1.4, gdppc: 6030,  life: 64.0, age: 28.0, urban: 68, unemp: 32.0, infl: 6.0, co2: 7.0, net: 72, lit: 95, fert: 2.2 },
];

// Indicator metadata: key, label, unit, decimals, lowerIsBetter?
const INDICATORS = [
  { key: 'pop',   label: 'Population',        unit: 'million',  dec: 0 },
  { key: 'gdp',   label: 'GDP (nominal)',     unit: 'US$ bn',   dec: 0 },
  { key: 'gdppc', label: 'GDP per capita',    unit: 'US$',      dec: 0 },
  { key: 'life',  label: 'Life expectancy',   unit: 'years',    dec: 1 },
  { key: 'age',   label: 'Median age',        unit: 'years',    dec: 1 },
  { key: 'urban', label: 'Urban population',  unit: '%',        dec: 0 },
  { key: 'unemp', label: 'Unemployment',      unit: '%',        dec: 1, lowerBetter: true },
  { key: 'infl',  label: 'Inflation (CPI)',   unit: '% / yr',   dec: 1, lowerBetter: true },
  { key: 'co2',   label: 'CO₂ per capita',    unit: 'tonnes',   dec: 1, lowerBetter: true },
  { key: 'net',   label: 'Internet users',    unit: '% of pop', dec: 0 },
  { key: 'lit',   label: 'Adult literacy',    unit: '%',        dec: 0 },
  { key: 'fert',  label: 'Fertility rate',    unit: 'births',   dec: 1 },
];
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe'];
const DATA_NOTE = 'Approximate figures compiled from public sources (UN World Population Prospects, World Bank, IMF), 2024–2025. Rounded estimates for illustration, not official releases of any national statistics office.';
