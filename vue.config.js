module.exports = {
  // if the app is supposed to run on Github Pages in a subfolder, use the following config:
  // publicPath: process.env.NODE_ENV === "production" ? "/townsquare/" : "/"
  publicPath: process.env.NODE_ENV === "production" ? "/" : "/",
  lintOnSave: false,
  devServer: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: "all"
  }
};
