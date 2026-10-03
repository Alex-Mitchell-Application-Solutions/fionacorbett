import type { Metadata } from 'next'

import { PageHero } from '@/components/layout/PageHero'
import { MemoryCard } from '@/components/memories/MemoryCard'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'
import { getApprovedMemories, getSiteSettings } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Memories of Fiona',
  description: 'What the people who know Fiona wanted to say.',
}

/**
 * The approved memories.
 *
 * Newest first, so someone who has just sent one and been told it is checked
 * first can come back and find theirs at the top rather than hunting for it.
 */
export default async function MemoriesPage() {
  const [settings, memories] = await Promise.all([getSiteSettings(), getApprovedMemories()])

  return (
    <>
      <PageHero
        image={settings.memoriesHero}
        title={settings.memoriesTitle}
        lead={settings.memoriesLead}
        aside={
          memories.length > 0 ? (
            <p className="title-face text-lg">
              {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
            </p>
          ) : null
        }
      />

      <Container width="content" className="section-y">
        {memories.length === 0 ? (
          // Seen on the day this deploys and for as long as it takes the first
          // person to write something. Worded as an invitation rather than as an
          // absence, because whoever reads it is exactly the person who could
          // fix it.
          <div className="max-w-measure">
            <Heading level={2} size={3}>
              Nothing here yet
            </Heading>
            <Text size="lead" className="mt-5">
              Yours could be the first. It does not need to be long — a few lines about when you met
              her, or something she did that you have never forgotten.
            </Text>
            <Button href="/tell-fiona" variant="link" size="lg" className="mt-8">
              Tell Fiona what she means to you
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-16 md:gap-20">
              {memories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </div>

            {/* Repeated at the foot. Someone who has just read thirty memories
                about Fiona is the likeliest person on the site to want to add
                one, and making them scroll back to the header is how that does
                not happen. */}
            <div className="mt-20 border-t border-line pt-10">
              <Button href="/tell-fiona" variant="link" size="lg">
                Add yours
              </Button>
            </div>
          </>
        )}
      </Container>
    </>
  )
}
