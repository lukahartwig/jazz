module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          "@babel/plugin-transform-classes": {
            loose: false,
          },
        },
      ],
    ],
    plugins: [
      // Custom Zod transformer
      "./babel-plugin-transform-zod.js",
    ],
  };
};
