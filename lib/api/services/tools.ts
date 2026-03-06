import { secureStorage } from '../../storage/secure-storage';
import { IAPIClient } from '../types';

export const ToolsService = {
    async getTools(client: IAPIClient): Promise<any[] | null> {
        const result = await client.request<any[]>('/tools');
        if (result.success && result.data) {
            await secureStorage.set({ toolsConfig: result.data });
            return result.data;
        }
        return null;
    }
};
