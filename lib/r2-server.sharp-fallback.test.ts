import { expect, jest, test } from '@jest/globals';

const ORIGINAL_ENV = { ...process.env };

test('uploadGalleryImage skips optimization when sharp fails to load', async () => {
	jest.resetModules();
	process.env = { ...ORIGINAL_ENV };
	process.env.R2_ACCOUNT_ID = 'account';
	process.env.R2_BUCKET = 'bucket';
	process.env.R2_ACCESS_KEY_ID = 'access';
	process.env.R2_SECRET_ACCESS_KEY = 'secret';

	const sendMock = jest.fn();

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
});
