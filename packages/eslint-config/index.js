import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  typescript: true,
  rules: {
    'no-console': 'off',
    'style/comma-dangle': 'off',
    'style/brace-style': 'off',
    'style/arrow-parens': 'off',
    'style/jsx-one-expression-per-line': 'off',
    'style/member-delimiter-style': 'off',
    'antfu/if-newline': 'off',
    'style/multiline-ternary': 'off',
    'style/operator-linebreak': 'off',
  },
})
