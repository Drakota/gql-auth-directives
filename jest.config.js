require("dotenv").config({ path: ".env.test" });

module.exports = {
  preset: "ts-jest",
  roots: ["tests"],
  testEnvironment: "node",
  coverageReporters: ["json-summary", "text", "lcov"],
};
