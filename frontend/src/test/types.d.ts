import "@testing-library/jest-dom";
import { matchers } from "@testing-library/jest-dom/matchers";

declare global {
  namespace jest {
    interface Matchers<R> extends matchers {}
  }
}