// next.config.js
module.exports = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
  images: {
    domains: [
      "drive.google.com",
      "i.postimg.cc", // ✅ add this
    ],
  },
};
