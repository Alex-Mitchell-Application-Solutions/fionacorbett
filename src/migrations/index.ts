import * as migration_20260920_125817_initial from './20260920_125817_initial';
import * as migration_20260922_131851_remove_featured from './20260922_131851_remove_featured';
import * as migration_20260922_132058_rename_share from './20260922_132058_rename_share';

export const migrations = [
  {
    up: migration_20260920_125817_initial.up,
    down: migration_20260920_125817_initial.down,
    name: '20260920_125817_initial',
  },
  {
    up: migration_20260922_131851_remove_featured.up,
    down: migration_20260922_131851_remove_featured.down,
    name: '20260922_131851_remove_featured',
  },
  {
    up: migration_20260922_132058_rename_share.up,
    down: migration_20260922_132058_rename_share.down,
    name: '20260922_132058_rename_share'
  },
];
