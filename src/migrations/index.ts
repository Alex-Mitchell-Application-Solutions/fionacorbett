import * as migration_20260920_125817_initial from './20260920_125817_initial';

export const migrations = [
  {
    up: migration_20260920_125817_initial.up,
    down: migration_20260920_125817_initial.down,
    name: '20260920_125817_initial'
  },
];
