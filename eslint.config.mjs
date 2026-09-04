import eslintConfigStorefront from '@scayle/eslint-config-storefront'

export default eslintConfigStorefront().append({
  rules: {
    'sonarjs/cognitive-complexity': 0,
  },
})
