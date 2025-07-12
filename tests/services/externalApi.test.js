import axios from 'axios';
import { fetchSomething } from '../../../src/services/externalApi.js';

jest.mock('axios');

describe('fetchSomething', () => {
  it('should return mocked data', async () => {
    const mockResponse = { data: { id: '123', name: 'Test Item' } };
    axios.create.mockReturnThis();
    axios.get = jest.fn().mockResolvedValue(mockResponse);

    const data = await fetchSomething('123');
    expect(data).toEqual(mockResponse.data);
  });
});
