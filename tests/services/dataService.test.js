// Mock the fs module before requiring the DataService
jest.mock('fs', () => ({
    promises: {
        readFile: jest.fn()
    }
}));

// Mock logging
jest.mock('../../src/lib/logging.js', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

const path = require('path');
const DataService = require('../../src/services/dataService');
const fs = require('fs');

describe('DataService', () => {
    let dataService;
    const mockData = {
        welcomeMessage: "Hi {username}, welcome to '{hangoutName}'"
    };

    beforeEach(() => {
        // Reset all mocks before creating new instance
        jest.clearAllMocks();
        fs.promises.readFile.mockReset();
        dataService = new DataService();
    });

    describe('loadData', () => {
        it('should load data from file successfully', async () => {
            const expectedData = { ...mockData };
            fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(expectedData));
            
            const result = await dataService.loadData();
            
            expect(result).toEqual(expectedData);
            expect(fs.promises.readFile).toHaveBeenCalledTimes(1);
            expect(fs.promises.readFile).toHaveBeenCalledWith(
                expect.stringContaining('data.json'),
                'utf8'
            );
        });

        it('should handle missing file gracefully', async () => {
            const error = new Error('File not found');
            error.code = 'ENOENT';
            fs.promises.readFile.mockRejectedValueOnce(error);
            
            const result = await dataService.loadData();
            
            expect(result).toEqual({});
            expect(dataService.getAllData()).toEqual({});
        });

        it('should throw error on invalid JSON', async () => {
            const invalidJson = '{ "broken": "json" "missing": "comma" }';
            fs.promises.readFile.mockResolvedValueOnce(invalidJson);
            
            await expect(dataService.loadData()).rejects.toThrow(SyntaxError);
        });
    });

    describe('getValue', () => {
        beforeEach(async () => {
            fs.promises.readFile.mockResolvedValue(JSON.stringify(mockData));
            await dataService.loadData();
        });

        it('should return value for existing key', () => {
            expect(dataService.getValue('welcomeMessage')).toBe("Hi {username}, welcome to '{hangoutName}'");
        });

        it('should return undefined for non-existent key', () => {
            expect(dataService.getValue('nonexistent')).toBeUndefined();
        });
    });

    describe('getAllData', () => {

        beforeEach(async () => {
            // Always mock the file read to return the expected mockData for this test
            fs.promises.readFile.mockResolvedValueOnce(JSON.stringify(mockData));
            await dataService.loadData();
        });

        it('should return all data', () => {
            expect(dataService.getAllData()).toEqual(mockData);
        });
    });
});
