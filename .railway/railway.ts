/**
 * Railway configuration for the fionacorbett service, as Infrastructure as Code.
 *
 * Replaces railway.json, which Railway silently ignores on services created
 * after a certain point: it is read for nothing, so the pre-deploy command and
 * the health check simply never apply and the deploy succeeds anyway. On
 * luxury-gardens that meant the release-step migration never ran for weeks and
 * nothing said so. Declare it here instead, and check the deployment manifest
 * rather than trusting a green deploy.
 *
 * NOT applied on push. After changing this file:
 *   railway config plan    # read-only preview; read every line
 *   railway config apply   # changes the live project
 *
 * `partial` limits the file to what it declares, so the Postgres and bucket
 * services are never touched. A variable missing from `env` is DELETED on apply:
 * add new variables here in the same change that adds them to env.example.
 */
import { defineRailway, github, preserve, project, service } from 'railway/iac'

export const partial = 'fionacorbett'

export default defineRailway(() => {
  const site = service('fionacorbett', {
    source: github('Open-Waters-Digital/fionacorbett', { branch: 'main' }),
    build: { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile' },
    // The Payload binary directly, not `pnpm run migrate`, and this was verified
    // against the built image rather than assumed.
    //
    // pnpm IS present in the runtime image — the runtime stage extends `base`,
    // which enables corepack — so the problem is not that the binary is missing.
    // It is that only package.json is copied in, not pnpm-lock.yaml, so pnpm's
    // dependency-status check decides the tree is stale and shells out to
    // install as a user that cannot write. It dies inside `runDepsStatusCheck`,
    // naming neither the missing lockfile nor the auto-install it attempted.
    //
    // `payload` is a production dependency, so its binary is already here and
    // runs without any of that.
    //
    // Runs once, in its own container, after the build and before the new
    // version takes traffic. Once rather than per replica, which is the race
    // that makes migrating on container start wrong.
    preDeploy: 'node_modules/.bin/payload migrate',
    healthcheck: '/health',
    healthcheckTimeout: 60,
    // One replica, and the rate limiter depends on it: it is an in-memory map,
    // so a second replica would halve its effect without any signal that it had.
    // Moving it to a shared store is on the pre-launch list in AGENTS.md, and
    // that is the change that unblocks scaling this number.
    replicas: 1,
    // Railway's default is ON_FAILURE. Declaring the type leaves a permanent
    // one-line diff in every plan, because Railway stores the default as null.
    deploy: { restartPolicyMaxRetries: 5 },
    // Values stay in the Railway dashboard. preserve() keeps them.
    env: {
      DATABASE_URL: preserve(),
      // The Postgres service's public proxy URL. The private network does not
      // exist during a build, so this is the one the build uses.
      DATABASE_BUILD_URL: preserve(),
      PAYLOAD_SECRET: preserve(),
      NEXT_PUBLIC_SITE_URL: preserve(),
      SITE_ENV: preserve(),
      S3_ACCESS_KEY_ID: preserve(),
      S3_SECRET_ACCESS_KEY: preserve(),
      S3_BUCKET: preserve(),
      S3_ENDPOINT: preserve(),
      S3_REGION: preserve(),
      // The human check on the memory form. Production refuses submissions
      // until both are set — see src/lib/memories/turnstile.ts — so these are
      // required before the share link goes out, not before the site deploys.
      TURNSTILE_SECRET_KEY: preserve(),
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: preserve(),
      // SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are deliberately absent. They
      // are read by `pnpm run seed`, which is a local bootstrap for an empty
      // database and is never part of a deploy — nothing in the image or the
      // pre-deploy command runs it. Listing them here would ask Railway to
      // preserve variables that should not exist on the service.
    },
  })

  return project('fionacorbett.co.uk', { resources: [site] })
})
