import type { CodegenConfig } from '@graphql-codegen/cli'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const config: CodegenConfig = {
  overwrite: true,
  schema: {
    [process.env.WORDPRESS_API_URL]: {
      headers: {
        Authorization: `Bearer ${process.env.WORDPRESS_AUTH_REFRESH_TOKEN}`,
      },
    },
  },
  documents: 'lib/api.ts',
  ignoreNoDocuments: true,
  generates: {
    'lib/gql/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        // disable fragment masking as api is in a single file
        // TODO: refactor api into co-located framgments and components
        fragmentMasking: false,
        // prevents ESLint complaining about React hooks
        // fragmentMasking: { unmaskFunctionName: 'getFragmentData' }
      },
    },
  },
  config: {
    documentMode: 'string',
  },
}

export default config
