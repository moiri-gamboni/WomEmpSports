import { useRouter } from 'next/router'
import ErrorPage from 'next/error'
import Head from 'next/head'
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  InferGetStaticPropsType,
} from 'next'
import Layout from '../../components/layout'

import { Flex } from '@chakra-ui/react'

import FixedWidthContainer from '../../components/fixed-width-container'
import Banner from '../../components/banner'

import {
  getPostsForNews,
  getPost,
  PostData,
  PreviewPostData,
} from '../../lib/api'

import { ParsedUrlQuery } from 'querystring'
import SectionWithHeading from '../../components/section-with-heading'
import { LanguageCodeFilterEnum } from '../../lib/gql/graphql'
import { codeToLocale, localeToCode } from '../../lib/util'
import { headings, missingContent } from '../../lib/localized-strings'

interface PostProps {
  post: PostData
  preview: boolean
}

export default function Post({
  post,
  preview,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const { locale, isFallback } = useRouter()
  const languageCode = localeToCode(locale)
  // TODO: Add better redirect page for missing translations
  if (!isFallback && !post?.slug) {
    return <ErrorPage statusCode={404} />
  }

  const translationsLinks = {}
  for (const translation of post.translations) {
    translationsLinks[translation.language.code] = translation.slug
  }

  return (
    <Layout
      preview={preview}
      translationsLinks={
        Object.keys(translationsLinks).length && translationsLinks
      }
    >
      <Head>
        <title>{`WomEmpSports Home`}</title>
      </Head>
      <Flex
        align='center'
        as='article'
        direction='column'
        w='full'
        alignItems='stretch'
      >
        <Banner
          src={post.featuredImage?.node.sourceUrl}
          alt={post.featuredImage?.node.altText}
          imageProps={{
            width: post.featuredImage?.node.mediaDetails.width,
            height: post.featuredImage?.node.mediaDetails.height,
            sx: {
              objectFit: 'cover',
              // 2269/562 is the default banner size
              // this ensures the taller images aren't too large and don't get clipped
              maxH: 'max(calc(var(--chakra-sizes-5xl)/(2269/562)), calc(100vw/(2269/562)))',
              height: 'auto',
              width: 'full',
            },
          }}
        />

        <FixedWidthContainer alignSelf='center'>
          {codeToLocale(post.language.code) === locale ? (
            <SectionWithHeading id='article-body' title={post.title}>
              <div dangerouslySetInnerHTML={{ __html: post.content }}></div>
            </SectionWithHeading>
          ) : (
            <SectionWithHeading
              id='article-body'
              title={headings.missingTranslation[languageCode]}
            >
              <div>{missingContent.translation[languageCode]}</div>
            </SectionWithHeading>
          )}
        </FixedWidthContainer>
      </Flex>
    </Layout>
  )
}

interface PreviewData {
  post: PreviewPostData
}
interface Params extends ParsedUrlQuery {
  slug: string
}
export const getStaticProps: GetStaticProps<PostProps> = async ({
  params,
  preview = false,
  previewData,
  locale,
}: GetStaticPropsContext<Params, PreviewData>) => {
  // TODO: refactor out with preview.ts?
  // TODO: preview only works for drafts, not revisions
  const { slug, db_id } = params
  let id: string | number
  // Check that a well-formed db_id or slug was provided
  if (typeof db_id === 'string' && !slug) {
    id = parseInt(db_id)
  } else if (typeof slug === 'string' && !db_id) {
    id = slug
  } else {
    return {
      notFound: true,
    }
  }

  const post = await getPost(id, localeToCode(locale), previewData)

  if (!post) {
    return {
      notFound: true,
    }
  }
  return {
    props: {
      preview,
      post,
    },
    revalidate: 10,
  }
}

export const getStaticPaths: GetStaticPaths = (async () => {
  const allPosts = await getPostsForNews({
    language: LanguageCodeFilterEnum.All,
  })
  const posts = allPosts.map((post) => {
    return {
      params: {
        slug: post.slug,
      },
      locale: codeToLocale(post.language.code),
    }
  })

  return {
    paths: posts,
    fallback: 'blocking',
  }
}) satisfies GetStaticPaths
