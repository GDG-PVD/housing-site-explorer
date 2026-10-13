// Run with: npm test
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { citySegment, matchRhodeIslandTown, TownInfo } from './townMatch';

const towns: TownInfo[] = JSON.parse(
  fs.readFileSync(new URL('./src/data/towns.json', import.meta.url), 'utf-8')
);

const comp = (long_name: string, types: string[], short_name = long_name) => ({
  long_name,
  short_name,
  types,
});
const RI = comp('Rhode Island', ['administrative_area_level_1'], 'RI');

const town = (components: ReturnType<typeof comp>[], address: string) =>
  matchRhodeIslandTown(towns, components, address)?.town ?? null;

test('a street named after another town does not change the town', () => {
  // Components missing, so only the formatted address is left to go on
  assert.equal(town([RI], '500 Cranston St, Providence, RI 02907, USA'), 'Providence');
  assert.equal(town([RI], '100 Newport Ave, Pawtucket, RI 02861, USA'), 'Pawtucket');
  assert.equal(town([RI], '1445 Main St, West Warwick, RI 02893, USA'), 'West Warwick');
  assert.equal(town([RI], '500 Warwick Ave, Cranston, RI 02910, USA'), 'Cranston');
});

test('street words that are village names do not match', () => {
  assert.equal(town([RI], '400 Hope St, Providence, RI 02906, USA'), 'Providence');
  // "Washington" is a Coventry village; this is a Pawtucket address
  assert.equal(town([RI], '10 Washington St, Pawtucket, RI 02860, USA'), 'Pawtucket');
  // Pascoag is a Burrillville village; "Kingston" is a South Kingstown one
  assert.equal(town([RI], '50 Kingston Rd, Pascoag, RI 02859, USA'), 'Burrillville');
});

test('locality wins over the street', () => {
  assert.equal(
    town(
      [comp('Cranston', ['locality', 'political']), RI],
      '500 Warwick Ave, Cranston, RI 02910, USA'
    ),
    'Cranston'
  );
});

test('villages map to their town', () => {
  assert.equal(
    town([comp('Wakefield', ['locality', 'political']), RI], 'Main St, Wakefield, RI 02879, USA'),
    'South Kingstown'
  );
  assert.equal(town([RI], '5 Main St, Wakefield, RI 02879, USA'), 'South Kingstown');
});

test('county subdivision "Town of X" is understood', () => {
  assert.equal(
    town(
      [comp('Town of Lincoln', ['administrative_area_level_3', 'political']), RI],
      'Old River Rd, RI 02865, USA'
    ),
    'Lincoln'
  );
});

test('addresses outside Rhode Island get no town', () => {
  assert.equal(
    town(
      [
        comp('Warwick', ['locality', 'political']),
        comp('New York', ['administrative_area_level_1'], 'NY'),
      ],
      'Main St, Warwick, NY 10990, USA'
    ),
    null
  );
});

test('city segment is the part before the state', () => {
  assert.equal(citySegment('580 Broad St, Central Falls, RI 02863, USA'), 'Central Falls');
  assert.equal(citySegment('Rhode Island, USA'), null);
});
