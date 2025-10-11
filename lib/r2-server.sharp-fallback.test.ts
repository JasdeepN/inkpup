import { expect, jest, test } from '@jest/globals';
import { createHash } from 'crypto';

const ORIGINAL_ENV = { ...process.env };
const VERIFIED_ACCESS_KEY_ID = '0123456789abcdef0123456789abcdef';
const API_TOKEN_VALUE = 'test-api-token-value';
const API_TOKEN_HASH = createHash('sha256').update(API_TOKEN_VALUE).digest('hex');

test('uploadGalleryImage skips optimization when sharp fails to load', async () => {
	jest.resetModules();
	process.env = { ...ORIGINAL_ENV };
	process.env.R2_ACCOUNT_ID = 'account';
	process.env.R2_BUCKET = 'bucket';
	process.env.R2_ACCESS_KEY_ID = VERIFIED_ACCESS_KEY_ID;
	process.env.R2_SECRET_ACCESS_KEY = API_TOKEN_HASH;
	process.env.R2_API_TOKEN = API_TOKEN_VALUE;

	const sendMock = jest.fn();

	const fetchMock = jest.fn(async () => ({
		ok: true,
		json: async () => ({ result: { id: VERIFIED_ACCESS_KEY_ID } }),
	}));
	(globalThis as Record<string, unknown>).fetch = fetchMock;

		jest.doMock('@aws-sdk/client-s3', () => {
			class PutObjectCommand {
				params: Record<string, unknown>;
				constructor(params: Record<string, unknown>) {
					this.params = params;
				}
			}

			const DeleteObjectCommand = jest.fn();
			const ListObjectsV2Command = jest.fn();

			return {
				__esModule: true,
				S3Client: jest.fn(() => ({ send: sendMock })),
				PutObjectCommand,
				DeleteObjectCommand,
				ListObjectsV2Command,
			};
		});

	jest.doMock('sharp', () => ({
		__esModule: true,
		default: undefined,
	}));

	const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

	const server = await import('./r2-server');

	const buffer = Buffer.from('original');
	await server.uploadGalleryImage({
		category: 'healed',
		originalFilename: 'sample.png',
		buffer,
	});

	expect(consoleSpy).toHaveBeenCalled();
	expect(sendMock).toHaveBeenCalledTimes(1);
	const commandInstance = sendMock.mock.calls[0][0] as { params: Record<string, unknown> };
	expect(commandInstance.params.Body).toBe(buffer);

	consoleSpy.mockRestore();
	jest.resetModules();
	jest.dontMock('@aws-sdk/client-s3');
	jest.dontMock('sharp');
	process.env = ORIGINAL_ENV;
	delete (globalThis as Record<string, unknown>).fetch;
});
