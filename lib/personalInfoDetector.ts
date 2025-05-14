interface PersonalInfo {
    type: string;
    value: string;
    context: string;
}

export async function detectPersonalInfo(text: string): Promise<PersonalInfo | null> {
    // Common patterns for personal information
    const patterns = {
        email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
        phone: /(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        address: /\d+\s+[A-Za-z\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way)[,\s]+[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}/g,
        // Add more patterns as needed
    };

    for (const [type, pattern] of Object.entries(patterns)) {
        const matches = text.match(pattern);
        if (matches) {
            return {
                type,
                value: matches[0],
                context: text.substring(Math.max(0, text.indexOf(matches[0]) - 50), 
                                      Math.min(text.length, text.indexOf(matches[0]) + matches[0].length + 50))
            };
        }
    }

    return null;
} 