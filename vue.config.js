module.exports = {
  // GitHub Pages project site: https://<user>.github.io/<repo>/
  publicPath:
    process.env.VUE_APP_PUBLIC_PATH ||
    (process.env.NODE_ENV === "production" ? "/BOTC_GrimoireTool_TW/" : "/"),
  lintOnSave: false,
  devServer: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: "all"
  }
};
