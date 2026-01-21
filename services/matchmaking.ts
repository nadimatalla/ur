export const findMatch = async (playerId: string): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return 'mock-match-123';
};

export const joinQueue = async (playerId: string) => {
    console.log(`Player ${playerId} joined queue`);
    return findMatch(playerId);
};
