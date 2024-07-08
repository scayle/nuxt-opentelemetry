module.exports = {
  // Run `dprint` on all staged files that will not be covered by `eslint`.
  // This is done, do avoid race conditions due to lint-staged task concurrency.
  // https://github.com/okonet/lint-staged#task-concurrency
  '*{json,scss,css,md}': ['yarn dprint fmt'],
  // Run first `dprint`, followed by `eslint` on all relevant files.
  // This takes care of first formatting and then applying linting fixes to files.
  '*{cjs,mjs,js,ts,vue}': ['yarn dprint fmt', 'yarn eslint --fix'],
}
