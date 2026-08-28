import { defineConfig, mergeConfig } from "vitest/config";
import shared from "@flyte/config/vitest";

export default mergeConfig(shared, defineConfig({}));
