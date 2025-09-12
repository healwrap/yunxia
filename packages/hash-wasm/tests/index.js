import assert from 'assert';
import { add, sum } from '../build/debug.js';
assert.strictEqual(add(1, 2), 3);
assert.strictEqual(sum(), 10);
console.log('ok');
