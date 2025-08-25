const path = require('path');
const DataService = require('../../src/services/dataService');

// Mock the entire fs module first
jest.mock('fs');

// Then get the mocked fs module and set up promises.readFile
const fs = require('fs');
fs.promises = { readFile: jest.fn() };
const mockReadFile = fs.promises.readFile;

// Mock logging
jest.mock('../../src/lib/logging.js', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe.skip('DataService', () => {
    let dataService;
    const mockData = {
        welcomeMessage: '👋 Welcome to {hangoutName}, {username}!'
    };

    beforeEach(() => {
        // Reset all mocks before creating new instance
        jest.clearAllMocks();
        mockReadFile.mockReset();
        dataService = new DataService();
    });

    describe('loadData', () => {
        it('should load data from file successfully', async () => {
            const expectedData = { ...mockData };
            mockReadFile.mockResolvedValueOnce(JSON.stringify(expectedData));
            
            const result = await dataService.loadData();
            
            expect(result).toEqual(expectedData);
            expect(mockReadFile).toHaveBeenCalledTimes(1);
            expect(mockReadFile).toHaveBeenCalledWith(
                expect.stringContaining('data.json'),
                'utf8'
            );
        });

        it('should handle missing file gracefully', async () => {
            const error = new Error('File not found');
            error.code = 'ENOENT';
            mockReadFile.mockRejectedValueOnce(error);
            
            const result = await dataService.loadData();
            
            expect(result).toEqual({});
            expect(dataService.getAllData()).toEqual({});
        });

        it('should throw error on invalid JSON', async () => {
            const invalidJson = '{ "broken": "json" "missing": "comma" }';
            mockReadFile.mockResolvedValueOnce(invalidJson);
            
            await expect(dataService.loadData()).rejects.toThrow(SyntaxError);
        });
    });

    describe('getValue', () => {
        beforeEach(async () => {
            mockReadFile.mockResolvedValue(JSON.stringify(mockData));
            await dataService.loadData();
        });

        it('should return value for existing key', () => {
            expect(dataService.getValue('welcomeMessage')).toBe('👋 Welcome to {hangoutName}, {username}!');
        });

        it('should return undefined for non-existent key', () => {
            expect(dataService.getValue('nonexistent')).toBeUndefined();
        });
    });

    describe('getAllData', () => {
        beforeEach(async () => {
            mockReadFile.mockResolvedValue(JSON.stringify(mockData));
            await dataService.loadData();
        });

        it('should return all data', () => {
            expect(dataService.getAllData()).toEqual(mockData);
        });
    });
});
