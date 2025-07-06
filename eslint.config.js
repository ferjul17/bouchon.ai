import eslintConfig from './packages/eslint-config/index.js'

export default [
  ...(await eslintConfig),
  {
    ignores: ['dist', 'node_modules'],
  },
]