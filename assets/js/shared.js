// Shared code between graph and project pages
const tokenizedWords = {
    'arc de triomphe': ['arc', 'de', 'trio', '##mphe'],
    'paris': ['par', '##is'],
    'france': ['fr', '##ance'],
    'olympic': ['oly', '##mpic'],
    'paralympic': ['para', '##ly', '##mpic'],
    'champs-élysées': ['champs', '##-', '##ély', '##sées'],
    'stabroek': ['sta', '##bro', '##ek'],
    'market': ['mar', '##ket'],
    'georgetown': ['george', '##town'],
    'guyana': ['guy', '##ana'],
    'minibus': ['mini', '##bus'],
    'license': ['lic', '##ense'],
    'plate': ['pl', '##ate'],
    'woman': ['wo', '##man'],
    'women': ['wo', '##men'],
    'colorful': ['color', '##ful'],
    'shawl': ['sha', '##wl'],
    'posing': ['pos', '##ing'],
    'front': ['fr', '##ont'],
    'banners': ['ban', '##ners'],
    'visible': ['vis', '##ible'],
    'famous': ['fam', '##ous'],
    'monument': ['monu', '##ment'],
    'standing': ['stand', '##ing'],
    'appears': ['app', '##ears'],
    'distinctive': ['dist', '##inct', '##ive'],
    'structure': ['struct', '##ure'],
    'written': ['writ', '##ten'],
    'iron': ['ir', '##on'],
    'red': ['red'],
    'white': ['wh', '##ite']
};

function formatTokenizedText(text) {
    const cleanText = text.trim();
    
    if (tokenizedWords[cleanText]) {
        return tokenizedWords[cleanText];
    }
    
    const lowercaseText = cleanText.toLowerCase();
    if (tokenizedWords[lowercaseText]) {
        return tokenizedWords[lowercaseText];
    }
    
    return [cleanText];
} 