import eslintConfigStorefront from '@scayle/eslint-config-storefront'

export default eslintConfigStorefront({ isNuxt: false }).append(
  {
    rules: {
      'sonarjs/cognitive-complexity': 0,
    },
  },
)
