import { describe, it, expect, vi, beforeEach } from 'vitest';
import { remove } from './articles.js';

// Mock dependencies
vi.mock('../_generated/server', () => ({
    mutation: (config) => config, // Return the config object so we can access handler
    query: (config) => config
}));

vi.mock('../auth', () => ({
    auth: {
        getUserId: vi.fn()
    }
}));

// We need to re-import auth to access the mocked function
import { auth } from '../auth';

// Mock v from convex/values
vi.mock('convex/values', () => ({
    v: {
        id: () => 'id',
        string: () => 'string',
        optional: () => 'optional',
        array: () => 'array'
    }
}));

describe('Article Deletion Logic', () => {
    let mockCtx;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            get: vi.fn(),
            delete: vi.fn()
        };
        mockCtx = {
            db: mockDb
        };
        vi.clearAllMocks();
    });

    it('allows admin "somdipto" to delete any article', async () => {
        // Setup
        const userId = 'admin-id';
        const articleId = 'article-123';

        // Auth returns admin ID
        auth.getUserId.mockResolvedValue(userId);

        // User lookup returns admin user
        mockDb.get.mockImplementation((id) => {
            if (id === userId) return { username: 'somdipto' };
            if (id === articleId) return { authorId: 'other-user', _id: articleId };
            return null;
        });

        // Act
        await remove.handler(mockCtx, { id: articleId });

        // Assert
        expect(mockDb.delete).toHaveBeenCalledWith(articleId);
    });

    it('allows admin "KhalandarS" to delete any article', async () => {
        // Setup
        const userId = 'admin-id-2';
        const articleId = 'article-456';

        auth.getUserId.mockResolvedValue(userId);

        mockDb.get.mockImplementation((id) => {
            if (id === userId) return { username: 'KhalandarS' };
            if (id === articleId) return { authorId: 'other-user', _id: articleId };
            return null;
        });

        await remove.handler(mockCtx, { id: articleId });

        expect(mockDb.delete).toHaveBeenCalledWith(articleId);
    });

    it('allows admin "ANJAN672" to delete any article', async () => {
        // Setup
        const userId = 'admin-id-3';
        const articleId = 'article-789';

        auth.getUserId.mockResolvedValue(userId);

        mockDb.get.mockImplementation((id) => {
            if (id === userId) return { username: 'ANJAN672' };
            if (id === articleId) return { authorId: 'other-user', _id: articleId };
            return null;
        });

        await remove.handler(mockCtx, { id: articleId });

        expect(mockDb.delete).toHaveBeenCalledWith(articleId);
    });

    it('prevents regular user from deleting others article', async () => {
        const userId = 'regular-id';
        const articleId = 'article-789';

        auth.getUserId.mockResolvedValue(userId);

        mockDb.get.mockImplementation((id) => {
            if (id === userId) return { username: 'regularjoe' };
            if (id === articleId) return { authorId: 'other-user', _id: articleId };
            return null;
        });

        await expect(remove.handler(mockCtx, { id: articleId }))
            .rejects
            .toThrow('Unauthorized: You do not own this article');

        expect(mockDb.delete).not.toHaveBeenCalled();
    });

    it('allows regular user to delete their own article', async () => {
        const userId = 'regular-id';
        const articleId = 'article-own';

        auth.getUserId.mockResolvedValue(userId);

        mockDb.get.mockImplementation((id) => {
            if (id === userId) return { username: 'regularjoe' };
            if (id === articleId) return { authorId: 'regular-id', _id: articleId };
            return null;
        });

        await remove.handler(mockCtx, { id: articleId });

        expect(mockDb.delete).toHaveBeenCalledWith(articleId);
    });
});

describe('Multi-user Scenario', () => {
    let mockCtx;
    let mockDb;

    beforeEach(() => {
        mockDb = {
            get: vi.fn(),
            delete: vi.fn()
        };
        mockCtx = {
            db: mockDb
        };
        vi.clearAllMocks();
    });

    it('handles interactions between multiple users and papers correctly', async () => {
        // Define Users
        const users = {
            'user-1': { _id: 'user-1', username: 'alice' },
            'user-2': { _id: 'user-2', username: 'bob' },
            'user-3': { _id: 'user-3', username: 'charlie' },
            'user-4': { _id: 'user-4', username: 'dave' },
            'admin-user': { _id: 'admin-user', username: 'ANJAN672' },
            'admin-user-2': { _id: 'admin-user-2', username: 'somdipto' }
        };

        // Define Papers
        const papers = {
            'paper-1': { _id: 'paper-1', authorId: 'user-1', title: 'Alice Paper' },
            'paper-2': { _id: 'paper-2', authorId: 'user-2', title: 'Bob Paper' },
            'paper-3': { _id: 'paper-3', authorId: 'user-3', title: 'Charlie Paper' },
            'paper-4': { _id: 'paper-4', authorId: 'user-4', title: 'Dave Paper' }
        };

        // Mock DB get
        mockDb.get.mockImplementation((id) => {
            if (users[id]) return users[id];
            if (papers[id]) return papers[id];
            return null;
        });

        // Scenario 1: Alice deletes her own paper (Should Succeed)
        auth.getUserId.mockResolvedValue('user-1');
        await remove.handler(mockCtx, { id: 'paper-1' });
        expect(mockDb.delete).toHaveBeenLastCalledWith('paper-1');

        // Scenario 2: Alice tries to delete Bob's paper (Should Fail)
        auth.getUserId.mockResolvedValue('user-1');
        await expect(remove.handler(mockCtx, { id: 'paper-2' }))
            .rejects.toThrow('Unauthorized: You do not own this article');

        // Scenario 3: Admin deletes Charlie's paper (Should Succeed)
        auth.getUserId.mockResolvedValue('admin-user');
        await remove.handler(mockCtx, { id: 'paper-3' });
        expect(mockDb.delete).toHaveBeenLastCalledWith('paper-3');

        // Scenario 4: Bob tries to delete Alice's paper (Should Fail)
        auth.getUserId.mockResolvedValue('user-2');
        await expect(remove.handler(mockCtx, { id: 'paper-1' }))
            .rejects.toThrow('Unauthorized: You do not own this article');

        // Scenario 5: Another Admin deletes Dave's paper (Should Succeed)
        auth.getUserId.mockResolvedValue('admin-user-2');
        await remove.handler(mockCtx, { id: 'paper-4' });
        expect(mockDb.delete).toHaveBeenLastCalledWith('paper-4');
    });
});
