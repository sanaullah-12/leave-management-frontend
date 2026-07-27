// Lottie animation JSON imports are treated as opaque data (avoids TS deep-inferring
// the large literal type; Vite bundles the JSON as a normal ESM default export).
declare module "*.lottie.json" {
  const value: any;
  export default value;
}
