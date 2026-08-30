module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Inline Drizzle's generated .sql migration files as string modules.
      ["inline-import", { extensions: [".sql"] }],
    ],
  };
};
