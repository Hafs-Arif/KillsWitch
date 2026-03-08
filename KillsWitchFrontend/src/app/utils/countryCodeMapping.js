// Country name to ISO 3166-1 alpha-2 code mapping
const countryMapping = {
  // Common countries
  'Afghanistan': 'AF',
  'Albania': 'AL',
  'Algeria': 'DZ',
  'Argentina': 'AR',
  'Australia': 'AU',
  'Austria': 'AT',
  'Bangladesh': 'BD',
  'Belgium': 'BE',
  'Brazil': 'BR',
  'Canada': 'CA',
  'China': 'CN',
  'Denmark': 'DK',
  'Egypt': 'EG',
  'Finland': 'FI',
  'France': 'FR',
  'Germany': 'DE',
  'Greece': 'GR',
  'India': 'IN',
  'Indonesia': 'ID',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Ireland': 'IE',
  'Italy': 'IT',
  'Japan': 'JP',
  'Jordan': 'JO',
  'Kenya': 'KE',
  'Kuwait': 'KW',
  'Malaysia': 'MY',
  'Mexico': 'MX',
  'Netherlands': 'NL',
  'New Zealand': 'NZ',
  'Nigeria': 'NG',
  'Norway': 'NO',
  'Pakistan': 'PK',
  'Philippines': 'PH',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Qatar': 'QA',
  'Russia': 'RU',
  'Saudi Arabia': 'SA',
  'Singapore': 'SG',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  'Spain': 'ES',
  'Sri Lanka': 'LK',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Thailand': 'TH',
  'Turkey': 'TR',
  'Ukraine': 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  'Vietnam': 'VN',
  
  // Alternative names
  'USA': 'US',
  'UK': 'GB',
  'UAE': 'AE',
  'South Korea': 'KR',
  'North Korea': 'KP',
  'Czech Republic': 'CZ',
  'Slovak Republic': 'SK',
  'Bosnia and Herzegovina': 'BA',
  'North Macedonia': 'MK',
  'Vatican City': 'VA',
  'San Marino': 'SM',
  'Monaco': 'MC',
  'Liechtenstein': 'LI',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cyprus': 'CY',
  'Iceland': 'IS',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Belarus': 'BY',
  'Moldova': 'MD',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Serbia': 'RS',
  'Montenegro': 'ME',
  'Croatia': 'HR',
  'Slovenia': 'SI',
  'Hungary': 'HU',
  'Armenia': 'AM',
  'Azerbaijan': 'AZ',
  'Georgia': 'GE',
  'Kazakhstan': 'KZ',
  'Kyrgyzstan': 'KG',
  'Tajikistan': 'TJ',
  'Turkmenistan': 'TM',
  'Uzbekistan': 'UZ',
  'Mongolia': 'MN',
  'Nepal': 'NP',
  'Bhutan': 'BT',
  'Myanmar': 'MM',
  'Laos': 'LA',
  'Cambodia': 'KH',
  'Brunei': 'BN',
  'East Timor': 'TL',
  'Papua New Guinea': 'PG',
  'Fiji': 'FJ',
  'Solomon Islands': 'SB',
  'Vanuatu': 'VU',
  'New Caledonia': 'NC',
  'French Polynesia': 'PF',
  'Guam': 'GU',
  'American Samoa': 'AS',
  'Northern Mariana Islands': 'MP',
  'Marshall Islands': 'MH',
  'Micronesia': 'FM',
  'Palau': 'PW',
  'Nauru': 'NR',
  'Kiribati': 'KI',
  'Tuvalu': 'TV',
  'Samoa': 'WS',
  'Tonga': 'TO',
  'Cook Islands': 'CK',
  'Niue': 'NU',
  'Tokelau': 'TK',
  'Pitcairn Islands': 'PN',
  'Norfolk Island': 'NF',
  'Christmas Island': 'CX',
  'Cocos Islands': 'CC',
  'Heard Island': 'HM',
  'McDonald Islands': 'HM',
  'Macau': 'MO',
  'Hong Kong': 'HK',
  'Taiwan': 'TW',
  'Maldives': 'MV',
  'Seychelles': 'SC',
  'Mauritius': 'MU',
  'Comoros': 'KM',
  'Madagascar': 'MG',
  'Mayotte': 'YT',
  'Reunion': 'RE',
  'Saint Helena': 'SH',
  'Ascension Island': 'AC',
  'Tristan da Cunha': 'TA',
  'Falkland Islands': 'FK',
  'South Georgia': 'GS',
  'British Antarctic Territory': 'AQ',
  'Bouvet Island': 'BV',
  'French Southern Territories': 'TF',
  'Antarctica': 'AQ'
};

/**
 * Convert country name to ISO 3166-1 alpha-2 country code
 * @param {string} countryName - The country name to convert
 * @returns {string} - The ISO country code or the original name if not found
 */
export const getCountryCode = (countryName) => {
  if (!countryName || typeof countryName !== 'string') {
    return countryName;
  }

  // Trim and normalize the country name
  const normalizedName = countryName.trim();
  
  // First try exact match
  if (countryMapping[normalizedName]) {
    return countryMapping[normalizedName];
  }

  // Try case-insensitive match
  const lowerCaseName = normalizedName.toLowerCase();
  for (const [country, code] of Object.entries(countryMapping)) {
    if (country.toLowerCase() === lowerCaseName) {
      return code;
    }
  }

  // If it's already a 2-character code, return as is
  if (normalizedName.length === 2 && /^[A-Z]{2}$/i.test(normalizedName)) {
    return normalizedName.toUpperCase();
  }

  // If no match found, return the original name
  console.warn(`Country code not found for: ${countryName}`);
  return normalizedName;
};

/**
 * Check if a string is a valid ISO country code
 * @param {string} code - The code to validate
 * @returns {boolean} - True if valid ISO code
 */
export const isValidCountryCode = (code) => {
  if (!code || typeof code !== 'string' || code.length !== 2) {
    return false;
  }
  
  return Object.values(countryMapping).includes(code.toUpperCase());
};

/**
 * Get country name from ISO code
 * @param {string} code - The ISO country code
 * @returns {string} - The country name or the original code if not found
 */
export const getCountryName = (code) => {
  if (!code || typeof code !== 'string') {
    return code;
  }

  const upperCode = code.toUpperCase();
  for (const [country, countryCode] of Object.entries(countryMapping)) {
    if (countryCode === upperCode) {
      return country;
    }
  }

  return code;
};

export default {
  getCountryCode,
  isValidCountryCode,
  getCountryName,
  countryMapping
};
