import * as migration_20260920_125817_initial from './20260920_125817_initial';
import * as migration_20260922_131851_remove_featured from './20260922_131851_remove_featured';

export const migrations = [
  {
    up: migration_20260920_125817_initial.up,
    down: migration_20260920_125817_initial.down,
    name: '20260920_125817_initial',
  },
  {
    up: migration_20260922_131851_remove_featured.up,
    down: migration_20260922_131851_remove_featured.down,
    name: '20260922_131851_remove_featured'
  },
];
