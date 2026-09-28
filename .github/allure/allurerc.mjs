// CI-only Allure config. singleFile inlines the report data and every
// attachment (screenshots included) into one index.html, so the report can be
// uploaded unzipped and opened straight from disk. A multi-file report cannot:
// the browser blocks its data fetches from file://.
export default {
  plugins: {
    awesome: {
      options: {
        singleFile: true,
      },
    },
  },
};
