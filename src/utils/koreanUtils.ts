export const getJosa = (word: string, type: '이/가' | '을/를'): string => {
    if (!word) return '';
    const lastChar = word.charCodeAt(word.length - 1);
    const hasBatchim = (lastChar - 0xAC00) % 28 > 0;

    if (type === '이/가') {
        return hasBatchim ? '이' : '가';
    }
    if (type === '을/를') {
        return hasBatchim ? '을' : '를';
    }
    return '';
};

export const withJosa = (word: string, type: '이/가' | '을/를'): string => {
    return `${word}${getJosa(word, type)}`;
};
