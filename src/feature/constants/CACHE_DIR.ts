import os from 'os';
import path from 'path';

export const CACHE_DIR = path.join(os.tmpdir(), '.vyn', 'cache');
